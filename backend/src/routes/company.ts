import { Request, Response } from 'express';
import express from "express";
import { prisma } from "../config/db.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * GET /company/config
 * Returns merged config: global flags + plan flags + company flags + plan limits
 */
router.get("/config", requireAuth, async (req: Request, res: Response) => {
  try {
    const { companyId, role } = (req as any).user;

    // 1. Fetch Global Flags from FeatureFlag table
    const globalFlag = await prisma.featureFlag.findFirst({
      where: { scope: "global", isEnabled: true }
    });
    const globalValue = (globalFlag?.value as any)?.flags || {};

    // Super admin has no company config, just return global
    if (!companyId && role === "SUPER_ADMIN") {
      return res.json({
        companyId: null,
        plan: null,
        limits: null,
        flags: globalValue,
      });
    }

    if (!companyId) return res.status(400).json({ message: "companyId missing in token" });

    // 2. Fetch Company with its Plan
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true }
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const plan = company.plan;

    // Merge priority: global < plan default < company override
    // (Note: 'plan override' from previous schema is effectively merged into plan.defaultFlags in new schema)
    const mergedFlags = {
      ...globalValue,
      ...(plan?.defaultFlags as any || {}),
      ...(company.featureFlags as any || {}),
    };

    res.json({
      companyId,
      plan: plan ? { id: plan.id, name: plan.name, code: plan.code } : null,
      limits: plan?.defaultLimits || null,
      flags: mergedFlags,
    });
  } catch (e: any) {
    console.error("Config Error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

export default router;
