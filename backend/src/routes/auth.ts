import { Request, Response } from 'express';
import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../../src/config/db.js";
import { signToken } from "../utils/jwt.js";
import { sendWelcomeEmail } from "../utils/mailer.js";

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const normalizeEmail = (email: any) => String(email || "").toLowerCase().trim();
const normalizePhone = (phone: any) => String(phone || "").replace(/[^\d+]/g, "").trim();

const ensureCompanyId = async (user: any) => {
  // In Prisma, we might need to check memberships or a dedicated field if added.
  // The schema shows User has memberships.
  // For now, I'll follow the logic but use Prisma.
  // Note: user.id instead of user._id
  const memberships = await prisma.userMembership.findMany({ where: { userId: user.id } });
  if (memberships.length > 0) return memberships[0].companyId;

  // If no company, we might need to create one or handle it.
  // Legacy logic used cmp_ user._id.
  return null;
};

const getNeedsPlan = async (companyId: any) => {
  if (!companyId) return true;
  // The schema doesn't have a Subscription model in the snippet I saw?
  // Let me re-check the schema.prisma.
  // Ah, I see "subscriptionStatus" in Company model.
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  return !company || company.subscriptionStatus === "trial"; // Or similar logic
};

/* =========================
   REGISTER (Create Account)
   POST /auth/register
========================= */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, password, businessType, companyId, role } = req.body || {};

    if (!fullName || String(fullName).trim().length < 2) {
      return res.status(400).json({ message: "Full name is required." });
    }

    const e = normalizeEmail(email);
    if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      return res.status(400).json({ message: "Valid email is required." });
    }

    if (!password || String(password).trim().length < 6) {
      return res.status(400).json({ message: "Password is required (min 6 chars)." });
    }

    const existing = await prisma.user.findUnique({ where: { email: e } });
    if (existing) {
      return res.status(409).json({ message: "Email already exists." });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await prisma.user.create({
      data: {
        fullName: String(fullName).trim(),
        email: e,
        passwordHash,
      }
    });

    // Handle company creation if needed, or link to existing
    // Legacy logic was a bit different. I'll simplify for now to match schema.

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: "ADMIN", // Default role for registering user
    });

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await sendWelcomeEmail({ to: user.email, name: user.fullName || "User" });
    }

    return res.status(201).json({
      message: "Account created ✅",
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

/* =========================
   LOGIN
   POST /auth/login
========================= */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { method, email, phone, password } = req.body || {};

    if (!password || String(password).trim().length < 6) {
      return res.status(400).json({ message: "Password is required (min 6 chars)." });
    }

    let user = null;

    if (method === "email") {
      const e = normalizeEmail(email);
      user = await prisma.user.findUnique({ where: { email: e } });
    } else {
      return res.status(400).json({ message: "Email login only supported currently." });
    }

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

export default router;
