import { prisma } from './src/config/db.js';

async function main() {
    try {
        const plans = await prisma.plan.findMany();
        console.log("Plans:", JSON.stringify(plans, null, 2));
    } catch (err) {
        console.error("Error fetching plans:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
