import * as argon2 from 'argon2';
import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
    return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16, // 64 MB
        timeCost: 3,
        parallelism: 1,
    });
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    try {
        if (hash.startsWith('$2b$') || hash.startsWith('$2a$')) {
            return await bcrypt.compare(password, hash);
        }
        return await argon2.verify(hash, password);
    } catch (error) {
        console.error("Verification error:", error);
        return false;
    }
};
