require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const { PDFParse } = require('pdf-parse');

const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});
const prisma = new PrismaClient({ adapter });

// --- Helper Functions to Parse Dates ---

function parseDateRange(str) {
  if (!str) return null;
  const cleaned = str.trim().replace(/\s+/g, ' ');

  const crossMonthMatch = cleaned.match(/^([A-Za-z]+)\s+(\d+)\s*-\s*([A-Za-z]+)\s+(\d+),\s*(\d{4})$/);
  if (crossMonthMatch) {
    const [_, m1, d1, m2, d2, year] = crossMonthMatch;
    const start = new Date(`${m1} ${d1}, ${year}`);
    const end = new Date(`${m2} ${d2}, ${year}`);
    if (!isNaN(start) && !isNaN(end)) return { start, end };
  }

  const sameMonthMatch = cleaned.match(/^([A-Za-z]+)\s+(\d+)\s*-\s*(\d+),\s*(\d{4})$/);
  if (sameMonthMatch) {
    const [_, month, d1, d2, year] = sameMonthMatch;
    const start = new Date(`${month} ${d1}, ${year}`);
    const end = new Date(`${month} ${d2}, ${year}`);
    if (!isNaN(start) && !isNaN(end)) return { start, end };
  }

  const singleDate = new Date(cleaned);
  if (!isNaN(singleDate)) return { start: new Date(singleDate), end: new Date(singleDate) };

  const dateMatch = cleaned.match(/([A-Za-z]+ \d+, \d{4})/);
  if (dateMatch) {
    const d = new Date(dateMatch[1]);
    if (!isNaN(d)) return { start: d, end: d };
  }

  return null;
}

async function getDailyLinks() {
  try {
    const { data } = await axios.get("https://www.da.gov.ph/price-monitoring/", { timeout: 10000 });
    const dom = new JSDOM(data);
    const links = [];
    dom.window.document.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href') || '';
      const text = a.textContent.trim();
      if (href.endsWith('.pdf')) {
        links.push({
          date: text,
          url: href.startsWith('http') ? href : 'https://www.da.gov.ph' + (href.startsWith('/') ? '' : '/') + href
        });
      }
    });
    return links;
  } catch (e) {
    console.error("Failed to fetch price links:", e.message);
    return [];
  }
}

async function parsePDF(url) {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    const originalWarn = console.warn;
    console.warn = () => { };
    let pdf;
    try {
      pdf = new PDFParse(new Uint8Array(res.data));
      await pdf.load();
    } finally {
      console.warn = originalWarn;
    }

    const result = await pdf.getText();
    const lines = result.text.split('\n');
    const items = [];
    let category = 'GENERAL';

    lines.forEach(line => {
      const t = line.trim();
      if (!t || t.toLowerCase().includes('prevailing')) return;
      if (/^page\s+\d+/i.test(t) || t.toLowerCase().includes('page of') || t.toLowerCase().startsWith('page ')) return;

      const match = t.match(/\s+([\d,.]+|(?:\$)?n\/a(?:\$)?)$/i);
      if (match) {
        items.push({
          commodity: t.substring(0, match.index).replace(/[",]/g, '').trim(),
          price: match[1].replace(/\$/g, ''),
          category: category
        });
      } else if (t === t.toUpperCase() && t.length > 5) {
        category = t.replace(/[",]/g, '').trim();
      }
    });
    return { data: items };
  } catch (e) {
    console.error(`Failed to parse PDF ${url}:`, e.message);
    return { data: [] };
  }
}

async function runDAIngestion() {
  console.log("Starting DA Ingestion Worker...");
  const links = await getDailyLinks();
  if (!links.length) {
    console.log("No links found on DA website.");
    await prisma.$disconnect();
    return { upserted: 0, message: "No links found" };
  }

  const latestLink = links[0];
  console.log(`Fetching: ${latestLink.url} (${latestLink.date})`);

  const parsedData = await parsePDF(latestLink.url);
  if (!parsedData.data.length) {
    await prisma.$disconnect();
    return { upserted: 0, message: "No data extracted from PDF" };
  }

  const dateRange = parseDateRange(latestLink.date);
  const effectiveDate = dateRange ? dateRange.end : new Date();

  let upsertCount = 0;

  for (const item of parsedData.data) {
    const isRice = item.commodity.toLowerCase().includes('rice') || item.commodity.toLowerCase().includes('milled') || item.category.toLowerCase().includes('rice');
    const isSardine = item.commodity.toLowerCase().includes('sardine');
    const isNoodle = item.commodity.toLowerCase().includes('noodle');

    if (!isRice && !isSardine && !isNoodle) continue;

    const priceFloat = parseFloat(item.price.replace(/,/g, ''));
    if (isNaN(priceFloat)) continue;

    let normalizedName = item.commodity;
    let base_unit_multiplier = 1;
    let icon_slug = "default";
    let category = item.category || 'General';

    if (isRice) {
      if (normalizedName.toLowerCase().includes('well milled') || normalizedName.toLowerCase().includes('well-milled')) {
        normalizedName = "Well-Milled Rice";
      } else if (normalizedName.toLowerCase().includes('regular milled') || normalizedName.toLowerCase().includes('regular-milled')) {
        normalizedName = "Regular Milled Rice";
      } else {
        continue;
      }
      category = "Agriculture/Food";
    } else if (isSardine) {
      normalizedName = "Canned Sardines";
      category = "Food & Groceries";
    } else if (isNoodle) {
      normalizedName = "Instant Noodles";
      category = "Food & Groceries";
    }

    let display_unit_name = "1 unit of " + normalizedName;
    if (isRice) { display_unit_name = "50kg Sack of " + normalizedName; base_unit_multiplier = 50; icon_slug = "rice-sack"; }
    else if (isSardine) { display_unit_name = "Can of Sardines (155g)"; icon_slug = "sardines-can"; }
    else if (isNoodle) { display_unit_name = "Instant Noodle Packet"; icon_slug = "noodles-pack"; }

    try {
      await prisma.commodity.upsert({
        where: { name_effective_date: { name: normalizedName, effective_date: effectiveDate } },
        update: { base_price_php: priceFloat },
        create: {
          name: normalizedName, category, base_price_php: priceFloat,
          unit_of_measurement: isRice ? 'kg' : 'pcs',
          base_unit_multiplier, display_unit_name, icon_slug,
          effective_date: effectiveDate, source_url: latestLink.url
        }
      });
      upsertCount++;
      console.log(`Upserted: ${normalizedName} @ ₱${priceFloat}`);
    } catch (e) {
      console.error(`Failed to upsert ${normalizedName}:`, e.message);
    }
  }

  console.log(`Worker Complete: Upserted ${upsertCount} commodities.`);
  await prisma.$disconnect();
  return { upserted: upsertCount, effectiveDate };
}

// --- Vercel Serverless Handler ---
module.exports = async (req, res) => {
  // Protect this endpoint: only allow Vercel's cron caller or a manual secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await runDAIngestion();
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('Cron job failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
