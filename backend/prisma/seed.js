require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    console.log('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL);
    console.log('Seeding Database...');

    // 1. Seed Commodities
    const commodities = [
        {
            name: "Well-Milled Rice",
            category: "Agriculture/Food",
            base_price_php: 52.0,
            unit_of_measurement: "kg",
            base_unit_multiplier: 50.0,
            display_unit_name: "50kg Sack of Well-Milled Rice",
            icon_slug: "rice-sack",
            effective_date: new Date("2026-05-01"),
            source_url: "https://www.da.gov.ph"
        },
        {
            name: "Premium Rice",
            category: "Agriculture/Food",
            base_price_php: 60.0,
            unit_of_measurement: "kg",
            base_unit_multiplier: 50.0,
            display_unit_name: "50kg Sack of Premium Rice",
            icon_slug: "rice-sack",
            effective_date: new Date("2026-05-01"),
            source_url: "https://www.da.gov.ph"
        },
        {
            name: "Canned Sardines",
            category: "Food & Groceries",
            base_price_php: 22.0,
            unit_of_measurement: "can",
            base_unit_multiplier: 1.0,
            display_unit_name: "Can of Sardines (155g)",
            icon_slug: "sardines-can",
            effective_date: new Date("2026-05-01"),
            source_url: "https://www.dti.gov.ph"
        },
        {
            name: "Instant Noodles",
            category: "Food & Groceries",
            base_price_php: 9.50,
            unit_of_measurement: "pack",
            base_unit_multiplier: 1.0,
            display_unit_name: "Instant Noodle Packet",
            icon_slug: "noodles-pack",
            effective_date: new Date("2026-05-01"),
            source_url: "https://www.dti.gov.ph"
        },
        {
            name: "Daily Minimum Wage",
            category: "Labor",
            base_price_php: 610.0,
            unit_of_measurement: "day",
            base_unit_multiplier: 1.0,
            display_unit_name: "Days of Minimum Wage (NCR)",
            icon_slug: "daily-wage",
            effective_date: new Date("2026-05-01"),
            source_url: "https://www.dole.gov.ph"
        },
        {
            name: "Classroom Construction",
            category: "Infrastructure/Education",
            base_price_php: 2500000.0,
            unit_of_measurement: "classroom",
            base_unit_multiplier: 1.0,
            display_unit_name: "Standard Public School Classrooms",
            icon_slug: "classroom",
            effective_date: new Date("2026-05-01"),
            source_url: "https://www.deped.gov.ph"
        },
        {
            name: "DepEd Textbook",
            category: "Education",
            base_price_php: 150.0,
            unit_of_measurement: "book",
            base_unit_multiplier: 1.0,
            display_unit_name: "Public School Textbooks",
            icon_slug: "textbook",
            effective_date: new Date("2026-05-01"),
            source_url: "https://www.deped.gov.ph"
        },
        {
            name: "PhilHealth Monthly Premium",
            category: "Healthcare",
            base_price_php: 500.0,
            unit_of_measurement: "month",
            base_unit_multiplier: 1.0,
            display_unit_name: "Months of PhilHealth Coverage",
            icon_slug: "healthcare",
            effective_date: new Date("2026-05-01"),
            source_url: "https://www.philhealth.gov.ph"
        },
        // --- Region VII (Central Visayas - Cebu) Regional Commodities ---
        {
            name: "Well-Milled Rice",
            category: "Agriculture/Food",
            base_price_php: 55.0,
            unit_of_measurement: "kg",
            base_unit_multiplier: 50.0,
            display_unit_name: "50kg Sack of Well-Milled Rice",
            icon_slug: "rice-sack",
            effective_date: new Date("2026-05-01"),
            region: "Region VII",
            source_url: "https://www.da.gov.ph"
        },
        {
            name: "Daily Minimum Wage",
            category: "Labor",
            base_price_php: 468.0,
            unit_of_measurement: "day",
            base_unit_multiplier: 1.0,
            display_unit_name: "Days of Minimum Wage (Cebu)",
            icon_slug: "daily-wage",
            effective_date: new Date("2026-05-01"),
            region: "Region VII",
            source_url: "https://www.dole.gov.ph"
        },
        // --- Region XI (Davao) Regional Commodities ---
        {
            name: "Well-Milled Rice",
            category: "Agriculture/Food",
            base_price_php: 54.5,
            unit_of_measurement: "kg",
            base_unit_multiplier: 50.0,
            display_unit_name: "50kg Sack of Well-Milled Rice",
            icon_slug: "rice-sack",
            effective_date: new Date("2026-05-01"),
            region: "Region XI",
            source_url: "https://www.da.gov.ph"
        },
        {
            name: "Daily Minimum Wage",
            category: "Labor",
            base_price_php: 481.0,
            unit_of_measurement: "day",
            base_unit_multiplier: 1.0,
            display_unit_name: "Days of Minimum Wage (Davao)",
            icon_slug: "daily-wage",
            effective_date: new Date("2026-05-01"),
            region: "Region XI",
            source_url: "https://www.dole.gov.ph"
        }
    ];

    for (const c of commodities) {
        const isRegional = c.name.includes("Rice") || c.name.includes("Wage");
        const region = c.region || (isRegional ? "NCR" : "National");
        const cWithRegion = { ...c, region };

        await prisma.commodity.upsert({
            where: {
                name_effective_date_region: {
                    name: c.name,
                    effective_date: c.effective_date,
                    region: region
                }
            },
            update: {},
            create: cWithRegion
        });
    }
    console.log(`Upserted ${commodities.length} commodities.`);

    // 2. Seed Anomalies
    const anomalies = [
        {
            title: "Overpriced DepEd Laptops Procurement",
            agency: "Department of Education (DepEd)",
            contract_amount_php: 2400000000.0,
            date_awarded: new Date("2021-06-30"),
            contractor_name: "Commoner-LD Joint Venture",
            philgeps_reference_no: "PH-7889102",
            source_url: "https://www.senate.gov.ph",
            status: "Audited/Flagged"
        },
        {
            title: "Pharmally COVID-19 Medical Supplies Contract",
            agency: "Procurement Service - Department of Budget and Management (PS-DBM)",
            contract_amount_php: 11500000000.0,
            date_awarded: new Date("2020-04-15"),
            contractor_name: "Pharmally Pharmaceutical Corp.",
            philgeps_reference_no: "PH-6754321",
            source_url: "https://www.senate.gov.ph",
            status: "Under Investigation"
        },
        {
            title: "Overpriced SEA Games Cauldron Structure",
            agency: "Philippine Sports Commission (PSC)",
            contract_amount_php: 55000000.0,
            date_awarded: new Date("2019-09-12"),
            contractor_name: "Monolith Construction",
            philgeps_reference_no: "PH-5432109",
            source_url: "https://www.coa.gov.ph",
            status: "Completed"
        },
        {
            title: "DOH Overpriced Face Shields Procurement",
            agency: "Department of Health (DOH)",
            contract_amount_php: 320000000.0,
            date_awarded: new Date("2020-08-20"),
            contractor_name: "Pharmally Pharmaceutical Corp.",
            philgeps_reference_no: "PH-8899123",
            source_url: "https://www.senate.gov.ph",
            status: "Audited/Flagged"
        },
        {
            title: "Rehabilitation Feasibility Study for BNPP",
            agency: "Department of Energy (DOE)",
            contract_amount_php: 300000000.0,
            date_awarded: new Date("2023-02-14"),
            contractor_name: "Global Energy Consultants",
            philgeps_reference_no: "PH-9922110",
            source_url: "https://www.doe.gov.ph",
            status: "Awarded"
        }
    ];

    for (const a of anomalies) {
        await prisma.anomaly.upsert({
            where: { philgeps_reference_no: a.philgeps_reference_no },
            update: {},
            create: a
        });
    }
    console.log(`Upserted ${anomalies.length} anomalies.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
