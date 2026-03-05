import bcrypt from 'bcrypt';

const OTP_LENGTH = 6;
const SALT_ROUNDS = 10;

export const generateOtp = () => {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
};

export const hashOtp = async (otp: string) => bcrypt.hash(otp, SALT_ROUNDS);

export const verifyOtp = async (otp: string, hash: string) => bcrypt.compare(otp, hash);

export const getOtpExpiry = () => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);
  return expiresAt;
};
