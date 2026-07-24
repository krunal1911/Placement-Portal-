const mongoose = require('mongoose');

// Disable command buffering so disconnected queries fail fast instead of timing out serverless functions
mongoose.set('bufferCommands', false);

let isConnected = false;

const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState >= 1) {
        return;
    }

    try {
        const mongoUri = process.env.MONGODB_URI;
        if (mongoUri) {
            await mongoose.connect(mongoUri, {
                serverSelectionTimeoutMS: 5000
            });
            isConnected = true;
            console.log('MongoDB Connected (Remote Atlas)');
        } else {
            if (!process.env.VERCEL) {
                await mongoose.connect('mongodb://127.0.0.1:27017/placementPortal', {
                    serverSelectionTimeoutMS: 5000
                });
                isConnected = true;
                console.log('MongoDB Connected (Local Fallback)');
            } else {
                console.error("⚠️ MONGODB_URI is not defined in Vercel Environment Variables!");
                return;
            }
        }

        // Auto-seed questions if count is low
        try {
            const { seedIfEmpty } = require('../../seedQuestions');
            await seedIfEmpty();
        } catch (seedErr) {
            console.error("Seeding questions error:", seedErr.message);
        }
    } catch (error) {
        console.error("Database Connection Error:", error.message);
    }
};

module.exports = connectDB;