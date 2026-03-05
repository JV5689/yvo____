import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function seed() {
    try {
        console.log('--- Seeding MySQL Database ---');

        // 1. Create PRO Plan
        let plan = await prisma.plan.findUnique({ where: { code: 'PRO' } });
        if (!plan) {
            plan = await prisma.plan.create({
                data: {
                    id: crypto.randomUUID(),
                    code: 'PRO',
                    name: 'Pro Plan',
                    priceMonthly: 50,
                    defaultFlags: {
                        finance: true,
                        inventory: true,
                        employees: true,
                        calendar: true,
                        invoicing: true,
                        analytics: true,
                        backup: true
                    }
                }
            });
            console.log('Created PRO Plan');
        }

        // 2. Create Super Admin
        const adminEmail = 'admin@example.com';
        const adminPassword = 'secret';
        const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

        let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (adminUser) {
            await prisma.user.update({
                where: { email: adminEmail },
                data: { isSuperAdmin: true, passwordHash: adminPasswordHash }
            });
            console.log('Updated Super Admin');
        } else {
            adminUser = await prisma.user.create({
                data: {
                    id: crypto.randomUUID(),
                    email: adminEmail,
                    fullName: 'Super Admin',
                    passwordHash: adminPasswordHash,
                    isSuperAdmin: true
                }
            });
            console.log('Created Super Admin');
        }

        // 3. Create Company and Owner
        const companyEmail = 'user@company.com';
        const companyPassword = 'password123';
        const companyPasswordHash = await bcrypt.hash(companyPassword, 10);

        let companyUser = await prisma.user.findUnique({ where: { email: companyEmail } });
        let company;

        if (companyUser) {
            console.log('Company User already exists.');
            // Find existing company or create one
            const membership = await prisma.userMembership.findFirst({
                where: { userId: companyUser.id, role: 'OWNER' }
            });
            if (membership) {
                company = await prisma.company.findUnique({ where: { id: membership.companyId } });
            }
        }

        if (!companyUser || !company) {
            company = await prisma.company.create({
                data: {
                    id: crypto.randomUUID(),
                    name: 'Demo Company',
                    planId: plan.id,
                    subscriptionStatus: 'active',
                    featureFlags: plan.defaultFlags || {},
                    apiKey: `sk_demo_${Date.now()}`
                }
            });

            if (!companyUser) {
                companyUser = await prisma.user.create({
                    data: {
                        id: crypto.randomUUID(),
                        email: companyEmail,
                        fullName: 'Demo Owner',
                        passwordHash: companyPasswordHash,
                        isSuperAdmin: false
                    }
                });
            }

            await prisma.userMembership.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: companyUser.id,
                    companyId: company.id,
                    role: 'OWNER'
                }
            });
            console.log('Created Demo Company and Owner');
        }

        console.log('-----------------------------------');
        console.log('SUPER ADMIN LOGIN:');
        console.log(`Email:    ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log('-----------------------------------');
        console.log('COMPANY LOGIN:');
        console.log(`Email:    ${companyEmail}`);
        console.log(`Password: ${companyPassword}`);
        console.log('-----------------------------------');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
