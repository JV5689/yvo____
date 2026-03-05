import { prisma } from '../src/config/db.js';
// --- Salary ---
export const getSalaryHistory = async (req, res) => {
    try {
        const employeeId = String(req.user?.id || req.user?.userId);
        const history = await prisma.salaryRecord.findMany({
            where: { employeeId },
            orderBy: { paymentDate: 'desc' }
        });
        res.json(history);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching salary history' });
    }
};
// --- Leaves ---
export const getLeaveHistory = async (req, res) => {
    try {
        const employeeId = String(req.user?.id || req.user?.userId);
        const leaves = await prisma.leaveRequest.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(leaves);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching leave history' });
    }
};
export const applyForLeave = async (req, res) => {
    try {
        const employeeId = String(req.user?.id || req.user?.userId);
        const companyId = String(req.user?.companyId);
        const { type, startDate, endDate, reason } = req.body;
        const newLeave = await prisma.leaveRequest.create({
            data: {
                companyId,
                employeeId,
                type,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                status: 'Pending'
            }
        });
        res.status(201).json(newLeave);
    }
    catch (error) {
        res.status(500).json({ message: 'Error applying for leave' });
    }
};
// --- Calendar ---
export const getEmployeeCalendar = async (req, res) => {
    try {
        const employeeId = String(req.user?.id || req.user?.userId);
        const companyId = String(req.user?.companyId);
        // Fetch employee to get category
        const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
        if (!employee)
            return res.status(404).json({ message: 'Employee not found' });
        const myCategory = employee.category || 'General';
        // Prisma Json filtering is complex for "targetCategories contains myCategory", so we get public + email targeted natively,
        // and filter category manually if needed.
        // Actually since targetCategories is a Json array, we can use `array_contains` if using MySQL 5.7+ JSON methods,
        // but Prisma standard querying uses `string_contains` inside arrays with Postgres, but MySQL JSON needs raw or specific syntax.
        // Easiest is to fetch public & employee-specific natively, then in-memory filter if needed, OR we fetch all for company and filter.
        const events = await prisma.calendarEvent.findMany({
            where: {
                companyId,
                isDeleted: false
            },
            orderBy: { start: 'asc' }
        });
        const filteredEvents = events.filter(e => {
            if (e.visibility === 'public')
                return true;
            if (e.visibility === 'category' && Array.isArray(e.targetCategories) && e.targetCategories.includes(myCategory))
                return true;
            if (Array.isArray(e.attendees) && e.attendees.includes(employee.email))
                return true;
            return false;
        });
        res.json(filteredEvents);
        res.json(events);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching calendar' });
    }
};
// --- Broadcasts ---
export const getEmployeeBroadcasts = async (req, res) => {
    try {
        const employeeId = String(req.user?.id || req.user?.userId);
        const companyId = String(req.user?.companyId);
        // 1. Find groups I belong to
        const myGroupMemberships = await prisma.broadcastGroupMember.findMany({
            where: {
                employeeId,
                group: { companyId },
            },
            select: { groupId: true }
        });
        const groupIds = myGroupMemberships.map(g => g.groupId);
        // 2. Find messages: Target All OR Target My Groups
        const messages = await prisma.broadcastMessage.findMany({
            where: {
                companyId,
                OR: [
                    { targetAll: true },
                    { groupId: { in: groupIds } }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(messages);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching broadcasts' });
    }
};
// --- Reports ---
export const submitWorkReport = async (req, res) => {
    try {
        const { tasksCompleted, issues, nextDayPlan } = req.body;
        const employeeId = String(req.user?.id || req.user?.userId);
        const companyId = String(req.user?.companyId);
        // Check if report already exists for today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const existingReport = await prisma.workReport.findFirst({
            where: {
                employeeId,
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });
        if (existingReport) {
            return res.status(400).json({ message: 'Report for today already submitted.' });
        }
        const report = await prisma.workReport.create({
            data: {
                employeeId,
                companyId,
                tasksCompleted,
                issues,
                nextDayPlan
            }
        });
        res.status(201).json(report);
    }
    catch (error) {
        console.error("Error submitting report:", error);
        res.status(500).json({ message: 'Server error submitting report' });
    }
};
