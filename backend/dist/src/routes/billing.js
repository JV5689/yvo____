import express from "express";
import { prisma } from "../../src/config/db.js";
const router = express.Router();
// Simplified billing for now as Mongoose models are gone
router.get("/plans", async (req, res) => {
    try {
        const plans = await prisma.plan.findMany({ where: { isArchived: false } });
        res.json(plans);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export default router;
