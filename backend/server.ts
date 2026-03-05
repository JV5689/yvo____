import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { securityHeaders, corsOptions } from './src/middleware/security.js';
import { globalLimiter } from './src/middleware/rateLimiter.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import connectDb from './src/config/db.js';
import cookieParser from 'cookie-parser';

import saRoutes from './routes/saRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import authRoutes from './routes/authRoutes.js';
import syncRoutes from './routes/syncRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import modulePaymentRoutes from './routes/modulePaymentRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import backupRoutes from './routes/backupRoutes.js';
import invoiceTemplateRoutes from './routes/invoiceTemplateRoutes.js';
import employeeAuthRoutes from './routes/employeeAuthRoutes.js';
import employeeDashboardRoutes from './routes/employeeDashboardRoutes.js';

dotenv.config();

const app = express();

// Security Middlewares
app.use(securityHeaders);
app.use(corsOptions);
app.use(globalLimiter);
app.use(cookieParser());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Database Connection
connectDb();

// Routes
app.use('/api/sa', saRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/public', publicRoutes);

// Module Routes
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/employee/auth', employeeAuthRoutes);
app.use('/api/employee/dashboard', employeeDashboardRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/client-payments', modulePaymentRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/invoice-templates', invoiceTemplateRoutes);

app.get('/', (req: express.Request, res: express.Response) => {
  res.send('YVO Backend API Running');
});

// Error Handler (Must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
