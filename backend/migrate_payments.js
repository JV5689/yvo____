import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/yvo');
        console.log('Connected to DB');

        const db = mongoose.connection.db;

        const oldPayments = await db.collection('modulepayments').find({}).toArray();
        if (oldPayments.length > 0) {
            console.log(`Found ${oldPayments.length} records in modulepayments. Migrating...`);
            await db.collection('payments').insertMany(oldPayments);
            console.log('Migration to "payments" successful.');
            // Optional: await db.collection('modulepayments').drop();
        } else {
            console.log('No records found in modulepayments.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
