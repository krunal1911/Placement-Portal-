const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({

    question: {
        type: String,
        required: true
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

// Uniqueness should be scoped PER COMPANY, not global — otherwise two different
// companies could never share a common question phrase (e.g. "What is 15 + 25?"),
// and imports/adds would fail with duplicate-key errors across unrelated companies.
questionSchema.index({ companyName: 1, question: 1 }, { unique: true });

module.exports = mongoose.model('Question', questionSchema);