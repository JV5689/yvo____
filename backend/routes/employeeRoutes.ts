import express from 'express';
import * as employeeController from '../controllers/modules/employeeController.js';
import { checkSubscriptionStatus } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

// READ-ONLY Check
router.use(checkSubscriptionStatus);

// SPECIFIC ROUTES (MUST come BEFORE /:id generic route)

// Salary
router.get('/salary-records', employeeController.getSalaryRecords);
router.delete('/salary-records/:id', employeeController.deleteSalaryRecord); // [NEW] Link delete to controller
router.post('/:id/pay', employeeController.paySalary);
router.get('/:id/calculate-salary', employeeController.calculateSalary);

// Leaves
router.get('/leaves', employeeController.getLeaveRequests);
router.patch('/leaves/:id', employeeController.updateLeaveStatus);

// Broadcasts
router.post('/groups', employeeController.createBroadcastGroup);
router.get('/groups', employeeController.getBroadcastGroups);
router.put('/groups/:id', employeeController.updateBroadcastGroup);
router.delete('/groups/:id', employeeController.deleteBroadcastGroup);
router.post('/send-message', employeeController.sendBroadcastMessage);

// GENERIC ROUTES (MUST come AFTER specific routes)

// Employees
router.get('/', employeeController.getEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', employeeController.createEmployee);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);
router.patch('/:id/restore', employeeController.restoreEmployee); // [NEW] Restore route

export default router;
