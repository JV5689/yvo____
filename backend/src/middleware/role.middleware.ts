import { Request, Response, NextFunction } from "express";

export const requireRoles = (...roles: string[]) => (req: Request, res: Response, next: NextFunction): void | Response => {
  if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  return next();
};
