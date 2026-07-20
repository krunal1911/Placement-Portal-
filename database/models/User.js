const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    name: String,

    email: {
        type: String,
        unique: true
    },

    password: String,

    branch: String,

    semester: String,

    testsTaken: {
        type: Number,
        default: 0
    },

    averageScore: {
        type: Number,
        default: 0
    },

   resume: {
    type: String,
    default: ""
},

profileImage: {
    type: String,
    default: "default.png"
},

phone: {
    type: String,
    default: ""
},

cgpa: {
    type: Number,
    default: 0
},

skills: {
    type: String,
    default: ""
},

linkedin: {
    type: String,
    default: ""
},

github: {
    type: String,
    default: ""
},

    projects: [{
        title: String,
        tech: String,
        desc: String
    }],

    resumeBuffer: Buffer

});

module.exports = mongoose.model('User', userSchema);