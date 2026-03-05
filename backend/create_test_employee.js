import { prisma } from './src/config/db.js';
import { hashPassword } from './src/security/hashing.js';

async function main() {
    try {
        // 1. Find a company
        const company = await prisma.company.findFirst();
        if (!company) {
            console.error("No company found in database. Please register a company first.");
            return;
        }

        console.log(`Using Company: ${company.name} (${company.id})`);

        // 2. Ensure feature flags allow employee login
        let flags = company.featureFlags || {};
        if (typeof flags === 'string') flags = JSON.parse(flags);

        flags['module_employees'] = true;

        await prisma.company.update({
            where: { id: company.id },
            data: { featureFlags: flags }
        });
        console.log("Updated company feature flags to allow employee access.");

        // 3. Create/Update Test Employee
        const phone = "9999999999";
        const password = "password123";
        const hashedPassword = await hashPassword(password);

        // Delete any existing employee with this phone to avoid collision (including mangled ones)
        await prisma.employee.deleteMany({
            where: {
                OR: [
                    { phone: phone },
                    { phone: { startsWith: `${phone}-deleted-` } }
                ]
            }
        });

        const employee = await prisma.employee.create({
            data: {
                companyId: company.id,
                firstName: "Test",
                lastName: "Employee",
                email: "test_emp@yvo.com",
                phone: phone,
                password: hashedPassword,
                salary: 50000,
                status: "Active",
                dateHired: new Date(),
                category: "General"
            }
        });

        console.log("\nSUCCESS! Test Employee Created:");
        console.log("------------------------------");
        console.log(`Phone: ${phone}`);
        console.log(`Password: ${password}`);
        console.log(`Company: ${company.name}`);
        console.log("------------------------------");
        console.log("You can now use these credentials to log in at http://localhost:5174/login");

    } catch (err) {
        console.error("Error creating test employee:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
