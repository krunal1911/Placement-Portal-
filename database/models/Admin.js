const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["superadmin", "admin"],
        default: "admin"
    }

});

module.exports = mongoose.model('Admin', adminSchema);