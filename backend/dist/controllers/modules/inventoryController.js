import { prisma } from '../../src/config/db.js';
// Get all inventory items
export const getInventory = async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId) {
            return res.status(400).json({ message: 'Company ID is required' });
        }
        const items = await prisma.inventoryItem.findMany({
            where: { companyId: String(companyId), isDeleted: false },
            orderBy: { name: 'asc' }
        });
        res.status(200).json(items);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Get single item
export const getInventoryItemById = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await prisma.inventoryItem.findUnique({ where: { id: String(id) } });
        if (!item || item.isDeleted) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(200).json(item);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Create item
export const createInventoryItem = async (req, res) => {
    try {
        const { companyId, sku, name, description, quantityOnHand, reorderLevel, costPrice, sellingPrice, category } = req.body;
        if (!companyId || !sku || !name) {
            return res.status(400).json({ message: 'Company ID, SKU, and Name are required' });
        }
        const newItem = await prisma.inventoryItem.create({
            data: {
                companyId: String(companyId),
                sku: String(sku),
                name: String(name),
                description,
                quantityOnHand: quantityOnHand !== undefined ? Number(quantityOnHand) : 0,
                reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : 5,
                costPrice: costPrice ? Number(costPrice) : undefined,
                sellingPrice: sellingPrice ? Number(sellingPrice) : undefined,
                category
            }
        });
        res.status(201).json(newItem);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Update item
export const updateInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        // Type cast numbers for strict Prisma schema
        if (updates.quantityOnHand !== undefined)
            updates.quantityOnHand = Number(updates.quantityOnHand);
        if (updates.reorderLevel !== undefined)
            updates.reorderLevel = Number(updates.reorderLevel);
        if (updates.costPrice !== undefined)
            updates.costPrice = Number(updates.costPrice);
        if (updates.sellingPrice !== undefined)
            updates.sellingPrice = Number(updates.sellingPrice);
        const item = await prisma.inventoryItem.update({
            where: { id: String(id) },
            data: { ...updates, lastModifiedAt: new Date() }
        });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(200).json(item);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Delete item
export const deleteInventoryItem = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
