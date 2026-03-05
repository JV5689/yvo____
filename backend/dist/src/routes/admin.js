import express from "express";
import { signToken } from "../utils/jwt.js";
const router = express.Router();
router.post("/login", async (req, res) => {
    const { username, password } = req.body || {};
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminUser || !adminPass) {
        return res.status(500).json({ message: "Admin credentials are not configured." });
    }
    if (username !== adminUser || password !== adminPass) {
        return res.status(401).json({ message: "Invalid admin credentials." });
    }
    const token = signToken({
        userId: "admin",
        role: "SUPER_ADMIN",
        email: null,
        companyId: null,
    });
    return res.json({
        token,
        admin: {
            username: adminUser,
            role: "SUPER_ADMIN",
        },
    });
});
export default router;
