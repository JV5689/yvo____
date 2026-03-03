import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/config/db.js';
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', {
        expiresIn: '30d',
    });
};
const resolveAdminRole = (user) => {
    if (user.isSuperAdmin) {
        return 'SUPER_ADMIN';
    }
    const membership = user.memberships?.find((entry) => ['OWNER', 'ADMIN'].includes(entry.role));
    return membership ? 'ADMIN' : null;
};
export const loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }
        const envAdminUser = process.env.ADMIN_USERNAME;
        const envAdminPass = process.env.ADMIN_PASSWORD;
        if (envAdminUser && envAdminPass && username === envAdminUser && password === envAdminPass) {
            const token = generateToken({
                userId: 'admin',
                role: 'SUPER_ADMIN',
            });
            return res.json({
                token,
                role: 'SUPER_ADMIN',
                user: {
                    fullName: envAdminUser,
                    email: null,
                },
            });
        }
        const user = await prisma.user.findUnique({
            where: { email: username },
            include: {
                memberships: true,
            },
        });
        if (!user || !user.passwordHash) {
            return res.status(401).json({ message: 'Invalid admin credentials.' });
        }
        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
            return res.status(401).json({ message: 'Invalid admin credentials.' });
        }
        const role = resolveAdminRole(user);
        if (!role) {
            return res.status(403).json({ message: 'User does not have admin access.' });
        }
        const primaryMembership = user.memberships?.[0];
        const token = generateToken({
            userId: user.id,
            role,
            companyId: primaryMembership?.companyId || null,
        });
        return res.json({
            token,
            role,
            user: {
                fullName: user.fullName,
                email: user.email,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
