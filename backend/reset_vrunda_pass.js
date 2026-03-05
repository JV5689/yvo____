import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetVrundaPass() {
    const email = 'vrundaseeds@gmail.com';
    const newPass = '1111'; // Using 1111 per the user's usual password pattern in this project
    const hashed = await bcrypt.hash(newPass, 10);

    await prisma.user.update({
        where: { email },
        data: { passwordHash: hashed }
    });

    console.log(`Password for ${email} reset to: ${newPass}`);
}

resetVrundaPass();
