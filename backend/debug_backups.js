import mongoose from 'mongoose';
import { BackupJob } from './models/Global/BackupJob.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkJobs() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/yvo');

        console.log("Fetching jobs...");
        const jobs = await BackupJob.find().sort({ createdAt: -1 }).limit(5);
        if (jobs.length === 0) {
            console.log("No backup jobs found.");
        } else {
            console.log(JSON.stringify(jobs, null, 2));
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error("Debug script error:", err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

checkJobs();
