const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },

    status: {
        type: String,
        enum: [
            "Applied",
            "Shortlisted",
            "Interview Scheduled",
            "Selected",
            "Rejected"
        ],
        default: "Applied"
    },

    appliedAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model('Application', applicationSchema);