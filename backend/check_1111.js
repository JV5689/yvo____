import { prisma } from './src/config/db.js';

async function main() {
    try {
        const employee = await prisma.employee.findFirst({
            where: {
                phone: { contains: '1111111111' }
            }
        });
        if (employee) {
            console.log("Employee Found:", JSON.stringify(employee, null, 2));
        } else {
            console.log("Employee with phone 1111111111 not found.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
