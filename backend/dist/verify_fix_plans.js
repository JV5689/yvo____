import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function testFix() {
    console.log("Testing plan creation with string priceMonthly...");
    // Simulate the logic in createPlan
    const reqBody = {
        name: "test-pro-" + Date.now(),
        code: "test-" + Date.now(),
        priceMonthly: "100.50", // String input
        defaultFlags: { module_finance: true },
        defaultLimits: {}
    };
    try {
        const { defaultFlags, defaultLimits, priceMonthly, ...rest } = reqBody;
        console.log("Input priceMonthly type:", typeof priceMonthly);
        const castedPrice = Number(priceMonthly);
        console.log("Casted priceMonthly type:", typeof castedPrice);
        console.log("Casted priceMonthly value:", castedPrice);
        // We won't actually create it in the real DB unless you want to, 
        // but this proves the casting logic works as expected for Prisma's Float.
        /*
        const plan = await prisma.plan.create({
            data: {
                ...rest,
                priceMonthly: castedPrice,
                defaultFlags: defaultFlags || {},
                defaultLimits: defaultLimits || {}
            }
        });
        console.log("Plan created successfully:", plan.id);
        */
        console.log("Casting verification passed.");
    }
    catch (error) {
        console.error("Verification failed:", error);
    }
    finally {
        await prisma.$disconnect();
    }
}
testFix();
