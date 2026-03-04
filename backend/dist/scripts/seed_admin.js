import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    console.log('🌱 Seeding initial data...');
    // 1. Create Default Plan
    const plan = await prisma.plan.upsert({
        where: { code: 'FREE' },
        update: {},
        create: {
            code: 'FREE',
            name: 'Free Plan',
            priceMonthly: 0,
            currency: 'INR',
            defaultFlags: {
                canEditInvoices: true,
                maxUsers: 5,
                aiEnabled: false
            },
            defaultLimits: {
                invoicesPerMonth: 20
            }
        },
    });
    console.log('✅ Plan created/verified:', plan.code);
    // 2. Create Default Company
    const company = await prisma.company.create({
        data: {
            name: 'My Company',
            email: 'contact@mycompany.com',
            currency: 'INR',
            planId: plan.id,
            subscriptionStatus: 'active'
        }
    });
    console.log('✅ Company created:', company.name);
    // 3. Create Admin User
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'admin@yvo.com' },
        update: {
            passwordHash: hashedPassword,
            isSuperAdmin: true
        },
        create: {
            email: 'admin@yvo.com',
            fullName: 'Super Admin',
            passwordHash: hashedPassword,
            isSuperAdmin: true,
        }
    });
    console.log('✅ Admin user created/verified:', user.email);
    // 4. Create User Membership (OWNER)
    await prisma.userMembership.upsert({
        where: {
            userId_companyId: {
                userId: user.id,
                companyId: company.id
            }
        },
        update: {
            role: 'OWNER'
        },
        create: {
            userId: user.id,
            companyId: company.id,
            role: 'OWNER'
        }
    });
    console.log('✅ User membership created: OWNER');
    console.log('🚀 Seeding complete!');
    console.log('\nCredentials:');
    console.log('Email: admin@yvo.com');
    console.log('Password: Admin@123');
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
