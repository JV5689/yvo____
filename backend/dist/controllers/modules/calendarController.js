import { prisma } from '../../src/config/db.js';
// Get all events
export const getEvents = async (req, res) => {
    try {
        const { companyId, start, end } = req.query;
        if (!companyId)
            return res.status(400).json({ message: 'Company ID is required' });
        const query = { companyId: String(companyId), isDeleted: false };
        if (start && end) {
            query.start = { gte: new Date(start) };
            query.end = { lte: new Date(end) };
        }
        const events = await prisma.calendarEvent.findMany({
            where: query,
            orderBy: { start: 'asc' }
        });
        res.status(200).json(events);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Create event
export const createEvent = async (req, res) => {
    try {
        const { companyId, title, description, start, end, type, attendees } = req.body;
        if (!companyId || !title || !start || !end) {
            return res.status(400).json({ message: 'Company ID, Title, Start, and End are required' });
        }
        const newEvent = await prisma.calendarEvent.create({
            data: {
                companyId: String(companyId),
                title,
                description,
                start: new Date(start),
                end: new Date(end),
                type,
                visibility: req.body.visibility || 'public',
                targetCategories: req.body.targetCategories || [],
                attendees: attendees || []
            }
        });
        res.status(201).json(newEvent);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Update event
export const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        if (updates.start)
            updates.start = new Date(updates.start);
        if (updates.end)
            updates.end = new Date(updates.end);
        const event = await prisma.calendarEvent.update({
            where: { id: String(id) },
            data: updates
        });
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json(event);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Delete event
export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await prisma.calendarEvent.update({
            where: { id: String(id) },
            data: { isDeleted: true }
        });
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json({ message: 'Event deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
