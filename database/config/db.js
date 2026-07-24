const mongoose = require('mongoose');

const DEFAULT_ATLAS_URI = 'mongodb+srv://desaikrunal2005_db_user:XIdzUVr0oiicYkYl@cluster0.jketbal.mongodb.net/placementPortal';

let connectionPromise = null;

const connectDB = async () => {
    // If already connected (readyState === 1)
    if (mongoose.connection.readyState === 1) {
        return;
    }

    // If currently connecting, await existing promise
    if (connectionPromise) {
        await connectionPromise;
        return;
    }

    const mongoUri = process.env.MONGODB_URI || DEFAULT_ATLAS_URI;

    try {
        connectionPromise = mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
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
        throw error;
    }
};

module.exports = connectDB;