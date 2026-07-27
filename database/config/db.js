const mongoose = require('mongoose');

let connectionPromise = null;
let secondaryConnection = null;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (connectionPromise) {
        await connectionPromise;
        return;
    }

    const cloudUri = process.env.MONGODB_URI || 'mongodb+srv://desaikrunal2005_db_user:XIdzUVr0oiicYkYl@cluster0.jketbal.mongodb.net/placementPortal';
    const localUri = 'mongodb://127.0.0.1:27017/placementPortal';

    connectionPromise = (async () => {
        let connectedPrimary = false;

        // 1. Try Primary Cloud Connection
        try {
            console.log('Attempting Primary Cloud MongoDB connection (Atlas)...');
            await mongoose.connect(cloudUri, {
                serverSelectionTimeoutMS: 3000,
                connectTimeoutMS: 3000
            });
            console.log('✅ Primary Cloud MongoDB Connected successfully!');
            connectedPrimary = true;
        } catch (err) {
            console.warn(`Primary Cloud Connection Warning: ${err.message}`);
        }

        // 2. If Cloud failed, connect to Local MongoDB as Primary
        if (!connectedPrimary) {
            try {
                console.log('Connecting to Local MongoDB (127.0.0.1:27017) as Primary...');
                await mongoose.connect(localUri, {
                    serverSelectionTimeoutMS: 3000
                });
                console.log('✅ Primary Local MongoDB Connected successfully!');
                connectedPrimary = true;
            } catch (lErr) {
                console.error('❌ Failed to connect to Primary Local MongoDB:', lErr.message);
            }
        }

        // 3. Connect Secondary Connection (Local DB) if Primary is Cloud
        if (connectedPrimary && mongoose.connection.host !== '127.0.0.1') {
            try {
                console.log('Connecting Secondary Local Connection (127.0.0.1:27017) for Dual-DB Sync...');
                secondaryConnection = mongoose.createConnection(localUri, {
                    serverSelectionTimeoutMS: 2000
                });
                secondaryConnection.on('connected', () => {
                    console.log('✅ Secondary Local MongoDB Connected! All data will sync simultaneously.');
                });
                secondaryConnection.on('error', (e) => {
                    console.warn('Secondary Local Connection disabled (Local DB unreachable).');
                });
            } catch (sErr) {
                console.warn('Secondary connection error:', sErr.message);
            }
        }

        // Seed questions if empty
        try {
            const { seedIfEmpty } = require('../../seedQuestions');
            await seedIfEmpty();
        } catch (sErr) {}
    })();

    await connectionPromise;
};

// Global Dual Sync Helper: Dual writes to secondary local connection
const dualSyncDoc = async (modelName, doc) => {
    try {
        if (secondaryConnection && secondaryConnection.readyState === 1) {
            const Model = secondaryConnection.models[modelName] || secondaryConnection.model(modelName, mongoose.model(modelName).schema);
            if (doc && doc._id) {
                await Model.updateOne({ _id: doc._id }, doc.toObject ? doc.toObject() : doc, { upsert: true });
            }
        }
    } catch (e) {
        // Non-blocking catch
    }
};

module.exports = connectDB;
module.exports.dualSyncDoc = dualSyncDoc;
module.exports.getSecondaryConnection = () => secondaryConnection;