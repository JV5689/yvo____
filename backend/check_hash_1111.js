import { prisma } from './src/config/db.js';

async function main() {
    try {
        const employee = await prisma.employee.findFirst({
            where: {
                phone: { contains: '1111111111' }
            }
        });
        if (employee) {
            console.log("Hash found:", employee.password);
        } else {
            console.log("No employee found.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
