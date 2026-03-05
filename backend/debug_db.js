import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function debug() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/yvo');
        console.log('Connected to DB');

        const db = mongoose.connection.db;

        console.log('--- modulepayments sample ---');
        const oldPayments = await db.collection('modulepayments').find({}).toArray();
        console.log(JSON.stringify(oldPayments, null, 2));

        console.log('--- payments count ---');
        const countNew = await db.collection('payments').countDocuments();
        console.log('Count:', countNew);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
