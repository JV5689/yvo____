import { Request, Response } from 'express';
import { prisma } from '../src/config/db.js';

export const getTemplates = async (req: Request, res: Response) => {
    try {
        const { companyId } = req.query;
        const query: any = {
            isDeleted: false,
            OR: [
                { type: 'GLOBAL' }
            ]
        };

        if (companyId) {
            query.OR.push({ type: 'COMPANY', companyId: String(companyId) });
        }

        const templates = await prisma.invoiceTemplate.findMany({
            where: query,
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(templates);
    } catch (err: any) {
        console.error("Error fetching templates:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const getAllTemplatesAdmin = async (req: Request, res: Response) => {
    try {
        const templates = await prisma.invoiceTemplate.findMany({
            where: { isDeleted: false },
            include: { company: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(templates);
    } catch (err: any) {
        console.error("Error fetching all templates for admin:", err);
        res.status(500).json({ message: "Server error" });
    }
};
export const getTemplateById = async (req: Request, res: Response) => {
    try {
        const template = await prisma.invoiceTemplate.findUnique({
            where: { id: String(req.params.id) }
        });
        if (!template || template.isDeleted) {
            return res.status(404).json({ message: "Template not found" });
        }
        res.status(200).json(template);
    } catch (err: any) {
        console.error("Error fetching template:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const createTemplate = async (req: Request, res: Response) => {
    try {
        const { companyId, name, type, themeIdentifier, items, taxRate: providedTaxRate, notes, layout } = req.body;

        const cleansedItems = (items || []).map((item: any) => {
            const newItem = { ...item };
            if (newItem.inventoryId === "" || newItem.inventoryId === null) {
                delete newItem.inventoryId;
            }
            newItem.quantity = parseFloat(item.quantity) || 0;
            newItem.price = parseFloat(item.price) || 0;
            newItem.total = parseFloat(item.total) || 0;
            // Handle customFields if they exist
            if (newItem.customFields && typeof newItem.customFields !== 'object') {
                newItem.customFields = {};
            }
            return newItem;
        });

        const template = await prisma.invoiceTemplate.create({
            data: {
                companyId: companyId ? String(companyId) : undefined,
                name,
                type: type || 'COMPANY',
                themeIdentifier: themeIdentifier || 'classic',
                taxRate: providedTaxRate !== undefined ? parseFloat(providedTaxRate as any) : 10,
                notes: notes || '',
                layout: layout || [],
                items: {
                    create: cleansedItems
                }
            },
            include: { items: true }
        });

        res.status(201).json(template);
    } catch (err: any) {
        console.error("Error creating template:", err);
        res.status(500).json({ message: err.message || "Server error" });
    }
};

export const updateTemplate = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { items, taxRate: providedTaxRate, name, themeIdentifier, notes, layout } = req.body;

        // Only spread safe, known Prisma fields — never blindly spread req.body
        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (themeIdentifier !== undefined) updates.themeIdentifier = themeIdentifier;
        if (notes !== undefined) updates.notes = notes;
        if (layout !== undefined) updates.layout = layout;

        if (providedTaxRate !== undefined) {
            updates.taxRate = parseFloat(providedTaxRate as any) || 10;
        }

        if (items !== undefined) {
            const cleansedItems = (items || []).map((item: any) => {
                const newItem = { ...item };
                if (newItem.inventoryId === "" || newItem.inventoryId === null) {
                    delete newItem.inventoryId;
                }
                delete newItem.id;
                delete newItem.templateId;
                delete newItem.createdAt;
                delete newItem.updatedAt;

                newItem.quantity = parseFloat(item.quantity) || 0;
                newItem.price = parseFloat(item.price) || 0;
                newItem.total = parseFloat(item.total) || 0;
                return newItem;
            });

            // Delete existing items and recreate
            await prisma.invoiceTemplateItem.deleteMany({ where: { templateId: String(id) } });
            updates.items = {
                create: cleansedItems
            };
        }

        const template = await prisma.invoiceTemplate.update({
            where: { id: String(id) },
            data: updates,
            include: { items: true }
        });

        res.status(200).json(template);
    } catch (err: any) {
        console.error("Error updating template:", err.message, err);
        res.status(500).json({ message: err.message || "Server error" });
    }
};

export const deleteTemplate = async (req: Request, res: Response) => {
    try {
        const template = await prisma.invoiceTemplate.update({
            where: { id: String(req.params.id) },
            data: { isDeleted: true }
        });
        if (!template) {
            return res.status(404).json({ message: "Template not found" });
        }
        res.status(200).json({ message: "Template deleted" });
    } catch (err: any) {
        console.error("Error deleting template:", err);
        res.status(500).json({ message: "Server error" });
    }
};
