const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState >= 1) {
        return;
    }

    try {
        const mongoUri = process.env.MONGODB_URI;
        if (mongoUri) {
            await mongoose.connect(mongoUri);
            isConnected = true;
            console.log('MongoDB Connected (Remote Atlas)');
        } else {
            if (!process.env.VERCEL) {
                await mongoose.connect('mongodb://127.0.0.1:27017/placementPortal');
                isConnected = true;
                console.log('MongoDB Connected (Local Fallback)');
            } else {
                console.error("⚠️ MONGODB_URI is not defined in Vercel Environment Variables!");
                return;
            }
        }

        // Auto-seed questions if count is low
        const { seedIfEmpty } = require('../../seedQuestions');
        await seedIfEmpty();
    } catch (error) {
        console.error("Database Connection Error:", error);
    }
};

module.exports = connectDB;