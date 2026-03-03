import { prisma } from '../../src/config/db.js';
// GET /sa/analytics/dashboard
export const getDashboardAnalytics = async (req, res) => {
    try {
        console.log('[Analytics] Fetching dashboard data...');
        const { year } = req.query;
        const targetYear = parseInt(year) || new Date().getFullYear();
        console.log(`[Analytics] Target Year: ${targetYear}`);
        // 1. Company Growth (Created per month)
        const startOfYear = new Date(targetYear, 0, 1);
        const endOfYear = new Date(targetYear + 1, 0, 1);
        const companies = await prisma.company.findMany({
            where: {
                createdAt: { gte: startOfYear, lt: endOfYear }
            },
            select: { createdAt: true }
        });
        const monthlyGrowth = new Array(12).fill(0);
        companies.forEach(c => {
            const month = new Date(c.createdAt).getMonth();
            monthlyGrowth[month]++;
        });
        // 2. Expiry Forecast (Expiring per month in target year)
        const expiringCompanies = await prisma.company.findMany({
            where: {
                subscriptionEndsAt: { gte: startOfYear, lt: endOfYear }
            },
            select: { subscriptionEndsAt: true }
        });
        const monthlyExpiry = new Array(12).fill(0);
        expiringCompanies.forEach(c => {
            if (c.subscriptionEndsAt) {
                const month = new Date(c.subscriptionEndsAt).getMonth();
                monthlyExpiry[month]++;
            }
        });
        // 3. Status Distribution (Snapshot)
        const statusDistRaw = await prisma.company.groupBy({
            by: ['subscriptionStatus'],
            _count: { subscriptionStatus: true }
        });
        res.json({
            year: targetYear,
            growth: monthlyGrowth,
            expiry: monthlyExpiry,
            statusDistribution: statusDistRaw.map(s => ({
                name: s.subscriptionStatus || 'Unknown',
                value: s._count.subscriptionStatus
            })),
            totalCompanies: await prisma.company.count(),
            activeCompanies: await prisma.company.count({
                where: { subscriptionStatus: 'active' }
            })
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// GET /sa/analytics/reports/expiry
export const getExpiryReport = async (req, res) => {
    try {
        const { days = 30 } = req.query; // Default next 30 days
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() + parseInt(days));
        const companies = await prisma.company.findMany({
            where: {
                subscriptionEndsAt: { gte: new Date(), lte: limitDate }
            },
            include: { plan: { select: { name: true } } }
        });
        const report = companies.map(c => ({
            name: c.name,
            email: c.email,
            plan: c.plan?.name || 'N/A',
            status: c.subscriptionStatus,
            expiryDate: c.subscriptionEndsAt
        }));
        res.json(report);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// GET /sa/analytics/reports/companies
export const getCompanyReport = async (req, res) => {
    try {
        // Full extract of company validity details
        const companies = await prisma.company.findMany({
            include: {
                plan: { select: { name: true } },
                memberships: {
                    where: { role: 'OWNER' },
                    include: { user: { select: { fullName: true } } }
                }
            }
        });
        const report = companies.map(c => ({
            name: c.name,
            owner: c.memberships[0]?.user?.fullName || 'N/A',
            plan: c.plan?.name || 'N/A',
            status: c.subscriptionStatus,
            created: c.createdAt,
            expires: c.subscriptionEndsAt
        }));
        res.json(report);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
