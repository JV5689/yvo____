import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000/api';
async function runTests() {
    console.log('--- Starting Restore Endpoint Verification ---');
    let testCompanyId = null;
    let saToken = null;
    try {
        const saRes = await axios.post(`${API_URL}/admin/login`, {
            username: 'admin',
            password: 'secret'
        });
        saToken = saRes.data.token;
        // Create Test Company
        const plan = await prisma.plan.findFirst();
        const testCompany = await prisma.company.create({
            data: {
                name: 'Restore Test Company',
                planId: plan.id,
                subscriptionStatus: 'active',
            }
        });
        testCompanyId = testCompany.id;
        console.log(`✅ Test Company created with ID: ${testCompanyId}`);
        const authHeaders = { headers: { Authorization: `Bearer ${saToken}` } };
        const queryStr = `?companyId=${testCompanyId}`;
        // --- 1. Customer ---
        console.log('\n[1] Testing Customer Restore...');
        const customer = await prisma.customer.create({
            data: { companyId: testCompanyId, name: 'Restore Cust', email: 'rest@cust.com' }
        });
        await axios.delete(`${API_URL}/customers/${customer.id}${queryStr}`, authHeaders);
        const delCust = await prisma.customer.findUnique({ where: { id: customer.id } });
        if (!delCust || !delCust.isDeleted)
            throw new Error('Customer failed to delete');
        console.log(' - Customer was soft deleted.');
        await axios.patch(`${API_URL}/customers/${customer.id}/restore${queryStr}`, {}, authHeaders);
        const restCust = await prisma.customer.findUnique({ where: { id: customer.id } });
        if (!restCust || restCust.isDeleted)
            throw new Error('Customer failed to restore');
        console.log('✅ Customer Restore Endpoint Works!');
        // --- 2. Invoice ---
        console.log('\n[2] Testing Invoice Restore...');
        const invoice = await prisma.invoice.create({
            data: {
                companyId: testCompanyId, invoiceNumber: 'REST-01', customerId: customer.id, status: 'DRAFT', grandTotal: 100, date: new Date()
            }
        });
        await axios.delete(`${API_URL}/invoices/${invoice.id}${queryStr}`, authHeaders);
        const delInv = await prisma.invoice.findUnique({ where: { id: invoice.id } });
        if (!delInv || !delInv.isDeleted)
            throw new Error('Invoice failed to delete');
        console.log(' - Invoice was soft deleted.');
        await axios.patch(`${API_URL}/invoices/${invoice.id}/restore${queryStr}`, {}, authHeaders);
        const restInv = await prisma.invoice.findUnique({ where: { id: invoice.id } });
        if (!restInv || restInv.isDeleted)
            throw new Error('Invoice failed to restore');
        console.log('✅ Invoice Restore Endpoint Works!');
        // --- 3. Expense ---
        console.log('\n[3] Testing Expense Restore...');
        const expense = await prisma.expense.create({
            data: { companyId: testCompanyId, category: 'Testing', amount: 50, date: new Date() }
        });
        await axios.delete(`${API_URL}/expenses/${expense.id}${queryStr}`, authHeaders);
        const delExp = await prisma.expense.findUnique({ where: { id: expense.id } });
        if (!delExp || !delExp.isDeleted)
            throw new Error('Expense failed to delete');
        console.log(' - Expense was soft deleted.');
        await axios.patch(`${API_URL}/expenses/${expense.id}/restore${queryStr}`, {}, authHeaders);
        const restExp = await prisma.expense.findUnique({ where: { id: expense.id } });
        if (!restExp || restExp.isDeleted)
            throw new Error('Expense failed to restore');
        console.log('✅ Expense Restore Endpoint Works!');
        // --- 4. Payment (Corrected URL!) ---
        console.log('\n[4] Testing Payment Restore...');
        const payment = await prisma.payment.create({
            data: { companyId: testCompanyId, customerId: customer.id, amount: 100, date: new Date(), method: 'CASH' }
        });
        await axios.delete(`${API_URL}/client-payments/${payment.id}${queryStr}`, authHeaders);
        const delPay = await prisma.payment.findUnique({ where: { id: payment.id } });
        if (!delPay || !delPay.isDeleted)
            throw new Error('Payment failed to delete');
        console.log(' - Payment was soft deleted.');
        await axios.patch(`${API_URL}/client-payments/${payment.id}/restore${queryStr}`, {}, authHeaders);
        const restPay = await prisma.payment.findUnique({ where: { id: payment.id } });
        if (!restPay || restPay.isDeleted)
            throw new Error('Payment failed to restore');
        console.log('✅ Payment Restore Endpoint Works!');
        console.log('\n🎉 ALL RESTORE ENDPOINTS VERIFIED SUCCESSFULLY 🎉');
    }
    catch (err) {
        console.error('\n❌ Test Failed:', err.message);
        if (err.response) {
            console.error('Response Status:', err.response.status);
            console.error('Response details:', JSON.stringify(err.response.data));
        }
    }
    finally {
        if (testCompanyId) {
            console.log('\n[Cleanup] Removing restore test data...');
            await prisma.payment.deleteMany({ where: { companyId: testCompanyId } });
            await prisma.expense.deleteMany({ where: { companyId: testCompanyId } });
            await prisma.invoiceItem.deleteMany({ where: { invoice: { companyId: testCompanyId } } });
            await prisma.invoice.deleteMany({ where: { companyId: testCompanyId } });
            await prisma.customer.deleteMany({ where: { companyId: testCompanyId } });
            await prisma.company.delete({ where: { id: testCompanyId } });
            console.log('✅ Cleanup complete');
        }
    }
}
runTests();
