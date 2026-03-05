import express from 'express';
import { loginEmployee, getEmployeeProfile } from '../controllers/employeeAuthController.js';
import { requireAuth as protectEmployee } from '../src/middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', loginEmployee);
router.get('/me', protectEmployee, getEmployeeProfile);

export default router;
