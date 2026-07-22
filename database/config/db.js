const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('MongoDB Connected (Remote Atlas)');
        } catch (remoteErr) {
            console.warn('Remote MongoDB Connection Failed, attempting local MongoDB connection...', remoteErr.message);
            await mongoose.connect('mongodb://127.0.0.1:27017/placementPortal');
            console.log('MongoDB Connected (Local Fallback)');
        }

        // Auto-seed questions if count is low
        const { seedIfEmpty } = require('../../seedQuestions');
        await seedIfEmpty();
    } catch (error) {
        console.error("Database Connection Error:", error);
    }
};

module.exports = connectDB;