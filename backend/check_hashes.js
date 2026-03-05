import { prisma } from './src/config/db.js';

async function main() {
    try {
        const employees = await prisma.employee.findMany({ select: { id: true, firstName: true, password: true } });
        console.log("Current Hashes:", JSON.stringify(employees, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
