import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/security/hashing.js';
const prisma = new PrismaClient();
async function main() {
    console.log('🌱 Updating Super Admin data with Argon2id...');
    // 1. Create/Update Default Plan
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
    console.log('✅ Plan verified:', plan.code);
    // 2. Create/Get Default Company
    let company = await prisma.company.findFirst({
        where: { name: 'My Company' }
    });
    if (!company) {
        company = await prisma.company.create({
            data: {
                name: 'My Company',
                email: 'contact@mycompany.com',
                currency: 'INR',
                planId: plan.id,
                subscriptionStatus: 'active',
                apiKey: `sk_live_${crypto.randomUUID()}`
            }
        });
        console.log('✅ Company created:', company.name);
    }
    else {
        console.log('✅ Company verified:', company.name);
    }
    // 3. Create/Update Admin User with Argon2id
    // Password meets complexity: min 8, 1 uppercase, 1 number
    const password = 'Admin@Secure123';
    const hashedPassword = await hashPassword(password);
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
    console.log('✅ Admin user updated with Argon2id hashing:', user.email);
    // 4. Ensure User Membership (OWNER)
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
    console.log('✅ User membership verified: OWNER');
    console.log('\n🚀 Update complete!');
    console.log('-------------------------');
    console.log('Email: admin@yvo.com');
    console.log('Password: ' + password);
    console.log('-------------------------');
}
main()
    .catch((e) => {
    console.error('❌ Update failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
