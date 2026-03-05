import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/security/hashing.js'; // Adjust path if needed

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Setting up test credentials for Company Admin and Employee...');

    // Get any company
    let company = await prisma.company.findFirst();
    if (!company) {
        throw new Error("No company found! Run seed_admin.ts first.");
    }

    // 1. Company Admin
    const adminEmail = 'test_admin@yvo.com';
    const adminPass = 'Test@Admin123';
    const hashedAdminPass = await hashPassword(adminPass);

    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: { passwordHash: hashedAdminPass },
        create: {
            email: adminEmail,
            fullName: 'Test Company Admin',
            passwordHash: hashedAdminPass,
            isSuperAdmin: false,
        }
    });

    await prisma.userMembership.upsert({
        where: {
            userId_companyId: {
                userId: adminUser.id,
                companyId: company.id
            }
        },
        update: { role: 'OWNER' },
        create: {
            userId: adminUser.id,
            companyId: company.id,
            role: 'OWNER'
        }
    });

    console.log(`✅ Company Admin: ${adminEmail} / ${adminPass}`);

    // 2. Employee
    const empPhone = '+919999999999';
    const empPass = 'Test@Emp123';
    const hashedEmpPass = await hashPassword(empPass);

    const employee = await prisma.employee.upsert({
        where: { phone: '+919999999999' },
        update: { password: hashedEmpPass },
        create: {
            firstName: 'Test',
            lastName: 'Employee',
            phone: '+919999999999',
            email: 'test_emp@yvo.com',
            password: hashedEmpPass,
            companyId: company.id,
            salary: 50000,
            status: 'ACTIVE'
        }
    });

    console.log(`✅ Employee: ${empPhone} / ${empPass}`);

    console.log('\n🚀 Credential setup complete!');
}

main()
    .catch((e) => {
        console.error('❌ Setup failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
