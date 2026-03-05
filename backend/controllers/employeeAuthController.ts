import { Request, Response } from 'express';
import { prisma } from '../src/config/db.js';
import { verifyPassword } from '../src/security/hashing.js';
import { generateAccessToken } from '../src/security/tokens.js';
import { AppError } from '../src/middleware/errorHandler.js';

export const loginEmployee = async (req: Request, res: Response) => {
    let { phone, password } = req.body;

    const numericPhone = phone.replace(/[^\d]/g, '');
    const last10Digits = numericPhone.length >= 10 ? numericPhone.slice(-10) : numericPhone;

    // Search for employee with phone matching last 10 digits
    const employees: any[] = await prisma.$queryRawUnsafe(
        'SELECT * FROM employee WHERE phone LIKE ? LIMIT 1',
        `%${last10Digits}`
    );
    const employee = employees[0];

    if (!employee || !employee.password || !(await verifyPassword(password, employee.password))) {
        throw new AppError('Invalid phone or password', 401);
    }

    if (employee.status !== 'Active') throw new AppError('Account is not active', 403);

    const companies: any[] = await prisma.$queryRawUnsafe('SELECT id, featureFlags, planId FROM company WHERE id = ?', employee.companyId);
    const company = companies[0];
    if (!company) throw new AppError('Company not found', 404);

    const plans: any[] = await prisma.$queryRawUnsafe('SELECT defaultFlags FROM plan WHERE id = ?', company.planId);
    const plan = plans[0];
    if (!plan) throw new AppError('Plan not found', 404);

    const planDefaults = (plan.defaultFlags as Record<string, boolean>) || {};
    const companyOverrides = (company.featureFlags as Record<string, boolean>) || {};
    const effectiveFlags = { ...planDefaults, ...companyOverrides };

    if (!effectiveFlags['module_employees']) {
        throw new AppError('Employee access is disabled for your company.', 403);
    }

    const payload = { userId: employee.id, role: 'employee', companyId: employee.companyId, isSuperAdmin: false };
    const accessToken = generateAccessToken(payload);

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
    });

    res.json({
        status: 'success',
        token: accessToken,
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        company: company,
        avatar: employee.avatar,
        role: 'employee'
    });
};

export const getEmployeeProfile = async (req: Request, res: Response) => {
    const employeeId = (req as any).user?.userId;
    const employees: any[] = await prisma.$queryRawUnsafe('SELECT * FROM employee WHERE id = ?', String(employeeId));
    const employee = employees[0];
    if (!employee) throw new AppError('Employee not found', 404);

    const companies: any[] = await prisma.$queryRawUnsafe('SELECT name, logo FROM company WHERE id = ?', employee.companyId);
    const company = companies[0];

    res.json({
        status: 'success',
        ...employee,
        company: company
    });
};
