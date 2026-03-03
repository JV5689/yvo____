import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/config/db.js';

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret', {
        expiresIn: '30d',
    });
};

// POST /auth/register-company
export const registerCompany = async (req: Request, res: Response) => {
    try {
        const { companyName, ownerName, email, password } = req.body;

        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 1. Get Default Plan (Basic)
        let plan = await prisma.plan.findUnique({ where: { code: 'BASIC' } });
        if (!plan) {
            // Create fallback plan if not seeding
            plan = await prisma.plan.create({
                data: {
                    code: 'BASIC',
                    name: 'Basic',
                    priceMonthly: 0
                }
            });
        }

        // 2. Create Company
        // Generate a random API key for the company (simple implementation)
        const apiKey = `sk_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        const company = await prisma.company.create({
            data: {
                name: companyName,
                planId: plan.id,
                subscriptionStatus: 'trial',
                featureFlags: plan.defaultFlags || {},
                apiKey
            }
        });

        // 3. Create Owner
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                fullName: ownerName,
                email,
                passwordHash,
                isSuperAdmin: false,
                memberships: {
                    create: {
                        companyId: company.id,
                        role: 'OWNER'
                    }
                }
            }
        });

        res.status(201).json({
            _id: user.id,
            fullName: user.fullName,
            email: user.email,
            token: generateToken(user.id),
            companyId: company.id
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// POST /auth/login
export const login = async (req: Request, res: Response) => {
    try {
        console.log("Login attempt:", req.body.email);
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                memberships: {
                    include: { company: true }
                }
            }
        });

        console.log("User found:", user ? "YES" : "NO");

        if (user && user.passwordHash && (await bcrypt.compare(password, user.passwordHash))) {
            // Update last login
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() }
            });

            // Determine default company context (first membership)
            const primaryCompany = user.memberships.length > 0 ? user.memberships[0].companyId : null;

            console.log("Login User:", user.email, "Primary Company:", primaryCompany);

            res.json({
                _id: user.id,
                fullName: user.fullName,
                email: user.email,
                isSuperAdmin: user.isSuperAdmin,
                memberships: user.memberships,
                currentCompanyId: primaryCompany, // Client can switch if multiple
                token: generateToken(user.id),
            });
        } else {
            console.log("Invalid credentials for:", email);
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error: any) {
        console.error("LOGIN ERROR STACK:", error.stack);
        console.error("LOGIN ERROR MESSAGE:", error.message);
        res.status(500).json({ message: error.message });
    }
};
