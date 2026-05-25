require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const fs = require('fs');
const path = require('path');

const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});
const prisma = new PrismaClient({ adapter });

async function main() {
    const jsonPath = path.join(__dirname, '../philgeps_top_contracts.json');
    if (!fs.existsSync(jsonPath)) {
        console.error(`Error: File not found at ${jsonPath}`);
        process.exit(1);
    }

    console.log('Reading extracted contracts...');
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Found ${data.length} records to import.`);

    const batchSize = 100;
    let successCount = 0;

    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(data.length / batchSize)}...`);

        const promises = batch.map(async (item) => {
            try {
                // Determine award date
                const dateAwarded = item.date_awarded ? new Date(item.date_awarded) : null;

                await prisma.anomaly.upsert({
                    where: {
                        id: item.id
                    },
                    update: {
                        title: item.title,
                        agency: item.agency,
                        contract_amount_php: item.contract_amount_php,
                        date_awarded: dateAwarded,
                        contractor_name: item.contractor_name,
                        philgeps_reference_no: item.philgeps_reference_no,
                        source_url: item.source_url,
                        status: item.status
                    },
                    create: {
                        id: item.id,
                        title: item.title,
                        agency: item.agency,
                        contract_amount_php: item.contract_amount_php,
                        date_awarded: dateAwarded,
                        contractor_name: item.contractor_name,
                        philgeps_reference_no: item.philgeps_reference_no,
                        source_url: item.source_url,
                        status: item.status
                    }
                });
                successCount++;
            } catch (err) {
                console.error(`Failed to upsert contract ID ${item.id}:`, err.message);
            }
        });

        await Promise.all(promises);
    }

    console.log(`Successfully imported/updated ${successCount} contracts.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
