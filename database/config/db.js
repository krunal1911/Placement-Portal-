const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Auto-seed questions if count is low
        const { seedIfEmpty } = require('../../seedQuestions');
        await seedIfEmpty();
    } catch (error) {
        console.log("Database Connection Error:", error);
        process.exit(1);
    }
};

module.exports = connectDB;