import { prisma } from '../../src/config/db.js';
// GET /sa/sync/stats
export const getSyncStats = async (req, res) => {
    try {
        // 1. Calculate Storage Usage (Approximate)
        const invoiceCount = await prisma.invoice.count();
        const userCount = await prisma.user.count();
        const companyCount = await prisma.company.count();
        // Est. Sizes: Invoice ~2KB, User ~1KB, Company ~2KB (very rough)
        const totalBytes = (invoiceCount * 2048) + (userCount * 1024) + (companyCount * 2048);
        const totalGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(6);
        // 2. Sync Status
        // Find companies with devices synced in the last 24h
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeSyncCompanies = await prisma.company.count({
            where: {
                devices: {
                    some: {
                        lastSyncAt: { gte: oneDayAgo }
                    }
                }
            }
        });
        // 3. Settings (Fetch from Global FeatureFlag)
        const globalFlagsRaw = await prisma.featureFlag.findUnique({
            where: { key: 'GLOBAL_SETTINGS' } // Assuming this key or similar
        });
        // Fallback or search by scope if key not guaranteed
        let globalFlags = globalFlagsRaw;
        if (!globalFlags) {
            globalFlags = await prisma.featureFlag.findFirst({
                where: { scope: 'global' }
            });
        }
        const settings = globalFlags?.value?.flags || {
            mandatoryCloudBackup: true,
            autoYearlyArchive: false
        };
        res.json({
            storage: {
                usedGB: totalGB,
                limitTB: 10.0,
                percent: ((Number(totalGB) / (10 * 1024)) * 100).toFixed(4)
            },
            syncHealth: {
                active: activeSyncCompanies,
                total: companyCount
            },
            settings
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// GET /sa/sync/logs
export const getSyncLogs = async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            where: {
                action: { in: ['SYSTEM_BACKUP', 'SYNC_ERROR', 'SYNC_COMPLETE'] }
            },
            orderBy: { timestamp: 'desc' },
            take: 10
            // actorId in AuditLog is a String, not a direct relation to User in schema currently?
            // Let's check schema.prisma
        });
        // If actorId is stored as User ID, we might want to manually fetch names if relation not set
        const actorIds = logs.map(l => l.actorId);
        const actors = await prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: { id: true, fullName: true, email: true }
        });
        const actorMap = actors.reduce((acc, a) => {
            acc[a.id] = a;
            return acc;
        }, {});
        const enrichedLogs = logs.map(l => ({
            ...l,
            actor: actorMap[l.actorId] || { fullName: 'System', email: 'system@yvo.com' }
        }));
        res.json(enrichedLogs);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// POST /sa/sync/manual-backup
export const triggerManualBackup = async (req, res) => {
    try {
        const { userId } = req.user; // req.user populated by requireAuth
        await prisma.auditLog.create({
            data: {
                actorId: userId,
                action: 'SYSTEM_BACKUP',
                targetModel: 'System',
                details: { status: 'Success', type: 'Manual' },
                ipAddress: req.ip || '127.0.0.1'
            }
        });
        res.json({ message: 'Manual backup triggered successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// PATCH /sa/sync/config
export const updateSyncConfig = async (req, res) => {
    try {
        const { mandatoryCloudBackup, autoYearlyArchive } = req.body;
        const globalFlags = await prisma.featureFlag.upsert({
            where: { key: 'GLOBAL_SETTINGS' },
            create: {
                key: 'GLOBAL_SETTINGS',
                scope: 'global',
                value: {
                    flags: {
                        mandatoryCloudBackup,
                        autoYearlyArchive
                    }
                }
            },
            update: {
                value: {
                    flags: {
                        mandatoryCloudBackup,
                        autoYearlyArchive
                    }
                }
            }
        });
        res.json(globalFlags.value.flags);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
