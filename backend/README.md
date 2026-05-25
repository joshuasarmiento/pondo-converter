# Pondo Converter — Backend

The backend server for the Pondo Converter application. It connects to a Turso database using Prisma and serves API endpoints to fetch anomalies (with dynamic search filtering) and calculate opportunity cost conversions against a baseline basket of consumer commodities.

## Technology Stack

- **Runtime**: [Bun](https://bun.sh/) / [Node.js](https://nodejs.org/)
- **Framework**: Express
- **Database**: Turso (hosted LibSQL)
- **ORM**: Prisma
- **Data Query Engine**: Python 3 + DuckDB (for ingestion of the 500MB `philgeps.parquet` dataset)

## Key Features

1. **`GET /api/anomalies`**: Fetches the list of procurement anomalies or contracts. Supports an optional `?search=` query parameter that searches case-insensitively across project titles, procuring agencies, and contractor names.
2. **`GET /api/convert/:anomalyId`**: Fetches details for a specific contract and calculates its value equivalent in terms of standard commodities (e.g., sacks of rice, NCR minimum wage days, public school classrooms, textbooks, and health coverage months).
3. **Data Ingestion System**: Scripts to parse, filter, and upload 2,500 high-value records from the PhilGEPS Open Data parquet dataset.

## Setup & Ingestion

### 1. Installation
Install Node dependencies:
```bash
bun install
```

### 2. Database Configuration
Create a `.env` file in the root of this folder with your database credentials:
```env
TURSO_DATABASE_URL="libsql://your-db-url.turso.io"
TURSO_AUTH_TOKEN="your-auth-token"
API_KEY="your-backend-api-key"
PORT=3001
```

Apply database migrations:
```bash
bun run db:push
```

### 3. PhilGEPS Dataset Ingestion
If you have `philgeps.parquet` in this directory:

1. Create a Python virtual environment and install DuckDB:
   ```bash
   python3 -m venv venv
   ./venv/bin/pip install duckdb
   ```
2. Extract the top 2,500 contracts into a JSON format:
   ```bash
   ./venv/bin/python extract_top_contracts.py
   ```
3. Load the JSON data into the Turso database:
   ```bash
   node prisma/import_parquet.js
   ```

## Development

Run the development server with live reload:
```bash
bun dev
```

The API will be available at `http://localhost:3001`.

## Disclaimer

This is an independent civic tech project developed for educational and public transparency purposes. It is not affiliated with, sponsored by, endorsed by, or in any way officially connected to the Commission on Audit (COA), PhilGEPS, the Department of Agriculture (DA), or any other agency of the Government of the Republic of the Philippines.
