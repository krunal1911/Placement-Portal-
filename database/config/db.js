const mongoose = require('mongoose');

let connectionPromise = null;

const connectDB = async () => {
    // If already fully connected (readyState === 1)
    if (mongoose.connection.readyState === 1) {
        return;
    }

    // If currently connecting, await the existing connection promise
    if (connectionPromise) {
        await connectionPromise;
        return;
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/placementPortal';

    if (process.env.VERCEL && !process.env.MONGODB_URI) {
        console.error("⚠️ MONGODB_URI is not defined in Vercel Environment Variables!");
        return;
    }

    try {
        connectionPromise = mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000
        });
        await connectionPromise;
        console.log('MongoDB Connected successfully ✅');

        // Auto-seed questions if count is low
        try {
            const { seedIfEmpty } = require('../../seedQuestions');
            await seedIfEmpty();
        } catch (seedErr) {
            console.error("Seeding questions error:", seedErr.message);
        }
    } catch (error) {
        connectionPromise = null;
        console.error("Database Connection Error:", error.message);
    }
};

module.exports = connectDB;