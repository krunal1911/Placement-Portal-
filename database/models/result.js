const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    score: Number,

    totalQuestions: Number,

    percentage: Number,

    testType: {
        type: String,
        default: "Aptitude"
    },

    companyName: {
        type: String,
        default: "General"
    }

}, {

    timestamps: true

});

module.exports = mongoose.model("Result", resultSchema);