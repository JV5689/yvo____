import express from "express";
import { prisma } from "../config/db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";
const router = express.Router();
router.get("/", async (req, res) => {
    try {
        const plans = await prisma.plan.findMany({
            where: { isArchived: false },
            orderBy: { priceMonthly: 'asc' }
        });
        return res.json({ plans });
    }
    catch (error) {
        return res.status(500).json({ message: error.message || "Server error" });
    }
});
router.post("/", requireAuth, requireRoles("SUPER_ADMIN"), async (req, res) => {
    try {
        const { name, code, priceMonthly, currency, defaultFlags, defaultLimits, isArchived } = req.body || {};
        if (!name || !code) {
            return res.status(400).json({ message: "Plan name and code are required." });
        }
        const plan = await prisma.plan.create({
            data: {
                name,
                code: String(code).toUpperCase(),
                priceMonthly: Number(priceMonthly || 0),
                currency: currency || "USD",
                defaultFlags: defaultFlags || {},
                defaultLimits: defaultLimits || {},
                isArchived: isArchived === true,
            },
        });
        return res.status(201).json({ plan });
    }
    catch (error) {
        return res.status(500).json({ message: error.message || "Server error" });
    }
});
export default router;
