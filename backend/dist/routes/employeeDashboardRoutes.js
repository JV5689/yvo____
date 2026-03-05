import express from 'express';
import { getSalaryHistory, getLeaveHistory, applyForLeave, getEmployeeCalendar, getEmployeeBroadcasts, submitWorkReport } from '../controllers/employeeFeatureController.js';
import { requireAuth as protectEmployee } from '../src/middleware/auth.middleware.js';
const router = express.Router();
router.use(protectEmployee);
// Salary
router.get('/salary', getSalaryHistory);
// Leaves
router.get('/leaves', getLeaveHistory);
router.post('/leaves', applyForLeave);
// Calendar
router.get('/calendar', getEmployeeCalendar);
// Broadcasts
router.get('/broadcasts', getEmployeeBroadcasts);
// Reports
router.post('/reports', submitWorkReport);
export default router;
