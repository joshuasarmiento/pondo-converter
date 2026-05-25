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
    "Daily Minimum Wage",
    "Classroom Construction",
    "DepEd Textbook",
    "PhilHealth Monthly Premium"
];

app.get('/api/convert/:anomalyId', authenticate, async (req, res) => {
    try {
        const { anomalyId } = req.params;
        const anomaly = await prisma.anomaly.findUnique({ where: { id: anomalyId } });
        if (!anomaly) return res.status(404).json({ error: 'Anomaly not found' });

        const { region } = req.query;
        const activeRegion = region || 'NCR';

        const latestCommodities = await prisma.commodity.findMany({
            where: {
                name: {
                    in: ESSENTIAL_COMMODITIES
                },
                region: {
                    in: [activeRegion, 'National']
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
        const { region } = req.query;
        const activeRegion = region || 'NCR';

        const latestCommodities = await prisma.commodity.findMany({
            where: {
                name: {
                    in: ESSENTIAL_COMMODITIES
                },
                region: {
                    in: [activeRegion, 'National']
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

// Save User Budget Reallocation
app.post('/api/reallocations', authenticate, async (req, res) => {
    try {
        const { anomalyId, allocations } = req.body;
        if (!anomalyId || !allocations) {
            return res.status(400).json({ error: 'Missing anomalyId or allocations' });
        }

        const reallocation = await prisma.reallocation.create({
            data: {
                anomalyId,
                allocations: typeof allocations === 'string' ? allocations : JSON.stringify(allocations)
            }
        });
        res.json(reallocation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save reallocation' });
    }
});

// Get Aggregated "People's Budget" Consensus
app.get('/api/reallocations/:anomalyId', authenticate, async (req, res) => {
    try {
        const { anomalyId } = req.params;
        const submissions = await prisma.reallocation.findMany({
            where: { anomalyId }
        });

        if (!submissions.length) {
            return res.json({ totalSubmissions: 0, averages: {} });
        }

        const totals = {};
        let count = 0;

        submissions.forEach(sub => {
            try {
                const alloc = JSON.parse(sub.allocations);
                Object.keys(alloc).forEach(key => {
                    totals[key] = (totals[key] || 0) + parseFloat(alloc[key]);
                });
                count++;
            } catch (e) {}
        });

        const averages = {};
        if (count > 0) {
            Object.keys(totals).forEach(key => {
                averages[key] = Math.round((totals[key] / count) * 10) / 10;
            });
        }

        res.json({
            totalSubmissions: count,
            averages
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to aggregate reallocations' });
    }
});

// Civic Transparency Dashboard Analytics
app.get('/api/analytics', authenticate, async (req, res) => {
    try {
        const anomalies = await prisma.anomaly.findMany();
        const totalContractAmount = anomalies.reduce((sum, item) => sum + item.contract_amount_php, 0);
        
        const agencyMap = {};
        anomalies.forEach(item => {
            agencyMap[item.agency] = (agencyMap[item.agency] || 0) + item.contract_amount_php;
        });
        const agencyLeaderboard = Object.keys(agencyMap).map(name => ({
            name,
            total_amount_php: agencyMap[name]
        })).sort((a, b) => b.total_amount_php - a.total_amount_php).slice(0, 5);

        const contractorMap = {};
        anomalies.forEach(item => {
            if (item.contractor_name) {
                contractorMap[item.contractor_name] = (contractorMap[item.contractor_name] || 0) + item.contract_amount_php;
            }
        });
        const contractorLeaderboard = Object.keys(contractorMap).map(name => ({
            name,
            total_amount_php: contractorMap[name]
        })).sort((a, b) => b.total_amount_php - a.total_amount_php).slice(0, 5);

        const latestCommodities = await prisma.commodity.findMany({
            where: {
                name: {
                    in: ESSENTIAL_COMMODITIES
                },
                region: 'NCR'
            },
            orderBy: { effective_date: 'desc' },
            distinct: ['name']
        });

        const nationalSpecific = await prisma.commodity.findMany({
            where: {
                name: {
                    in: ESSENTIAL_COMMODITIES
                },
                region: 'National'
            },
            orderBy: { effective_date: 'desc' },
            distinct: ['name']
        });

        const combinedCommodities = [...latestCommodities, ...nationalSpecific];

        const nationalEquivalents = combinedCommodities.map(item => {
            const unitCost = item.base_price_php * item.base_unit_multiplier;
            return {
                metric_name: item.display_unit_name,
                quantity_equivalent: Math.floor(totalContractAmount / unitCost),
                icon_slug: item.icon_slug
            };
        });

        res.json({
            total_contract_amount_php: totalContractAmount,
            total_anomalies_count: anomalies.length,
            agency_leaderboard: agencyLeaderboard,
            contractor_leaderboard: contractorLeaderboard,
            national_equivalents: nationalEquivalents.sort((a, b) => b.quantity_equivalent - a.quantity_equivalent)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to load analytics' });
    }
});

// Export for Vercel serverless — do NOT call app.listen()
module.exports = app;
