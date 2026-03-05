import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''; // Must be 32 bytes
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
if (ENCRYPTION_KEY.length !== 64) {
    // Assuming hex string of 32 bytes
    console.error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
}
export function encrypt(text) {
    if (!text)
        return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}
export function decrypt(encryptedText) {
    if (!encryptedText || !encryptedText.includes(':'))
        return encryptedText;
    try {
        const [ivHex, authTagHex, encryptedDataHex] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const key = Buffer.from(ENCRYPTION_KEY, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        console.error('Decryption failed:', error);
        return encryptedText; // Fallback or throw error? Usually throw in production security
    }
}
