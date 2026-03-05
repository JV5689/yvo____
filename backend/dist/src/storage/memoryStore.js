import { randomUUID } from 'crypto';
const users = [];
const otps = [];
const now = () => new Date();
const isExpired = (otp) => otp.expiresAt && otp.expiresAt <= now();
export const findUserByEmail = async (email) => users.find((user) => user.email === email) || null;
export const findUserByPhone = async (phone) => users.find((user) => user.phone === phone) || null;
export const findUserByGoogleId = async (googleId) => users.find((user) => user.googleId === googleId) || null;
export const createUser = async ({ email, phone, name, passwordHash, googleId, businessType }) => {
    const user = {
        id: randomUUID(),
        email,
        phone,
        name,
        passwordHash,
        googleId,
        businessType,
        createdAt: now(),
    };
    users.push(user);
    return user;
};
export const updateUser = async (user, updates) => {
    Object.assign(user, updates);
    return user;
};
export const deleteOtpsByIdentifier = async ({ identifier, channel }) => {
    for (let index = otps.length - 1; index >= 0; index -= 1) {
        if (otps[index].identifier === identifier && otps[index].channel === channel) {
            otps.splice(index, 1);
        }
    }
};
export const createOtp = async ({ identifier, channel, otpHash, expiresAt }) => {
    const otp = {
        id: randomUUID(),
        identifier,
        channel,
        otpHash,
        attempts: 0,
        expiresAt,
        createdAt: now(),
    };
    otps.push(otp);
    return otp;
};
export const findOtp = async ({ identifier, channel }) => {
    const otp = otps.find((entry) => entry.identifier === identifier && entry.channel === channel);
    if (!otp) {
        return null;
    }
    if (isExpired(otp)) {
        await deleteOtpById(otp.id);
        return null;
    }
    return otp;
};
export const updateOtp = async (otp, updates) => {
    Object.assign(otp, updates);
    return otp;
};
export const deleteOtpById = async (id) => {
    const index = otps.findIndex((otp) => otp.id === id);
    if (index >= 0) {
        otps.splice(index, 1);
    }
};
