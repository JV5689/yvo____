import { prisma } from '../src/config/db.js';
import { hashPassword, verifyPassword } from '../src/security/hashing.js';
import { generateAccessToken, generateRefreshToken, hashToken, verifyRefreshToken } from '../src/security/tokens.js';
import { AppError } from '../src/middleware/errorHandler.js';
import { logAudit } from '../src/utils/auditLogger.js';
const setTokenCookies = (res, accessToken, refreshToken) => {
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
};
export const registerCompany = async (req, res) => {
    const { companyName, ownerName, email, password } = req.body;
    const users = await prisma.$queryRawUnsafe('SELECT id FROM user WHERE email = ?', email);
    if (users.length > 0)
        throw new AppError('User already exists', 400);
    let plans = await prisma.$queryRawUnsafe('SELECT id, defaultFlags FROM plan WHERE code = ?', 'BASIC');
    let planId;
    let defaultFlags = {};
    if (plans.length === 0) {
        const newPlan = await prisma.plan.create({
            data: { code: 'BASIC', name: 'Basic', priceMonthly: 0 }
        });
        planId = newPlan.id;
        defaultFlags = newPlan.defaultFlags || {};
    }
    else {
        planId = plans[0].id;
        defaultFlags = plans[0].defaultFlags || {};
    }
    const company = await prisma.company.create({
        data: {
            name: companyName,
            planId: planId,
            subscriptionStatus: 'trial',
            featureFlags: defaultFlags,
            apiKey: `sk_live_${crypto.randomUUID()}`
        }
    });
    const newUser = await prisma.user.create({
        data: {
            fullName: ownerName,
            email,
            passwordHash: await hashPassword(password),
            isSuperAdmin: false,
        }
    });
    await prisma.$executeRawUnsafe('INSERT INTO usermembership (id, userId, companyId, role, joinedAt) VALUES (?, ?, ?, ?, ?)', crypto.randomUUID(), newUser.id, company.id, 'OWNER', new Date());
    const payload = { userId: newUser.id, companyId: company.id, role: 'OWNER', isSuperAdmin: false };
    const accessToken = generateAccessToken(payload);
    const { token: refreshToken, hashedToken } = generateRefreshToken(payload);
    await prisma.$executeRawUnsafe('UPDATE user SET hashedRefreshToken = ? WHERE id = ?', hashedToken, newUser.id);
    setTokenCookies(res, accessToken, refreshToken);
    await logAudit({
        actorId: newUser.id,
        companyId: company.id,
        action: 'REGISTER_COMPANY',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
    });
    res.status(201).json({
        status: 'success',
        token: accessToken,
        companyId: company.id,
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
    });
};
export const login = async (req, res) => {
    const { email, password } = req.body;
    const users = await prisma.$queryRawUnsafe('SELECT * FROM user WHERE email = ?', email);
    const user = users[0];
    if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
        await logAudit({ actorId: 'anonymous', action: 'FAILED_LOGIN', details: { email }, ip: req.ip, userAgent: req.headers['user-agent'] });
        throw new AppError('Invalid email or password', 401);
    }
    const memberships = await prisma.$queryRawUnsafe('SELECT * FROM usermembership WHERE userId = ?', user.id);
    const primaryMembership = memberships[0];
    const companyId = primaryMembership?.companyId;
    const role = primaryMembership?.role || 'USER';
    const payload = { userId: user.id, companyId, role, isSuperAdmin: !!user.isSuperAdmin };
    const accessToken = generateAccessToken(payload);
    const { token: refreshToken, hashedToken } = generateRefreshToken(payload);
    await prisma.$executeRawUnsafe('UPDATE user SET hashedRefreshToken = ?, lastLoginAt = ?, lastIp = ?, lastUserAgent = ? WHERE id = ?', hashedToken, new Date(), req.ip, req.headers['user-agent'], user.id);
    setTokenCookies(res, accessToken, refreshToken);
    await logAudit({ actorId: user.id, companyId, action: 'LOGIN', ip: req.ip, userAgent: req.headers['user-agent'] });
    res.json({
        status: 'success',
        token: accessToken,
        currentCompanyId: companyId,
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        isSuperAdmin: !!user.isSuperAdmin,
        role,
    });
};
export const refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
        throw new AppError('Refresh token missing', 401);
    const decoded = verifyRefreshToken(refreshToken);
    const users = await prisma.$queryRawUnsafe('SELECT id, hashedRefreshToken FROM user WHERE id = ?', decoded.userId);
    const user = users[0];
    if (!user || user.hashedRefreshToken !== hashToken(refreshToken)) {
        throw new AppError('Invalid refresh token', 401);
    }
    const accessToken = generateAccessToken(decoded);
    const { token: newRefreshToken, hashedToken } = generateRefreshToken(decoded);
    await prisma.$executeRawUnsafe('UPDATE user SET hashedRefreshToken = ? WHERE id = ?', hashedToken, user.id);
    setTokenCookies(res, accessToken, newRefreshToken);
    res.json({ status: 'success', token: accessToken });
};
export const logout = async (req, res) => {
    const userId = req.user?.userId;
    if (userId)
        await prisma.$executeRawUnsafe('UPDATE user SET hashedRefreshToken = NULL WHERE id = ?', userId);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ status: 'success' });
};
