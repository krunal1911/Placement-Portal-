const mongoose = require('mongoose');

let connectionPromise = null;

// Single source of truth: connect only to the configured MongoDB URI (the shared
// cloud database). We intentionally do NOT fall back to a local MongoDB instance —
// a silent fallback previously caused writes (new questions, applications, etc.)
// to land in a throwaway local database whenever the cloud connection was briefly
// slow, making data look "mixed" or missing depending on which machine/DB you
// checked afterwards.
const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return;
    }

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
                console.log(`Connecting to MongoDB (${uri.includes('srv') ? 'Atlas Cloud' : 'Local'})...`);
                await mongoose.connect(uri, {
                    serverSelectionTimeoutMS: 5000,
                    connectTimeoutMS: 5000
                });
                console.log('✅ MongoDB Connected successfully!');

                try {
                    const { seedIfEmpty } = require('../../seedQuestions');
                    await seedIfEmpty();
                } catch (sErr) {}

                return;
            } catch (err) {
                console.warn(`Connection failed to ${uri.includes('srv') ? 'Atlas Cloud' : 'Local'}: ${err.message}`);
            }
        }
        connectionPromise = null;
        console.error('❌ All MongoDB connection attempts failed.');
    })();

    await connectionPromise;
};

module.exports = connectDB;