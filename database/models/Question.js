const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({

    question: {
        type: String,
        required: true,
        unique: true
    },

    options: {
        type: [String],
        required: true
    },

    answer: {
        type: String,
        required: true
    },

    explanation: {
        type: String,
        default: ""
    },

    topic: {
        type: String,
        default: "General"
    },

    difficulty: {
        type: String,
        default: "Easy"
    },

    marks: {
        type: Number,
        default: 1
    },

    companyName: {
        type: String,
        default: "General"
    }

});

module.exports = mongoose.model('Question', questionSchema);