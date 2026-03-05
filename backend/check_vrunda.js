import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkVrunda() {
    try {
        const company = await prisma.company.findFirst({
            where: { name: { contains: 'Vrunda', } }
        });

        if (company) {
            console.log('Found Company:', company.name);
            const membership = await prisma.userMembership.findFirst({
                where: { companyId: company.id, role: 'OWNER' },
                include: { user: true }
            });
            if (membership) {
                console.log('Owner email:', membership.user.email);
            } else {
                console.log('No owner found for company');
            }
        } else {
            // Let's also look for users with vrunda in their name/email
            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: { contains: 'vrunda', } },
                        { fullName: { contains: 'vrunda', } }
                    ]
                }
            });
            if (user) {
                console.log('Found user:', user.fullName, 'email:', user.email);
            } else {
                console.log('No company or user with Vrunda found in database.');
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkVrunda();
