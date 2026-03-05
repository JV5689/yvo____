import mongoose from 'mongoose';
import { AuditLog } from './models/Global/AuditLog.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkLogs() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/yvo');
        console.log("Fetching audit logs...");
        const logs = await AuditLog.find({ action: /BACKUP/ }).sort({ timestamp: -1 }).limit(10);
        if (logs.length === 0) {
            console.log("No backup-related audit logs found.");
        } else {
            console.log(JSON.stringify(logs, null, 2));
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error("Debug script error:", err.message);
        process.exit(1);
    }
}

checkLogs();
