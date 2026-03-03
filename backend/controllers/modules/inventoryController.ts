import { Request, Response } from 'express';
import { prisma } from '../../src/config/db.js';

// Get all inventory items
export const getInventory = async (req: Request, res: Response) => {
    try {
        const { companyId, showDeleted } = req.query;

        if (!companyId) {
            return res.status(400).json({ message: 'Company ID is required' });
        }

        // TEMPORARY HOTFIX: Add image column manually if it doesn't exist
        try {
            await (prisma as any).$executeRawUnsafe(`ALTER TABLE InventoryItem ADD COLUMN image LONGTEXT`);
        } catch (e) {
            // Likely already exists or DB error
        }

        const items = await prisma.inventoryItem.findMany({
            where: {
                companyId: String(companyId),
                isDeleted: showDeleted === 'true'
            },
            orderBy: { name: 'asc' }
        });
        res.status(200).json(items);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get single item
export const getInventoryItemById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const item = await prisma.inventoryItem.findUnique({ where: { id: String(id) } });

        if (!item || item.isDeleted) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json(item);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Create item
export const createInventoryItem = async (req: Request, res: Response) => {
    try {
        const { companyId, sku, name, description, quantityOnHand, reorderLevel, sellingPrice, category, image } = req.body;

        if (!companyId || !sku || !name) {
            return res.status(400).json({ message: 'Company ID, SKU, and Name are required' });
        }

        try {
            const newItem = await prisma.inventoryItem.create({
                data: {
                    companyId: String(companyId),
                    sku: String(sku),
                    name: String(name),
                    description,
                    quantityOnHand: quantityOnHand !== undefined ? Number(quantityOnHand) : 0,
                    reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : 5,
                    sellingPrice: sellingPrice ? Number(sellingPrice) : undefined,
                    category,
                    image
                }
            });
            return res.status(201).json(newItem);
        } catch (dbError: any) {
            // If image column is missing, try creating without it
            if (dbError.message.includes('image') || dbError.code === 'P2021') {
                const newItem = await prisma.inventoryItem.create({
                    data: {
                        companyId: String(companyId),
                        sku: String(sku),
                        name: String(name),
                        description,
                        quantityOnHand: quantityOnHand !== undefined ? Number(quantityOnHand) : 0,
                        reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : 5,
                        sellingPrice: sellingPrice ? Number(sellingPrice) : undefined,
                        category
                    }
                });
                return res.status(201).json(newItem);
            }
            throw dbError;
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Update item
export const updateInventoryItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Type cast numbers for strict Prisma schema
        if (updates.quantityOnHand !== undefined) updates.quantityOnHand = Number(updates.quantityOnHand);
        if (updates.reorderLevel !== undefined) updates.reorderLevel = Number(updates.reorderLevel);
        if (updates.sellingPrice !== undefined) updates.sellingPrice = Number(updates.sellingPrice);

        const item = await prisma.inventoryItem.update({
            where: { id: String(id) },
            data: { ...updates, lastModifiedAt: new Date() }
        });

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json(item);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Delete item
export const deleteInventoryItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const item = await prisma.inventoryItem.update({
            where: { id: String(id) },
            data: { isDeleted: true, lastModifiedAt: new Date() }
        });

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
// Restore item from Trash
export const restoreInventoryItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const item = await prisma.inventoryItem.update({
            where: { id: String(id) },
            data: { isDeleted: false, lastModifiedAt: new Date() }
        });

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json({ message: 'Item restored successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Delete item permanently
export const deleteItemPermanently = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.inventoryItem.delete({
            where: { id: String(id) }
        });

        res.status(200).json({ message: 'Item permanently deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
