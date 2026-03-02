import { Request, Response } from 'express';
import { signToken } from '../src/utils/jwt.js';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/db.js';

export const loginEmployee = async (req: Request, res: Response) => {
    try {
        let { phone, password } = req.body;

        // Normalize phone: remove all non-digit characters and take last 10 digits
        const numericPhone = phone.replace(/[^\d]/g, '');
        const normalizedPhone = numericPhone.length > 10 ? numericPhone.slice(-10) : numericPhone;

        // Find employee by phone
        const employee = await prisma.employee.findFirst({
            where: { phone: normalizedPhone },
            include: { company: true }
        });
        if (!employee) {
            return res.status(401).json({ message: 'Invalid phone or password' });
        }

        // Check password
        if (!employee.password) {
            return res.status(400).json({ message: 'Account not fully set up. Please contact admin.' });
        }

        const isMatch = await bcrypt.compare(password, employee.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid phone or password' });
        }

        if (employee.status !== 'Active') {
            return res.status(403).json({ message: 'Account is not active' });
        }

        // Check if Company has Employee Module Enabled
        const company = await prisma.company.findUnique({
            where: { id: employee.companyId },
            include: { plan: true }
        });

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Calculate functionality access
        const plan = company.plan;
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Handle features (stored as JSON in Prisma)
        const planDefaults = (plan.defaultFlags as Record<string, boolean>) || {};
        const companyOverrides = (company.featureFlags as Record<string, boolean>) || {};

        // Merge logic: Plan Defaults -> Company Overrides
        const effectiveFlags = { ...planDefaults, ...companyOverrides };

        if (!effectiveFlags['module_employees']) {
            return res.status(403).json({ message: 'Employee access is disabled for your company.' });
        }

        // Generate Token
        const token = signToken(
            { id: String(employee.id), role: 'employee', companyId: String(employee.companyId) }
        );

        res.json({
            token,
            user: {
                id: employee.id,
                firstName: employee.firstName,
                lastName: employee.lastName,
                email: employee.email,
                phone: employee.phone,
                position: employee.position,
                department: employee.department,
                company: employee.companyId,
                avatar: employee.avatar,
                role: 'employee'
            }
        });

    } catch (error: any) {
        console.error('Employee Login Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getEmployeeProfile = async (req: Request, res: Response) => {
    try {
        const employeeId = req.user?.userId || (req.user as any)?.id; // From middleware
        const employee = await prisma.employee.findUnique({
            where: { id: String(employeeId) },
            include: { company: { select: { name: true, logo: true } } }
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json(employee);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error' });
    }
};
