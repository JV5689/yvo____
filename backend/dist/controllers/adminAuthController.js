import { prisma } from '../src/config/db.js';
import { verifyPassword } from '../src/security/hashing.js';
import { generateAccessToken, generateRefreshToken } from '../src/security/tokens.js';
import { AppError } from '../src/middleware/errorHandler.js';
import { logAudit } from '../src/utils/auditLogger.js';
export const loginAdmin = async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password)
        throw new AppError('Username and password are required.', 400);
    const envAdminUser = process.env.ADMIN_USERNAME;
    const envAdminPass = process.env.ADMIN_PASSWORD;
    // Environment-based super admin bypass
    if (envAdminUser && envAdminPass && username === envAdminUser && password === envAdminPass) {
        const accessToken = generateAccessToken({ userId: 'admin', role: 'SUPER_ADMIN', isSuperAdmin: true });
        return res.json({
            status: 'success',
            token: accessToken,
            role: 'SUPER_ADMIN',
            fullName: envAdminUser,
            email: null,
            isSuperAdmin: true
        });
    }
    // Database-based admin login USING RAW SQL to bypass Prisma client validation errors
    // We use queryRaw with parameters to prevent SQL injection
    const users = await prisma.$queryRawUnsafe('SELECT * FROM user WHERE email = ? LIMIT 1', username);
    const user = users[0];
    if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
        await logAudit({ actorId: 'anonymous', action: 'FAILED_ADMIN_LOGIN', details: { email: username }, ip: req.ip, userAgent: req.headers['user-agent'] });
        throw new AppError('Invalid admin credentials.', 401);
    }
    // Fetch memberships using raw SQL
    const memberships = await prisma.$queryRawUnsafe('SELECT * FROM usermembership WHERE userId = ?', user.id);
    const isSuperAdmin = !!user.isSuperAdmin;
    const adminMembership = memberships.find((m) => ['OWNER', 'ADMIN'].includes(m.role));
    let role = null;
    if (isSuperAdmin) {
        role = 'SUPER_ADMIN';
    }
    else if (adminMembership) {
        role = 'ADMIN';
    }
    if (!role)
        throw new AppError('User does not have admin access.', 403);
    const primaryMembership = memberships[0];
    const payload = { userId: user.id, role, companyId: primaryMembership?.companyId || null, isSuperAdmin };
    const accessToken = generateAccessToken(payload);
    const { token: refreshToken, hashedToken } = generateRefreshToken(payload);
    // Update user using raw SQL
    await prisma.$queryRawUnsafe('UPDATE user SET hashedRefreshToken = ?, lastLoginAt = ?, lastIp = ?, lastUserAgent = ? WHERE id = ?', hashedToken, new Date(), req.ip, req.headers['user-agent'], user.id);
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    await logAudit({ actorId: user.id, companyId: primaryMembership?.companyId, action: 'ADMIN_LOGIN', ip: req.ip, userAgent: req.headers['user-agent'] });
    return res.json({
        status: 'success',
        token: accessToken,
        role,
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        isSuperAdmin: !!user.isSuperAdmin,
    });
};
