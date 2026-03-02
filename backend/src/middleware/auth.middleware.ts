import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import { prisma } from "../config/db.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded: any = verifyToken(token);

    // Normalize decoded token (regular vs admin token)
    const userId = decoded.id || decoded.userId;
    let companyId = decoded.companyId || (req.headers['x-company-id'] as string);
    let role = decoded.role;

    // If role is missing (regular token), we must fetch it from the DB
    if (!role && userId && userId !== 'admin') {
      const user = await prisma.user.findUnique({
        where: { id: String(userId) },
        include: { memberships: true }
      });
      if (user) {
        // If we have a companyId, find membership for it
        if (companyId) {
          const membership = user.memberships.find(m => m.companyId === companyId);
          if (membership) {
            role = membership.role;
          }
        }

        // Fallback or super admin check
        if (!role && user.isSuperAdmin) {
          role = 'SUPER_ADMIN';
        }
      }
    }

    req.user = {
      userId,
      role,
      companyId,
      email: decoded.email
    };

    next();
  } catch (e) {
    console.error("Auth Middleware Error:", e);
    return res.status(401).json({ message: "Invalid/expired token" });
  }
}
