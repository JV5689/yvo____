export const requireRoles = (...roles) => (req, res, next) => {
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
    }
    return next();
};
