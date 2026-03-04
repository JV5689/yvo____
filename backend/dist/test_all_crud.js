import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000/api';
async function runTests() {
    console.log('--- Starting Comprehensive CRUD Verification ---');
    let testCompanyId = null;
    let saToken = null;
    try {
        // 1. Super Admin Login for setup
        const saRes = await axios.post(`${API_URL}/admin/login`, {
            username: 'admin',
            password: 'secret'
        });
        saToken = saRes.data.token;
        // Create Test Company
        const plan = await prisma.plan.findFirst();
        const testCompany = await prisma.company.create({
            data: {
                name: 'CRUD Test Company',
                planId: plan.id,
                subscriptionStatus: 'active',
            }
        });
        testCompanyId = testCompany.id;
        console.log(`✅ Test Company created with ID: ${testCompanyId}`);
        const authHeaders = { headers: { Authorization: `Bearer ${saToken}` } };
        const queryStr = `?companyId=${testCompanyId}`;
        const bodyBase = { companyId: testCompanyId };
        // ======================================
        // 1. EMPLOYEE CRUD
        // ======================================
        console.log('\n[1] Testing Employee CRUD...');
        // Create
        const empCreate = await axios.post(`${API_URL}/employees/`, {
            ...bodyBase,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@crud.com',
            phone: '1234567890',
            password: 'password123',
            salary: 50000,
            status: 'Active'
        }, authHeaders);
        const empId = empCreate.data.id;
        console.log(' - ✅ Created Employee');
        // Read
        const empRead = await axios.get(`${API_URL}/employees/${empId}`, authHeaders);
        if (empRead.data.firstName !== 'John')
            throw new Error("Employee read failed");
        console.log(' - ✅ Read Employee');
        // Update
        await axios.put(`${API_URL}/employees/${empId}`, { salary: 60000 }, authHeaders);
        console.log(' - ✅ Updated Employee');
        // Delete
        await axios.delete(`${API_URL}/employees/${empId}`, authHeaders);
        console.log(' - ✅ Deleted Employee');
        // ======================================
        // 2. CUSTOMER CRUD
        // ======================================
        console.log('\n[2] Testing Customer CRUD...');
        // Create
        const custCreate = await axios.post(`${API_URL}/customers/`, {
            ...bodyBase,
            name: 'Acme Corp',
            email: 'contact@acmecorp.com',
            phone: '987654321'
        }, authHeaders);
        const custId = custCreate.data.id;
        console.log(' - ✅ Created Customer');
        // Read
        const custRead = await axios.get(`${API_URL}/customers/${custId}`, authHeaders);
        if (custRead.data.name !== 'Acme Corp')
            throw new Error("Customer read failed");
        console.log(' - ✅ Read Customer');
        // Update
        await axios.patch(`${API_URL}/customers/${custId}`, { phone: '11111111' }, authHeaders);
        console.log(' - ✅ Updated Customer');
        // ======================================
        // 3. INVENTORY CRUD
        // ======================================
        console.log('\n[3] Testing Inventory CRUD...');
        // Create
        const invCreate = await axios.post(`${API_URL}/inventory/`, {
            ...bodyBase,
            sku: 'ITEM-001',
            name: 'Widget A',
            quantityOnHand: 100,
            sellingPrice: 15.50
        }, authHeaders);
        const invId = invCreate.data.id;
        console.log(' - ✅ Created Inventory Item');
        // Read
        const invRead = await axios.get(`${API_URL}/inventory/${invId}`, authHeaders);
        if (invRead.data.sku !== 'ITEM-001')
            throw new Error("Inventory read failed");
        console.log(' - ✅ Read Inventory Item');
        // Update
        await axios.patch(`${API_URL}/inventory/${invId}`, { quantityOnHand: 150 }, authHeaders);
        console.log(' - ✅ Updated Inventory Item');
        // Delete
        await axios.delete(`${API_URL}/inventory/${invId}`, authHeaders);
        console.log(' - ✅ Deleted Inventory Item');
        // ======================================
        // 4. INVOICE CRUD
        // ======================================
        console.log('\n[4] Testing Invoice CRUD...');
        // Create
        const invoiceCreate = await axios.post(`${API_URL}/invoices/`, {
            ...bodyBase,
            invoiceNumber: 'INV-1001',
            customerId: custId,
            date: new Date(),
            status: 'DRAFT',
            items: [
                { description: 'Service A', quantity: 2, price: 50, total: 100 }
            ]
        }, authHeaders);
        const invoiceId = invoiceCreate.data.id;
        console.log(' - ✅ Created Invoice');
        // Read
        const invoiceRead = await axios.get(`${API_URL}/invoices/${invoiceId}`, authHeaders);
        if (invoiceRead.data.invoiceNumber !== 'INV-1001')
            throw new Error("Invoice read failed");
        console.log(' - ✅ Read Invoice');
        // Update
        await axios.patch(`${API_URL}/invoices/${invoiceId}`, { status: 'PENDING' }, authHeaders);
        console.log(' - ✅ Updated Invoice');
        // Delete
        await axios.delete(`${API_URL}/invoices/${invoiceId}`, authHeaders);
        console.log(' - ✅ Deleted Invoice');
        // ======================================
        // 5. INVOICE TEMPLATE CRUD
        // ======================================
        console.log('\n[5] Testing Invoice Template CRUD...');
        // Create
        const tplCreate = await axios.post(`${API_URL}/invoice-templates/`, {
            ...bodyBase,
            name: 'Standard Template',
            htmlContent: '<h1>Invoice</h1>'
        }, authHeaders);
        const tplId = tplCreate.data.id;
        console.log(' - ✅ Created Template');
        // Update
        await axios.patch(`${API_URL}/invoice-templates/${tplId}`, { name: 'Updated Template' }, authHeaders);
        console.log(' - ✅ Updated Template');
        // Delete
        await axios.delete(`${API_URL}/invoice-templates/${tplId}`, authHeaders);
        console.log(' - ✅ Deleted Template');
        console.log('\n🎉 ALL CRUD ENDPOINTS VERIFIED SUCCESSFULLY 🎉');
    }
    catch (err) {
        console.error('\n❌ Test Failed:', err.message);
        if (err.response) {
            console.error('Response Status:', err.response.status);
            console.error('Response details:', JSON.stringify(err.response.data));
        }
    }
    finally {
        // Cleanup
        if (testCompanyId) {
            console.log('\n[Cleanup] Removing CRUD test data...');
            await prisma.employee.deleteMany({ where: { companyId: testCompanyId } });
            await prisma.invoiceItem.deleteMany({ where: { invoice: { companyId: testCompanyId } } });
            await prisma.invoice.deleteMany({ where: { companyId: testCompanyId } });
            await prisma.inventoryItem.deleteMany({ where: { companyId: testCompanyId } });
            await prisma.customer.deleteMany({ where: { companyId: testCompanyId } });
            await prisma.invoiceTemplate.deleteMany({ where: { companyId: testCompanyId } });
            await prisma.company.delete({ where: { id: testCompanyId } });
            console.log('✅ Cleanup complete');
        }
    }
}
runTests();
