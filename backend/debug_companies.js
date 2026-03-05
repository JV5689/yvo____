import { prisma } from './src/config/db.js';

async function main() {
    try {
        const companies = await prisma.company.findMany();
        console.log("Companies:", JSON.stringify(companies, null, 2));
    } catch (err) {
        console.error("Error fetching companies:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
