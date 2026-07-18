require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./database/config/db');
const Question = require('./database/models/Question');

connectDB();

const questions = [

{
    question: "If the cost of 5 pens is ₹100, what is the cost of 1 pen?",
    options: ["₹10", "₹15", "₹20", "₹25"],
    answer: "₹20"
},

{
    question: "What is 15 + 25?",
    options: ["30", "35", "40", "45"],
    answer: "40"
},

{
    question: "Which number comes next? 2, 4, 8, 16, ?",
    options: ["18", "24", "30", "32"],
    answer: "32"
},

{
    question: "What is the square root of 81?",
    options: ["7", "8", "9", "10"],
    answer: "9"
},

{
    question: "Which is the largest planet?",
    options: ["Earth", "Mars", "Jupiter", "Venus"],
    answer: "Jupiter"
}

];

async function insertQuestions() {

    try {

        await Question.deleteMany();

        await Question.insertMany(questions);

        console.log("Questions inserted successfully.");

        process.exit();

    } catch (error) {

        console.log(error);

        process.exit();

    }

}

insertQuestions();