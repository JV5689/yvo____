import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkPass() {
    const email = 'vrundaseeds@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        console.log('User found:', user.email);
        console.log('Hashed pass:', user.passwordHash);

        // Let's check if it's the default 'password123' or 'secret'
        const isSecret = await bcrypt.compare('secret', user.passwordHash);
        const isPass123 = await bcrypt.compare('password123', user.passwordHash);
        const is1111 = await bcrypt.compare('1111', user.passwordHash);

        if (isSecret) console.log('Pass is: secret');
        else if (isPass123) console.log('Pass is: password123');
        else if (is1111) console.log('Pass is: 1111');
        else console.log('Pass is not one of the common defaults. I should reset it.');

    } else {
        console.log('User not found.');
    }
}

checkPass();
