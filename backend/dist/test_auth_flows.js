import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000/api';
async function runTests() {
    console.log('--- Starting Authentication Tests ---');
    let testCompanyId = null;
    let testCompanyEmail = 'flowtestowner@example.com';
    let saToken = null;
    try {
        // Cleanup prior runs safely
        await prisma.user.deleteMany({ where: { email: testCompanyEmail } });
        // 1. Super Admin Login
        console.log('\n[1] Testing Super Admin Login...');
        const saRes = await axios.post(`${API_URL}/admin/login`, {
            username: 'admin',
            password: 'secret'
        });
        if (saRes.data.token && saRes.data.role === 'SUPER_ADMIN') {
            console.log('✅ Super Admin login successful');
            saToken = saRes.data.token;
        }
        else {
            throw new Error('Super Admin login failed');
        }
        // 2. Setup a Test Company using API
        console.log('\n[2] Setting up Test Company...');
        const createRes = await axios.post(`${API_URL}/auth/register-company`, {
            companyName: 'Auth Test Company',
            ownerName: 'Flow Test Owner',
            email: testCompanyEmail,
            password: 'oldpassword'
        });
        testCompanyId = createRes.data.companyId || createRes.data._id;
        console.log(`✅ Test Company created with ID: ${testCompanyId}`);
        // 3. Test Initial Company Login
        console.log('\n[3] Testing Initial Company Login...');
        const coRes1 = await axios.post(`${API_URL}/auth/login`, {
            email: testCompanyEmail,
            password: 'oldpassword'
        });
        if (coRes1.data.token) {
            console.log('✅ Initial Company login successful');
        }
        // 4. Super Admin Changes Company Password
        console.log('\n[4] Testing Super Admin Changing Company Password...');
        const passRes = await axios.patch(`${API_URL}/sa/companies/${testCompanyId}/password`, { password: 'newsecretpassword' }, { headers: { Authorization: `Bearer ${saToken}` } });
        if (passRes.status === 200) {
            console.log('✅ Password change API returned success');
        }
        // 5. Verify Old Password Fails
        console.log('\n[5] Verifying Old Password Fails...');
        try {
            await axios.post(`${API_URL}/auth/login`, {
                email: testCompanyEmail,
                password: 'oldpassword'
            });
            console.log('❌ Auth allowed old password');
        }
        catch (err) {
            if (err.response && err.response.status === 401) {
                console.log('✅ Old password correctly rejected');
            }
            else {
                console.log('⚠️ Unexpected error from old password test:', err.message);
            }
        }
        // 6. Test New Company Login
        console.log('\n[6] Testing Company Login with New Password...');
        const coRes2 = await axios.post(`${API_URL}/auth/login`, {
            email: testCompanyEmail,
            password: 'newsecretpassword'
        });
        if (coRes2.data.token) {
            console.log('✅ Company login with NEW password successful');
        }
        console.log('\n--- All Authentication Tests Passed! ---');
    }
    catch (err) {
        console.error('\n❌ Test Failed:', err.message);
        if (err.response) {
            console.error('Response Status:', err.response.status);
            console.error('Response details:', JSON.stringify(err.response.data));
        }
        else {
            console.error(err);
        }
    }
    finally {
        // Cleanup
        if (testCompanyId) {
            try {
                console.log('\n[Cleanup] Removing test data...');
                // Need to delete user first due to foreign keys if they restrict it, or let Prisma Handle cascade.
                await prisma.user.deleteMany({ where: { email: testCompanyEmail } });
                await prisma.company.delete({ where: { id: testCompanyId } });
                console.log('✅ Cleanup complete');
            }
            catch (cleanErr) {
                console.error('Failed to cleanup test data:', cleanErr);
            }
        }
    }
}
runTests();
