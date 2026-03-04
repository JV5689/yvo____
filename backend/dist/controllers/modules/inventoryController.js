import { prisma } from '../../src/config/db.js';
// Get all inventory items
export const getInventory = async (req, res) => {
    try {
        const { companyId, showDeleted } = req.query;
        if (!companyId) {
            return res.status(400).json({ message: 'Company ID is required' });
        }
        // Use raw SQL to include image column (Prisma client may not know about it)
        const isDeleted = showDeleted === 'true' ? 1 : 0;
        const items = await prisma.$queryRawUnsafe(`SELECT * FROM InventoryItem WHERE companyId = ? AND isDeleted = ? ORDER BY name ASC`, String(companyId), isDeleted);
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
        const { companyId, sku, name, description, quantityOnHand, reorderLevel, sellingPrice, category, image } = req.body;
        if (!companyId || !sku || !name) {
            return res.status(400).json({ message: 'Company ID, SKU, and Name are required' });
        }
        // Create item without image first (Prisma client may not know about image column)
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
        // If image provided, update via raw SQL (bypasses stale Prisma client)
        if (image && newItem.id) {
            try {
                await prisma.$executeRawUnsafe(`UPDATE InventoryItem SET image = ? WHERE id = ?`, image, newItem.id);
            }
            catch (imgErr) {
                console.warn('Could not set image:', imgErr);
            }
        }
        res.status(201).json({ ...newItem, image: image || null });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Update item
export const updateInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        const image = updates.image;
        delete updates.image; // Remove image from Prisma update (client doesn't know about it)
        delete updates.companyId; // Don't allow changing companyId
        // Type cast numbers for strict Prisma schema
        if (updates.quantityOnHand !== undefined)
            updates.quantityOnHand = Number(updates.quantityOnHand);
        if (updates.reorderLevel !== undefined)
            updates.reorderLevel = Number(updates.reorderLevel);
        if (updates.sellingPrice !== undefined)
            updates.sellingPrice = Number(updates.sellingPrice);
        const item = await prisma.inventoryItem.update({
            where: { id: String(id) },
            data: { ...updates, lastModifiedAt: new Date() }
        });
        // Update image via raw SQL if provided
        if (image !== undefined) {
            try {
                await prisma.$executeRawUnsafe(`UPDATE InventoryItem SET image = ? WHERE id = ?`, image || null, String(id));
            }
            catch (imgErr) {
                console.warn('Could not update image:', imgErr);
            }
        }
        res.status(200).json({ ...item, image: image !== undefined ? image : null });
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
// Restore item from Trash
export const restoreInventoryItem = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Delete item permanently
export const deleteItemPermanently = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.inventoryItem.delete({
            where: { id: String(id) }
        });
        res.status(200).json({ message: 'Item permanently deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
