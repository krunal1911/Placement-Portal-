const mongoose = require('mongoose');
const TechnicalQuestion = require('./models/TechnicalQuestion');

mongoose.connect('mongodb://127.0.0.1:27017/placementPortal');

async function addQuestions() {

    await TechnicalQuestion.deleteMany();

    await TechnicalQuestion.insertMany([

        {
            subject: "C",
            question: "Which symbol is used to end a statement in C?",
            options: [";", ":", ".", ","],
            answer: ";"
        },

        {
            subject: "C++",
            question: "Which concept allows one class to inherit another?",
            options: ["Polymorphism", "Inheritance", "Abstraction", "Encapsulation"],
            answer: "Inheritance"
        },

        {
            subject: "Java",
            question: "Which keyword is used to inherit a class in Java?",
            options: ["extends", "implements", "inherit", "super"],
            answer: "extends"
        },

        {
            subject: "DBMS",
            question: "Which language is used to query a database?",
            options: ["HTML", "CSS", "SQL", "Python"],
            answer: "SQL"
        },

        {
            subject: "Operating System",
            question: "Which scheduling algorithm gives minimum average waiting time?",
            options: ["FCFS", "Round Robin", "SJF", "Priority"],
            answer: "SJF"
        }

    ]);

    console.log("Technical Questions Added Successfully");

    mongoose.connection.close();

}

addQuestions();