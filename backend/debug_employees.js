import { prisma } from './src/config/db.js';

async function main() {
    try {
        const employees = await prisma.employee.findMany({ select: { id: true, firstName: true, phone: true } });
        console.log("Employees Found:", employees);
    } catch (err) {
        console.error("Error fetching employees:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
