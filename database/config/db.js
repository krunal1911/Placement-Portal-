const mongoose = require('mongoose');

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

    const urisToTry = [];
    if (process.env.MONGODB_URI) {
        urisToTry.push(process.env.MONGODB_URI);
    }
    urisToTry.push('mongodb+srv://desaikrunal2005_db_user:XIdzUVr0oiicYkYl@cluster0.jketbal.mongodb.net/placementPortal');
    urisToTry.push('mongodb://127.0.0.1:27017/placementPortal');

    connectionPromise = (async () => {
        for (const uri of urisToTry) {
            try {
                console.log(`Attempting MongoDB connection (${uri.includes('srv') ? 'Atlas Cloud' : 'Local'})...`);
                await mongoose.connect(uri, {
                    serverSelectionTimeoutMS: 3000,
                    connectTimeoutMS: 3000
                });
                console.log('✅ MongoDB Connected successfully!');

                // Seed questions if empty
                try {
                    const { seedIfEmpty } = require('../../seedQuestions');
                    await seedIfEmpty();
                } catch (sErr) {}

                return;
            } catch (err) {
                console.warn(`Failed connection to ${uri.includes('srv') ? 'Atlas Cloud' : 'Local'}: ${err.message}`);
            }
        }
        connectionPromise = null;
        console.error('❌ All MongoDB connection attempts failed.');
    })();

    await connectionPromise;
};

module.exports = connectDB;