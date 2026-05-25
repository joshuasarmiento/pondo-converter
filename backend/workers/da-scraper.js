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

  // 1. Cross-month range: "April 27-May 2, 2026"
  const crossMonthMatch = cleaned.match(/^([A-Za-z]+)\s+(\d+)\s*-\s*([A-Za-z]+)\s+(\d+),\s*(\d{4})$/);
  if (crossMonthMatch) {
    const [_, m1, d1, m2, d2, year] = crossMonthMatch;
    const start = new Date(`${m1} ${d1}, ${year}`);
    const end = new Date(`${m2} ${d2}, ${year}`);
    if (!isNaN(start) && !isNaN(end)) return { start, end };
  }

  // 2. Same-month range: "May 11-16, 2026"
  const sameMonthMatch = cleaned.match(/^([A-Za-z]+)\s+(\d+)\s*-\s*(\d+),\s*(\d{4})$/);
  if (sameMonthMatch) {
    const [_, month, d1, d2, year] = sameMonthMatch;
    const start = new Date(`${month} ${d1}, ${year}`);
    const end = new Date(`${month} ${d2}, ${year}`);
    if (!isNaN(start) && !isNaN(end)) return { start, end };
  }

  // 3. Fallback: "December 19, 2018"
  const singleDate = new Date(cleaned);
  if (!isNaN(singleDate)) {
    return { start: new Date(singleDate), end: new Date(singleDate) };
  }

  // Try extracting any date substring
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

    // Suppress low-level TrueType font parser warnings
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
      
      // Skip page number indicators
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

// --- Main Ingestion Logic ---

async function runDAIngestion() {
    console.log("Starting DA Ingestion Worker...");

    // 1. Get latest links
    const links = await getDailyLinks();
    if (!links.length) {
        console.log("No links found on DA website.");
        await prisma.$disconnect();
        return;
    }

    // Get the most recent link
    const latestLink = links[0];
    console.log(`Fetching and parsing latest PDF: ${latestLink.url} (${latestLink.date})`);
    
    const parsedData = await parsePDF(latestLink.url);
    if (!parsedData.data.length) {
        console.log("No data extracted from PDF.");
        await prisma.$disconnect();
        return;
    }

    // Parse date from PDF label
    const dateRange = parseDateRange(latestLink.date);
    const effectiveDate = dateRange ? dateRange.end : new Date(); // Use end of the range as the date
    console.log(`Setting effective date to: ${effectiveDate.toISOString()}`);

    let upsertCount = 0;

    for (const item of parsedData.data) {
        const isRice = item.commodity.toLowerCase().includes('rice') || 
                       item.commodity.toLowerCase().includes('milled') || 
                       item.category.toLowerCase().includes('rice');

        if (!isRice) continue;

        const priceFloat = parseFloat(item.price.replace(/,/g, ''));
        if (isNaN(priceFloat)) continue;

        // Normalizing the names and setting the multipliers
        let normalizedName = item.commodity;
        let base_unit_multiplier = 50;
        let icon_slug = "rice-sack";
        let category = "Agriculture/Food";

        if (normalizedName.toLowerCase().includes('well milled') || normalizedName.toLowerCase().includes('well-milled')) {
            normalizedName = "Well-Milled Rice";
        } else if (normalizedName.toLowerCase().includes('regular milled') || normalizedName.toLowerCase().includes('regular-milled')) {
            normalizedName = "Regular Milled Rice";
        } else {
            // Ignore specialty/luxury/non-essential rice varieties (Basmati, Japonica, etc.)
            continue;
        }

        let display_unit_name = "50kg Sack of " + normalizedName;

        try {
            await prisma.commodity.upsert({
                where: {
                    name_effective_date: {
                        name: normalizedName,
                        effective_date: effectiveDate
                    }
                },
                update: {
                    base_price_php: priceFloat
                },
                create: {
                    name: normalizedName,
                    category: category,
                    base_price_php: priceFloat,
                    unit_of_measurement: isRice ? 'kg' : 'pcs',
                    base_unit_multiplier: base_unit_multiplier,
                    display_unit_name: display_unit_name,
                    icon_slug: icon_slug,
                    effective_date: effectiveDate,
                    source_url: latestLink.url
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
}

runDAIngestion();