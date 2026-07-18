const mongoose = require("mongoose");

const technicalQuestionSchema = new mongoose.Schema({

    subject: String,

    question: String,

    options: [String],

    answer: String,

    marks: {
        type: Number,
        default: 1
    }

});

module.exports = mongoose.model("TechnicalQuestion", technicalQuestionSchema);