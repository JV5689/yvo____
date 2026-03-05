import { Request, Response } from 'express';
import express from "express";
import { prisma } from "../../src/config/db.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Simplified billing for now as Mongoose models are gone
router.get("/plans", async (req: Request, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({ where: { isArchived: false } });
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
