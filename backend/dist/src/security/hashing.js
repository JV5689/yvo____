import * as argon2 from 'argon2';
export const hashPassword = async (password) => {
    return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16, // 64 MB
        timeCost: 3,
        parallelism: 1,
    });
};
export const verifyPassword = async (password, hash) => {
    try {
        return await argon2.verify(hash, password);
    }
    catch (error) {
        return false;
    }
};
