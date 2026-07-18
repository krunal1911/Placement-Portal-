const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    score: Number,

    totalQuestions: Number,

    percentage: Number

}, {

    timestamps: true

});

module.exports = mongoose.model("Result", resultSchema);