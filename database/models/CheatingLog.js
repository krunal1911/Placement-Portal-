const mongoose = require("mongoose");

const cheatingLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    testType: {
        type: String,
        required: true
    },
    incidentType: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    aiAnalysis: {
        type: String,
        default: ""
    },
    companyName: {
        type: String,
        default: "General"
    },
    snapshotImage: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("CheatingLog", cheatingLogSchema);
