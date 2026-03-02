import { Request, Response } from 'express';
import { prisma } from '../../src/config/db.js';
import bcrypt from 'bcryptjs';

// GET /sa/dashboard-stats
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalCompanies = await prisma.company.count();
        const activeCompanies = await prisma.company.count({ where: { subscriptionStatus: 'active' } });
        // Count users who are not super admins (Employees/Admins of companies)
        const totalUsers = await prisma.user.count({ where: { isSuperAdmin: false } });

        // Plan Distribution
        const companiesByPlan = await prisma.company.groupBy({
            by: ['planId'],
            _count: {
                _all: true
            }
        });

        // Get plan names for distribution
        const planIds = companiesByPlan.map(p => p.planId);
        const plans = await prisma.plan.findMany({
            where: { id: { in: planIds } },
            select: { id: true, name: true }
        });

        const planMap = plans.reduce((acc, p) => {
            acc[p.id] = p.name;
            return acc;
        }, {} as Record<string, string>);

        const planDistribution = companiesByPlan.map(p => ({
            name: planMap[p.planId] || 'Unknown',
            value: p._count._all
        }));

        const recentCompanies = await prisma.company.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { plan: { select: { name: true } } }
        });

        res.json({
            totalCompanies,
            activeCompanies,
            totalUsers,
            planDistribution,
            recentCompanies
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// GET /sa/companies
export const getCompanies = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;

        const where: any = {};
        if (status) where.subscriptionStatus = status;
        if (search) {
            where.name = { contains: search as string };
        }

        const companies = await prisma.company.findMany({
            where,
            include: { plan: { select: { name: true, code: true } } },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.company.count({ where });

        res.json({
            companies,
            total,
            pages: Math.ceil(total / Number(limit))
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// GET /sa/companies/:id
export const getCompanyById = async (req: Request, res: Response) => {
    try {
        const company = await prisma.company.findUnique({
            where: { id: req.params.id },
            include: { plan: true }
        });
        if (!company) return res.status(404).json({ message: 'Company not found' });

        // Also fetch owners/admins for this company
        const admins = await prisma.user.findMany({
            where: {
                memberships: {
                    some: {
                        companyId: company.id,
                        role: { in: ['OWNER', 'ADMIN'] }
                    }
                }
            },
            select: {
                id: true,
                fullName: true,
                email: true
            }
        });

        res.json({ company, admins });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// POST /sa/companies (Manual Create)
export const createCompany = async (req: Request, res: Response) => {
    try {
        const {
            name, planId,
            ownerName, ownerEmail, password,
            phone, address, website, businessType
        } = req.body;

        console.log('[CreateCompany] Payload:', { name, planId, ownerEmail, hasPassword: !!password });

        // Basic Validation
        if (!name || !planId || !ownerEmail || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // 1. Get Plan
        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) return res.status(400).json({ message: 'Invalid Plan ID' });

        // 2. Check if User/Company Exists
        const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // 3. Create Company and Owner (User) in a transaction
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    name,
                    planId: plan.id,
                    subscriptionStatus: 'active',
                    featureFlags: plan.defaultFlags || {},
                    limitOverrides: {},
                    phone,
                    address,
                    website,
                    businessType,
                    email: ownerEmail
                }
            });

            const user = await tx.user.create({
                data: {
                    email: ownerEmail,
                    fullName: ownerName,
                    passwordHash,
                    isSuperAdmin: false,
                    memberships: {
                        create: {
                            companyId: company.id,
                            role: 'OWNER'
                        }
                    }
                }
            });

            return { company, user };
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error("Create Company Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// PATCH /sa/companies/:id/status
export const updateCompanyStatus = async (req: Request, res: Response) => {
    try {
        const { status, subscriptionEndsAt } = req.body;

        const data: any = { subscriptionStatus: status };
        if (subscriptionEndsAt) {
            data.subscriptionEndsAt = new Date(subscriptionEndsAt);
        }

        const company = await prisma.company.update({
            where: { id: req.params.id },
            data,
            include: { plan: true }
        });
        res.json(company);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// PATCH /sa/companies/:id/plan
export const updateCompanyPlan = async (req: Request, res: Response) => {
    try {
        const { planId } = req.body;

        // Validate Plan
        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        const company = await prisma.company.update({
            where: { id: req.params.id },
            data: { planId: plan.id },
            include: { plan: true }
        });

        res.json(company);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// PATCH /sa/companies/:id/flags
export const updateCompanyFlags = async (req: Request, res: Response) => {
    try {
        const { flags, replace } = req.body;
        console.log(`[SuperAdmin] Updating flags for company ${req.params.id}:`, flags);

        const company = await prisma.company.findUnique({ where: { id: req.params.id } });
        if (!company) return res.status(404).json({ message: 'Company not found' });

        let newFlags: any;
        if (replace) {
            newFlags = flags || {};
        } else {
            const existingFlags = typeof company.featureFlags === 'object' && company.featureFlags !== null ? company.featureFlags : {};
            newFlags = { ...(existingFlags as any), ...(flags || {}) };
        }

        const updatedCompany = await prisma.company.update({
            where: { id: req.params.id },
            data: { featureFlags: newFlags }
        });

        res.json(updatedCompany);
    } catch (error: any) {
        console.error("[SuperAdmin] Update Flags Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// DELETE /sa/companies/:id
export const deleteCompany = async (req: Request, res: Response) => {
    try {
        const companyId = req.params.id;
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) return res.status(404).json({ message: 'Company not found' });

        console.log(`[DeleteCompany] Starting full cleanup for company: ${company.name} (${companyId})`);

        // With Prisma's onDelete: Cascade, many things will be deleted automatically if defined in schema.prisma.
        // Let's check schema.prisma just to be sure.

        // Final Delete the Company (Cascades will trigger)
        await prisma.company.delete({ where: { id: companyId } });

        // Special cleanup for users who ONLY belong to this company and are not super admins
        // This logic is a bit more complex with Prisma as it's not a direct cascade.
        // But the previous implementation did it, so let's replicate if needed or simplify.
        // In the previous implementation, it filtered memberships and deleted the user if empty.

        // Let's find users who belonged to this company
        // Actually, schema says memberships are Cascade on companyId. So memberships are gone.
        // We need to find users with 0 memberships now.
        const usersToDelete = await prisma.user.findMany({
            where: {
                isSuperAdmin: false,
                memberships: { none: {} }
            }
        });

        if (usersToDelete.length > 0) {
            await prisma.user.deleteMany({
                where: {
                    id: { in: usersToDelete.map(u => u.id) }
                }
            });
        }

        console.log(`[DeleteCompany] Successfully deleted company and associated users.`);
        res.json({ message: 'Company and associated data deleted successfully' });
    } catch (error: any) {
        console.error("Delete Company Error:", error);
        res.status(500).json({ message: error.message });
    }
};
