require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Turso & Prisma Imports
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

// Initialize Turso Prisma Adapter
const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});
const prisma = new PrismaClient({ adapter });

const app = express();
const API_KEY = process.env.API_KEY || 'COqDemyg9y4sCN3VYhuxJyGkhnMDcwLpavcSAWRnGL99ZfToaHpWOoBcNVqmgdyT';

// Security & Middleware
app.use(helmet());
app.use(express.json());

const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
        if (process.env.NODE_ENV !== 'production' || isLocalhost || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

// Basic API Key Auth
const authenticate = (req, res, next) => {
    if (req.method === 'OPTIONS' || process.env.NODE_ENV !== 'production') return next();
    const auth = req.headers.authorization;
    if (!auth || auth !== `Bearer ${API_KEY}`) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

// --- ROUTES ---

app.get('/api/anomalies', authenticate, async (req, res) => {
    try {
        const { search } = req.query;
        let where = {};
        if (search) {
            where = {
                OR: [
                    { title: { contains: search } },
                    { agency: { contains: search } },
                    { contractor_name: { contains: search } }
                ]
            };
        }
        const anomalies = await prisma.anomaly.findMany({
            where,
            orderBy: { contract_amount_php: 'desc' },
            take: search ? 100 : 50
        });
        res.json(anomalies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch anomalies' });
    }
});

const ESSENTIAL_COMMODITIES = [
    "Well-Milled Rice",
    "Canned Sardines",
    "Instant Noodles",
    "Daily Minimum Wage (NCR)",
    "Classroom Construction",
    "DepEd Textbook",
    "PhilHealth Monthly Premium"
];

app.get('/api/convert/:anomalyId', authenticate, async (req, res) => {
    try {
        const { anomalyId } = req.params;
        const anomaly = await prisma.anomaly.findUnique({ where: { id: anomalyId } });
        if (!anomaly) return res.status(404).json({ error: 'Anomaly not found' });

        const latestCommodities = await prisma.commodity.findMany({
            where: {
                name: {
                    in: ESSENTIAL_COMMODITIES
                }
            },
            orderBy: { effective_date: 'desc' },
            distinct: ['name']
        });
        if (!latestCommodities.length) {
            return res.status(500).json({ error: 'No commodity baseline data available' });
        }

        const conversions = latestCommodities.map(item => {
            const unitCost = item.base_price_php * item.base_unit_multiplier;
            const quantityEquivalent = Math.floor(anomaly.contract_amount_php / unitCost);
            return {
                metric_name: item.display_unit_name,
                quantity_equivalent: quantityEquivalent,
                unit_cost: unitCost,
                icon_slug: item.icon_slug,
                source_date: item.effective_date
            };
        });

        res.json({
            anomaly: {
                id: anomaly.id,
                title: anomaly.title,
                amount_php: anomaly.contract_amount_php,
                agency: anomaly.agency,
                source: anomaly.source_url,
                contractor_name: anomaly.contractor_name,
                philgeps_reference_no: anomaly.philgeps_reference_no,
                status: anomaly.status
            },
            conversions: conversions.sort((a, b) => b.quantity_equivalent - a.quantity_equivalent)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process conversion' });
    }
});

app.get('/api/commodities', authenticate, async (req, res) => {
    try {
        const latestCommodities = await prisma.commodity.findMany({
            where: {
                name: {
                    in: ESSENTIAL_COMMODITIES
                }
            },
            orderBy: { effective_date: 'desc' },
            distinct: ['name']
        });
        res.json(latestCommodities);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch commodities' });
    }
});

// Export for Vercel serverless — do NOT call app.listen()
module.exports = app;
