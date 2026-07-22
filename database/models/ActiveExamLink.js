const mongoose = require("mongoose");

const activeExamLinkSchema = new mongoose.Schema({
    examType: {
        type: String,
        enum: ["aptitude", "technical", "combined"],
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdById: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    }
}, { timestamps: true });

module.exports = mongoose.model("ActiveExamLink", activeExamLinkSchema);
