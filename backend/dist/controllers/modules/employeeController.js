import { prisma } from '../../src/config/db.js';
import bcrypt from 'bcryptjs';
// ... existing imports
import nodemailer from 'nodemailer';
// --- Salary Records ---
export const getSalaryRecords = async (req, res) => {
    try {
        const { companyId, employeeId } = req.query;
        if (!companyId)
            return res.status(400).json({ message: 'Company ID is required' });
        const query = { companyId };
        if (employeeId)
            query.employeeId = employeeId;
        const records = await prisma.salaryRecord.findMany({
            where: query,
            include: { employee: { select: { firstName: true, lastName: true, position: true } } },
            orderBy: { paymentDate: 'desc' }
        });
        res.status(200).json(records);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const deleteSalaryRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await prisma.salaryRecord.findUnique({ where: { id: String(id) } });
        if (!record)
            return res.status(404).json({ message: 'Salary record not found' });
        // Delete associated expense if it exists (matching amount and date approx?)
        // Ideally we should have stored expenseId in SalaryRecord.
        // For now, we'll try to find a matching expense.
        await prisma.expense.deleteMany({
            where: {
                companyId: record.companyId,
                category: 'Payroll',
                amount: Number(record.amount),
                date: record.paymentDate
            }
        });
        await prisma.salaryRecord.delete({ where: { id: String(id) } });
        res.status(200).json({ message: 'Salary record deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// ... Broadcasts ... (No changes)
export const createBroadcastGroup = async (req, res) => {
    try {
        const { companyId, name, memberIds } = req.body;
        // In prisma, map memberIds array to connect objects
        const newGroup = await prisma.broadcastGroup.create({
            data: {
                companyId: String(companyId),
                name,
                members: {
                    create: (memberIds || []).map((empId) => ({
                        employeeId: empId
                    }))
                }
            }
        });
        res.status(201).json(newGroup);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getBroadcastGroups = async (req, res) => {
    try {
        const { companyId } = req.query;
        const groups = await prisma.broadcastGroup.findMany({
            where: { companyId: String(companyId) },
            include: {
                members: {
                    include: { employee: { select: { firstName: true, lastName: true } } }
                }
            }
        });
        res.json(groups);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const updateBroadcastGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, members } = req.body;
        // In Prisma, we must delete current members and recreate them or use complex upserts.
        // Simplest is delete all group memberships and recreate.
        const group = await prisma.broadcastGroup.update({
            where: { id: String(id) },
            data: {
                name,
                members: {
                    deleteMany: {},
                    create: (members || []).map((empId) => ({ employeeId: empId }))
                }
            },
            include: {
                members: {
                    include: { employee: { select: { firstName: true, lastName: true } } }
                }
            }
        });
        if (!group)
            return res.status(404).json({ message: 'Group not found' });
        res.json(group);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const deleteBroadcastGroup = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.broadcastMessage.deleteMany({ where: { groupId: String(id) } });
        await prisma.broadcastGroup.delete({ where: { id: String(id) } });
        res.json({ message: 'Group deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const sendBroadcastMessage = async (req, res) => {
    try {
        const { companyId, senderId, groupId, targetAll, content, attachments } = req.body;
        const message = await prisma.broadcastMessage.create({
            data: {
                companyId: String(companyId),
                senderId: String(senderId), // User ID of Admin
                groupId: targetAll ? null : String(groupId),
                targetAll,
                content,
                attachments: attachments || []
            }
        });
        res.status(201).json(message);
    }
    catch (error) {
        console.error("Error sending broadcast:", error);
        res.status(500).json({ message: error.message });
    }
};
// Get all employees (Modified to support Deleted view)
export const getEmployees = async (req, res) => {
    try {
        const { companyId, isDeleted } = req.query;
        if (!companyId)
            return res.status(400).json({ message: 'Company ID is required' });
        const filter = { companyId: String(companyId) };
        if (isDeleted === 'true') {
            filter.isDeleted = true;
        }
        else {
            filter.isDeleted = false; // Default behavior
        }
        const employees = await prisma.employee.findMany({
            where: filter,
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(employees);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Get single employee
export const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await prisma.employee.findUnique({ where: { id: String(id) } });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.status(200).json(employee);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Create employee
export const createEmployee = async (req, res) => {
    try {
        console.log("Create Employee Request Body:", req.body);
        const { companyId, firstName, lastName, email, phone, password, position, department, salary, status, dateHired, category, avatar, freeLeavesPerMonth, workingDaysPerWeek } = req.body;
        if (!companyId || !firstName || !lastName || !email || !phone || !password) {
            return res.status(400).json({ message: 'Company ID, Name, Email, Phone, and Password are required' });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const newEmployee = await prisma.employee.create({
            data: {
                companyId: String(companyId),
                firstName,
                lastName,
                email,
                phone,
                password: hashedPassword,
                position,
                department,
                salary: Number(salary),
                status,
                dateHired: dateHired ? new Date(dateHired) : new Date(),
                category: category || 'General',
                avatar,
                freeLeavesPerMonth: freeLeavesPerMonth !== undefined ? Number(freeLeavesPerMonth) : 1,
                workingDaysPerWeek: workingDaysPerWeek ? Number(workingDaysPerWeek) : 6
            }
        });
        res.status(201).json(newEmployee);
    }
    catch (error) {
        console.error("Create Employee Error:", error);
        res.status(500).json({ message: error.message });
    }
};
// Update employee
export const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        // Hash password if it is being updated
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }
        const currentEmployee = await prisma.employee.findUnique({ where: { id: String(id) } }); // Changed from Employee.findById
        if (!currentEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        // Check if salary is being updated and is different
        let newSalaryHistory = undefined;
        if (updates.salary && Number(updates.salary) !== currentEmployee.salary) {
            newSalaryHistory = {
                amount: currentEmployee.salary,
                changeDate: new Date()
            };
        }
        const updateData = { ...updates };
        if (newSalaryHistory) {
            updateData.salaryHistory = { create: newSalaryHistory };
        }
        const employee = await prisma.employee.update({
            where: { id: String(id) },
            data: updateData
        });
        res.status(200).json(employee);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Delete employee
export const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        // Find the employee first to get current data
        const employeeToDelete = await prisma.employee.findUnique({ where: { id: String(id) } });
        if (!employeeToDelete) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        // Mangle email and phone to allow reuse
        const timestamp = Date.now();
        const mangledEmail = `${employeeToDelete.email}-deleted-${timestamp}`;
        const mangledPhone = `${employeeToDelete.phone}-deleted-${timestamp}`;
        const employee = await prisma.employee.update({
            where: { id: String(id) },
            data: {
                isDeleted: true,
                email: mangledEmail,
                phone: mangledPhone,
                status: 'Terminated'
            }
        });
        // Remove employee from all BroadcastGroups they are a member of
        // In Prisma, we delete the join table records directly
        await prisma.broadcastGroupMember.deleteMany({
            where: {
                group: { companyId: employeeToDelete.companyId },
                employeeId: String(id)
            }
        });
        res.status(200).json({ message: 'Employee deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Restore Employee
export const restoreEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await prisma.employee.findUnique({ where: { id: String(id) } });
        if (!employee)
            return res.status(404).json({ message: 'Employee not found' });
        // Un-mangle (heuristic: removing -deleted-timestamp)
        // Or simply ask user to update email if collision?
        // Let's try to strip the suffix.
        let newEmail = employee.email.split('-deleted-')[0];
        let newPhone = employee.phone.split('-deleted-')[0];
        // Check for collisions
        const existing = await prisma.employee.findFirst({
            where: {
                OR: [{ email: newEmail }, { phone: newPhone }],
                id: { not: String(id) },
                isDeleted: false
            }
        });
        if (existing) {
            return res.status(400).json({ message: 'Original email/phone is taken by another active employee. Please manually edit to restore.' });
        }
        await prisma.employee.update({
            where: { id: String(id) },
            data: {
                isDeleted: false,
                status: 'Active',
                email: newEmail,
                phone: newPhone
            }
        });
        res.status(200).json(employee);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Pay Salary with Leave Deduction
export const paySalary = async (req, res) => {
    try {
        const { id } = req.params; // Employee ID
        const { amount, payPeriod, paymentDate, remarks, companyId } = req.body;
        const employee = await prisma.employee.findUnique({ where: { id: String(id) } });
        if (!employee)
            return res.status(404).json({ message: 'Employee not found' });
        const { baseSalary, leavesTaken, freeLeaves, deductionAmount } = req.body;
        // 1. Create Salary Record
        const salaryRecord = await prisma.salaryRecord.create({
            data: {
                companyId: String(companyId),
                employeeId: String(id),
                amount: Number(amount), // Final Paid Amount
                baseSalary: baseSalary ? Number(baseSalary) : employee.salary,
                bonus: req.body.bonus ? Number(req.body.bonus) : 0,
                leavesTaken: leavesTaken ? Number(leavesTaken) : 0,
                freeLeaves: freeLeaves ? Number(freeLeaves) : employee.freeLeavesPerMonth,
                deductionAmount: deductionAmount ? Number(deductionAmount) : 0,
                paymentDate: new Date(paymentDate),
                payPeriod: String(payPeriod),
                remarks: remarks ? String(remarks) : undefined,
                status: 'Paid'
            }
        });
        // 2. Create Expense
        const expense = await prisma.expense.create({
            data: {
                companyId: String(companyId),
                category: 'Payroll',
                amount: Number(amount),
                date: new Date(paymentDate),
                description: `Salary Payment for ${employee.firstName} ${employee.lastName} - ${payPeriod}`,
                paymentMethod: 'Bank Transfer'
            }
        });
        // 3. Send Email Notification
        // Only if email and password env vars are set (or mocked)
        // For this demo, we can assume a simple transporter if envs exist, else skip
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: employee.email,
                subject: `Salary Slip: ${payPeriod}`,
                text: `Dear ${employee.firstName},\n\nYour salary for ${payPeriod} has been processed.\n\nAmount Credited: ₹${amount}\nPayment Date: ${paymentDate}\n\nRemarks: ${remarks || ''}\n\nThank you,\n${companyId} HR Team`
            };
            // Non-blocking email send
            transporter.sendMail(mailOptions).catch(err => console.error("Failed to send salary email:", err));
        }
        res.status(200).json({ message: 'Salary paid and expense recorded', salaryRecord });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Calculate Salary Endpoint (Helper for Frontend)
export const calculateSalary = async (req, res) => {
    try {
        const { id } = req.params;
        const { month, year } = req.query; // e.g. 10, 2023
        const employee = await prisma.employee.findUnique({ where: { id: String(id) } });
        if (!employee)
            return res.status(404).json({ message: 'Employee not found' });
        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0); // Last day of month
        // Fetch Approved Leaves
        const leaves = await prisma.leaveRequest.findMany({
            where: {
                employeeId: String(id),
                status: 'Approved',
                startDate: { gte: startDate },
                endDate: { lte: endDate }
            }
        });
        // Calculate total leave days
        let totalLeaves = 0;
        leaves.forEach((leave) => {
            const start = new Date(Math.max(leave.startDate.getTime(), startDate.getTime()));
            const end = new Date(Math.min(leave.endDate.getTime(), endDate.getTime()));
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            totalLeaves += diffDays;
        });
        const freeLeaves = employee.freeLeavesPerMonth !== undefined ? employee.freeLeavesPerMonth : 1;
        const chargeableLeaves = Math.max(0, totalLeaves - freeLeaves);
        // Calculate Daily Salary based on Working Days
        const workingDaysPerWeek = employee.workingDaysPerWeek || 6;
        let avgWorkingDays = 26; // Default to 6 days/week
        if (workingDaysPerWeek === 5)
            avgWorkingDays = 22;
        else if (workingDaysPerWeek === 4)
            avgWorkingDays = 18;
        else if (workingDaysPerWeek === 7)
            avgWorkingDays = 30;
        else
            avgWorkingDays = workingDaysPerWeek * 4.33; // Fallback
        const dailySalary = (employee.salary / 12) / avgWorkingDays;
        // Deduction logic removed as per request
        // Deduction logic restored
        const deduction = Math.round(dailySalary * chargeableLeaves);
        const finalSalary = Math.round((employee.salary / 12) - deduction + (req.query.bonus ? Number(req.query.bonus) : 0));
        res.json({
            baseSalary: Math.round(employee.salary / 12),
            totalLeaves,
            freeLeaves,
            chargeableLeaves,
            workingDaysUsed: avgWorkingDays,
            deduction,
            finalSalary
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// --- Admin Leave Management ---
export const getLeaveRequests = async (req, res) => {
    try {
        const { companyId, employeeId } = req.query;
        if (!companyId)
            return res.status(400).json({ message: 'Company ID is required' });
        const query = { companyId: String(companyId) };
        if (employeeId)
            query.employeeId = String(employeeId);
        const leaves = await prisma.leaveRequest.findMany({
            where: query,
            include: { employee: { select: { firstName: true, lastName: true, position: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(leaves);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remark } = req.body; // 'Approved' or 'Rejected'
        const leave = await prisma.leaveRequest.update({
            where: { id: String(id) },
            data: { status, adminRemark: remark }
        });
        if (!leave)
            return res.status(404).json({ message: 'Leave request not found' });
        res.status(200).json(leave);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
