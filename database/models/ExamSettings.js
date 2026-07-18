const mongoose = require('mongoose');

const examSettingsSchema = new mongoose.Schema({
    examType: {
        type: String,
        enum: ["aptitude", "technical"],
        required: true,
        unique: true
    },
    examName: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true,
        default: 20 // in minutes
    }
});

module.exports = mongoose.model('ExamSettings', examSettingsSchema);
