import { Request, Response } from 'express';
import { prisma } from '../../src/config/db.js';

// GET /sa/plans
export const getPlans = async (req: Request, res: Response) => {
    try {
        const plans = await prisma.plan.findMany({
            where: { isArchived: false }
        });
        res.json(plans.map((p: any) => ({ ...p, _id: p.id })));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// POST /sa/plans
export const createPlan = async (req: Request, res: Response) => {
    try {
        const { defaultFlags, defaultLimits, priceMonthly, ...rest } = req.body;
        const plan = await prisma.plan.create({
            data: {
                ...rest,
                priceMonthly: priceMonthly ? Number(priceMonthly) : 0,
                defaultFlags: defaultFlags || {},
                defaultLimits: defaultLimits || {}
            }
        });
        res.status(201).json({ ...plan, _id: plan.id });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// PATCH /sa/plans/:id
export const updatePlan = async (req: Request, res: Response) => {
    try {
        const { defaultFlags, defaultLimits, priceMonthly, ...otherUpdates } = req.body;
        console.log(`[SuperAdmin] Updating plan ${req.params.id}:`, req.body);

        let plan = await prisma.plan.findUnique({ where: { id: String(req.params.id) } });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        const updatedData: any = { ...otherUpdates };

        if (priceMonthly !== undefined) {
            updatedData.priceMonthly = Number(priceMonthly);
        }

        if (defaultFlags) {
            updatedData.defaultFlags = {
                ...(plan.defaultFlags ? plan.defaultFlags as any : {}),
                ...defaultFlags
            };
        }
        if (defaultLimits) {
            updatedData.defaultLimits = {
                ...(plan.defaultLimits ? plan.defaultLimits as any : {}),
                ...defaultLimits
            };
        }

        // 1. SAVE WITH CONFIRMATION
        plan = await prisma.plan.update({
            where: { id: String(req.params.id) },
            data: updatedData
        });

        console.log(`[SuperAdmin] Plan ${plan.id} updated & verified.`);

        // 3. SYNCHRONOUS AUTO-CLEANUP (Safer)
        if (defaultFlags) {
            console.log('[Sync] Starting Auto-Cleanup of redundant overrides...');
            try {
                const companies = await prisma.company.findMany({
                    where: { planId: plan.id }
                });

                for (const company of companies) {
                    let modified = false;
                    let companyFlags: any = typeof company.featureFlags === 'object' && company.featureFlags !== null ? { ...company.featureFlags } : {};

                    if (Object.keys(companyFlags).length === 0) continue;

                    for (const [key, value] of Object.entries(defaultFlags)) {
                        if (companyFlags[key] !== undefined && companyFlags[key] === Boolean(value as any)) {
                            delete companyFlags[key];
                            modified = true;
                        }
                    }

                    if (modified) {
                        await prisma.company.update({
                            where: { id: company.id },
                            data: { featureFlags: companyFlags }
                        });
                        console.log(`[Sync] Cleaned up redundant overrides for ${company.name}`);
                    }
                }
                console.log('[Sync] Auto-Cleanup completed.');
            } catch (err: any) {
                console.error("[Sync] Error cleaning up overrides:", err);
            }
        }

        res.json({ ...plan, _id: plan.id });
    } catch (error: any) {
        console.error("[SuperAdmin] Update Plan Error:", error);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
};

// PATCH /sa/plans/:id/archive
export const archivePlan = async (req: Request, res: Response) => {
    try {
        const plan = await prisma.plan.update({
            where: { id: String(req.params.id) },
            data: { isArchived: true }
        });
        res.json({ message: 'Plan archived successfully', plan });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Plan not found' });
        }
        res.status(500).json({ message: error.message });
    }
};
