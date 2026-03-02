import axios from 'axios';

async function runTest() {
    const BASE_URL = 'http://localhost:4000';
    console.log('=== Starting Backend Data Flow Test ===\n');

    try {
        // 1. Health check
        console.log('[1/4] Checking server health...');
        const health = await axios.get(`${BASE_URL}/`);
        console.log('      Result:', health.data);

        // 2. Register a new test company
        const testEmail = `test-${Date.now()}@example.com`;
        console.log(`\n[2/4] Registering new company with email: ${testEmail}...`);
        const regRes = await axios.post(`${BASE_URL}/api/auth/register-company`, {
            companyName: 'Integration Test Company',
            fullName: 'John Doe',
            email: testEmail,
            phone: '9876543210',
            password: 'password123'
        });
        console.log('      Result:', regRes.data.message || 'Success');

        // 3. Login
        console.log('\n[3/4] Logging in with new credentials...');
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: testEmail,
            password: 'password123'
        });

        const token = loginRes.data.token;
        const companyId = loginRes.data.user.memberships?.[0]?.companyId;

        if (!token || !companyId) {
            throw new Error("Login failed to provide token or companyId.");
        }
        console.log('      Result: Success! Obtained token and companyId:', companyId);

        // 4. Fetch details to test middleware & companyController
        console.log('\n[4/4] Fetching company details using token & middleware...');
        const detailsRes = await axios.get(`${BASE_URL}/api/company/details`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-company-id': companyId
            }
        });
        console.log('      Result: Fetched company name ->', detailsRes.data.name);

        console.log('\n=== All Tests Passed Successfully! ===');

    } catch (error: any) {
        console.error('\n=== Test Failed ===');
        if (error.response) {
            console.error('API Error Response:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
        process.exit(1);
    }
}

runTest();
