import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDb from './src/config/db.js';
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
import employeeAuthRoutes from './routes/employeeAuthRoutes.js';
import employeeDashboardRoutes from './routes/employeeDashboardRoutes.js';
import backupRoutes from './routes/backupRoutes.js';
import invoiceTemplateRoutes from './routes/invoiceTemplateRoutes.js';
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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
app.use('/api/employees', employeeRoutes); // Admin management
app.use('/api/employee/auth', employeeAuthRoutes); // New Employee Auth
app.use('/api/employee/dashboard', employeeDashboardRoutes); // New Employee Dashboard
app.use('/api/calendar', calendarRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/client-payments', modulePaymentRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/invoice-templates', invoiceTemplateRoutes);
app.get('/', (req, res) => {
    res.send('YVO Backend API Running');
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
