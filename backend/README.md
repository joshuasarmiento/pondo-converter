# Backend

Express API server na kumonekta sa Turso DB gamit ang Prisma. Nagse-serve ng endpoints para sa anomalies, conversions, at commodity prices. May built-in cron job para sa daily DA price scraping.

## Stack

- **Runtime**: Node.js / Bun
- **Framework**: Express
- **Database**: Turso (LibSQL)
- **ORM**: Prisma

## Setup

```bash
bun install
cp .env.example .env   # fill in your credentials
bun run db:push        # apply schema to Turso
bun dev                # http://localhost:3001
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/anomalies` | List contracts. Supports `?search=` |
| GET | `/api/convert/:id` | Convert contract amount to commodity equivalents |
| GET | `/api/commodities` | List latest commodity prices |
| GET | `/api/cron/scrape-prices` | Manually trigger DA price scraper (needs `CRON_SECRET`) |

## Environment Variables

See [`.env.example`](./.env.example) for all required vars.

## Data Ingestion (PhilGEPS)

If you have `philgeps.parquet`:

```bash
python3 -m venv venv && ./venv/bin/pip install duckdb
./venv/bin/python extract_top_contracts.py
node prisma/import_parquet.js
```

## Cron Job

The DA price scraper runs daily at **9:00 AM PHT** via Vercel Cron (`/api/cron/scrape-prices`). Protect it with `CRON_SECRET` in your env vars.
