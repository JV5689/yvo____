import { randomUUID } from 'crypto';

const users: any[] = [];
const otps: any[] = [];

const now = () => new Date();

const isExpired = (otp: any) => otp.expiresAt && otp.expiresAt <= now();

export const findUserByEmail = async (email: string) =>
  users.find((user) => user.email === email) || null;

export const findUserByPhone = async (phone: string) =>
  users.find((user) => user.phone === phone) || null;

export const findUserByGoogleId = async (googleId: string) =>
  users.find((user) => user.googleId === googleId) || null;

export const createUser = async ({ email, phone, name, passwordHash, googleId, businessType }: any) => {
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

export const updateUser = async (user: any, updates: any) => {
  Object.assign(user, updates);
  return user;
};

export const deleteOtpsByIdentifier = async ({ identifier, channel }: any) => {
  for (let index = otps.length - 1; index >= 0; index -= 1) {
    if (otps[index].identifier === identifier && otps[index].channel === channel) {
      otps.splice(index, 1);
    }
  }
};

export const createOtp = async ({ identifier, channel, otpHash, expiresAt }: any) => {
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

export const findOtp = async ({ identifier, channel }: any) => {
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

export const updateOtp = async (otp: any, updates: any) => {
  Object.assign(otp, updates);
  return otp;
};

export const deleteOtpById = async (id: string) => {
  const index = otps.findIndex((otp) => otp.id === id);
  if (index >= 0) {
    otps.splice(index, 1);
  }
};
