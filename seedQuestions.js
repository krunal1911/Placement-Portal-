require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('./database/models/Question');
const TechnicalQuestion = require('./database/models/TechnicalQuestion');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/placementPortal';

const aptitudeQuestions = [
    {
        question: "If the cost of 5 pens is ₹100, what is the cost of 1 pen?",
        options: ["₹10", "₹15", "₹20", "₹25"],
        answer: "₹20",
        topic: "Arithmetic",
        difficulty: "Easy"
    },
    {
        question: "What is 15 + 25?",
        options: ["30", "35", "40", "45"],
        answer: "40",
        topic: "Basic Math",
        difficulty: "Easy"
    },
    {
        question: "Which number comes next? 2, 4, 8, 16, ?",
        options: ["18", "24", "30", "32"],
        answer: "32",
        topic: "Logical Reasoning",
        difficulty: "Easy"
    },
    {
        question: "What is the square root of 81?",
        options: ["7", "8", "9", "10"],
        answer: "9",
        topic: "Basic Math",
        difficulty: "Easy"
    },
    {
        question: "Which is the largest planet in our solar system?",
        options: ["Earth", "Mars", "Jupiter", "Venus"],
        answer: "Jupiter",
        topic: "General Knowledge",
        difficulty: "Easy"
    },
    {
        question: "A train 120m long passes a telegraph post in 6 seconds. What is the speed of the train in km/h?",
        options: ["72 km/h", "60 km/h", "54 km/h", "80 km/h"],
        answer: "72 km/h",
        topic: "Speed and Distance",
        difficulty: "Medium"
    },
    {
        question: "Find the average of the first 40 natural numbers.",
        options: ["20", "20.5", "21", "21.5"],
        answer: "20.5",
        topic: "Averages",
        difficulty: "Easy"
    },
    {
        question: "A person crosses a 600m long street in 5 minutes. What is his speed in km/h?",
        options: ["3.6", "7.2", "8.4", "10"],
        answer: "7.2",
        topic: "Speed and Distance",
        difficulty: "Medium"
    },
    {
        question: "The ratio of two numbers is 3:4 and their HCF is 4. What is their LCM?",
        options: ["12", "16", "24", "48"],
        answer: "48",
        topic: "Numbers",
        difficulty: "Medium"
    },
    {
        question: "If 15% of x is the same as 20% of y, then x:y is:",
        options: ["3:4", "4:3", "17:16", "16:17"],
        answer: "4:3",
        topic: "Ratio and Proportion",
        difficulty: "Easy"
    },
    {
        question: "If a book is sold at ₹300 with a 20% profit, what is its cost price?",
        options: ["₹240", "₹250", "₹260", "₹270"],
        answer: "₹250",
        topic: "Profit and Loss",
        difficulty: "Medium"
    },
    {
        question: "A sum of money at simple interest amounts to ₹815 in 3 years and to ₹854 in 4 years. What is the sum?",
        options: ["₹650", "₹690", "₹698", "₹700"],
        answer: "₹698",
        topic: "Simple Interest",
        difficulty: "Medium"
    },
    {
        question: "Three unbiased coins are tossed. What is the probability of getting at most two heads?",
        options: ["3/4", "7/8", "1/2", "3/8"],
        answer: "7/8",
        topic: "Probability",
        difficulty: "Medium"
    },
    {
        question: "If the day before yesterday was Thursday, what day will be the day after tomorrow?",
        options: ["Monday", "Tuesday", "Wednesday", "Sunday"],
        answer: "Monday",
        topic: "Logical Reasoning",
        difficulty: "Easy"
    },
    {
        question: "Complete the series: 3, 5, 9, 17, 33, ...",
        options: ["45", "55", "65", "99"],
        answer: "65",
        topic: "Logical Reasoning",
        difficulty: "Easy"
    },
    {
        question: "If a side of a square is increased by 20%, what is the percentage increase in its area?",
        options: ["20%", "40%", "44%", "50%"],
        answer: "44%",
        topic: "Geometry",
        difficulty: "Medium"
    },
    {
        question: "A and B can do a work in 12 days, B and C in 15 days, C and A in 20 days. In how many days can A do it alone?",
        options: ["30", "40", "50", "60"],
        answer: "30",
        topic: "Time and Work",
        difficulty: "Hard"
    },
    {
        question: "A pipe can fill a tank in 6 hours and another pipe can empty it in 12 hours. If both are opened, how long to fill?",
        options: ["6 hours", "8 hours", "10 hours", "12 hours"],
        answer: "12 hours",
        topic: "Pipes and Cisterns",
        difficulty: "Medium"
    },
    {
        question: "Find the odd one out: 27, 64, 125, 144, 216.",
        options: ["27", "64", "144", "216"],
        answer: "144",
        topic: "Logical Reasoning",
        difficulty: "Easy"
    },
    {
        question: "In how many different ways can the letters of the word 'LEADING' be arranged so that vowels always come together?",
        options: ["360", "720", "120", "5040"],
        answer: "720",
        topic: "Permutations",
        difficulty: "Hard"
    },
    {
        question: "A father is twice as old as his son. 20 years ago, the father was 12 times as old as the son. What is the father's current age?",
        options: ["40", "44", "22", "50"],
        answer: "44",
        topic: "Ages",
        difficulty: "Medium"
    },
    {
        question: "What is the value of (256)^0.16 * (256)^0.09?",
        options: ["4", "16", "64", "256"],
        answer: "4",
        topic: "Exponents",
        difficulty: "Medium"
    },
    {
        question: "A shopkeeper sells an item for ₹960 at a loss of 4%. At what price should he sell it to gain 10%?",
        options: ["₹1000", "₹1050", "₹1100", "₹1200"],
        answer: "₹1100",
        topic: "Profit and Loss",
        difficulty: "Medium"
    },
    {
        question: "The average weight of 8 persons increases by 2.5 kg when a new person comes in place of one of them weighing 65 kg. What is the weight of the new person?",
        options: ["70 kg", "75 kg", "80 kg", "85 kg"],
        answer: "85 kg",
        topic: "Averages",
        difficulty: "Medium"
    },
    {
        question: "Out of 7 consonants and 4 vowels, how many words of 3 consonants and 2 vowels can be formed?",
        options: ["210", "25200", "24400", "21300"],
        answer: "25200",
        topic: "Permutations",
        difficulty: "Hard"
    },
    {
        question: "A card is drawn from a pack of 52 cards. What is the probability of getting a spade or a king?",
        options: ["4/13", "17/52", "1/4", "9/13"],
        answer: "4/13",
        topic: "Probability",
        difficulty: "Medium"
    },
    {
        question: "What is the angle between the two hands of a clock when the time is 8:30?",
        options: ["75 degrees", "60 degrees", "85 degrees", "90 degrees"],
        answer: "75 degrees",
        topic: "Clocks",
        difficulty: "Medium"
    },
    {
        question: "How many times do the hands of a clock coincide in a day?",
        options: ["20", "21", "22", "24"],
        answer: "22",
        topic: "Clocks",
        difficulty: "Medium"
    },
    {
        question: "A sum of ₹12,500 amounts to ₹15,500 in 4 years at simple interest. What is the rate of interest?",
        options: ["3%", "4%", "5%", "6%"],
        answer: "6%",
        topic: "Simple Interest",
        difficulty: "Medium"
    },
    {
        question: "What is the compound interest on ₹10,000 for 2 years at 10% per annum compounded annually?",
        options: ["₹2000", "₹2100", "₹2200", "₹2300"],
        answer: "₹2100",
        topic: "Compound Interest",
        difficulty: "Medium"
    },
    {
        question: "A man buys a cycle for ₹1400 and sells it at a loss of 15%. What is the selling price?",
        options: ["₹1160", "₹1190", "₹1202", "₹1230"],
        answer: "₹1190",
        topic: "Profit and Loss",
        difficulty: "Easy"
    },
    {
        question: "Evaluate: 35% of 120 + 20% of 80.",
        options: ["52", "58", "62", "68"],
        answer: "58",
        topic: "Basic Math",
        difficulty: "Easy"
    },
    {
        question: "The HCF of two numbers is 11 and their LCM is 7700. If one of the numbers is 275, find the other.",
        options: ["279", "283", "308", "318"],
        answer: "308",
        topic: "Numbers",
        difficulty: "Hard"
    },
    {
        question: "If 3x + 7 = 22, what is the value of 5x - 3?",
        options: ["17", "22", "27", "32"],
        answer: "22",
        topic: "Algebra",
        difficulty: "Easy"
    },
    {
        question: "The product of two consecutive even numbers is 288. What is the sum of these two numbers?",
        options: ["30", "34", "38", "42"],
        answer: "34",
        topic: "Numbers",
        difficulty: "Medium"
    },
    {
        question: "A container contains 40 liters of milk. From this, 4 liters of milk was taken out and replaced by water. This process was repeated further two times. How much milk is now left?",
        options: ["29.16 liters", "30 liters", "31.25 liters", "32.4 liters"],
        answer: "29.16 liters",
        topic: "Alligations",
        difficulty: "Hard"
    },
    {
        question: "Two numbers are 20% and 50% more than a third number respectively. What is the ratio of the two numbers?",
        options: ["2:5", "3:5", "4:5", "5:4"],
        answer: "4:5",
        topic: "Ratio and Proportion",
        difficulty: "Easy"
    },
    {
        question: "A batsman scored 110 runs which included 3 boundaries and 8 sixes. What percent of his total score did he make by running between the wickets?",
        options: ["45%", "45 5/11%", "50%", "54 6/11%"],
        answer: "45 5/11%",
        topic: "Percentages",
        difficulty: "Medium"
    },
    {
        question: "If selling price is doubled, the profit triples. Find the profit percent.",
        options: ["50%", "100%", "150%", "200%"],
        answer: "100%",
        topic: "Profit and Loss",
        difficulty: "Hard"
    },
    {
        question: "In a group of 6 boys and 4 girls, four children are to be selected. In how many different ways can they be selected such that at least one boy should be there?",
        options: ["159", "194", "205", "209"],
        answer: "209",
        topic: "Combinations",
        difficulty: "Hard"
    },
    {
        question: "What is the probability of getting a sum 9 from two throws of a dice?",
        options: ["1/6", "1/8", "1/9", "1/12"],
        answer: "1/9",
        topic: "Probability",
        difficulty: "Medium"
    },
    {
        question: "Complete the series: 4, 9, 25, 49, 121, ...",
        options: ["144", "169", "196", "225"],
        answer: "169",
        topic: "Logical Reasoning",
        difficulty: "Medium"
    },
    {
        question: "If 5 men or 9 women can do a piece of work in 19 days, then in how many days will 3 men and 6 women do the same work?",
        options: ["10", "12", "15", "18"],
        answer: "15",
        topic: "Time and Work",
        difficulty: "Hard"
    },
    {
        question: "The speed of a boat in still water is 15 km/h and the rate of current is 3 km/h. Distance travelled downstream in 12 minutes is:",
        options: ["1.8 km", "2.4 km", "3.0 km", "3.6 km"],
        answer: "3.6 km",
        topic: "Boats and Streams",
        difficulty: "Medium"
    },
    {
        question: "The diagonal of a rectangle is √41 cm and its area is 20 sq cm. What is the perimeter of the rectangle?",
        options: ["9 cm", "18 cm", "20 cm", "40 cm"],
        answer: "18 cm",
        topic: "Geometry",
        difficulty: "Hard"
    },
    {
        question: "Find the single discount equivalent to a series discount of 20% and 10%.",
        options: ["28%", "30%", "15%", "32%"],
        answer: "28%",
        topic: "Profit and Loss",
        difficulty: "Easy"
    },
    {
        question: "A wheel makes 1000 revolutions to cover a distance of 88 km. Find the radius of the wheel.",
        options: ["7 m", "14 m", "21 m", "28 m"],
        answer: "14 m",
        topic: "Geometry",
        difficulty: "Hard"
    },
    {
        question: "If A lies between B and C, and the distance from B to C is 15 km, while A is twice as far from B as from C, what is the distance from A to C?",
        options: ["5 km", "10 km", "7.5 km", "6 km"],
        answer: "5 km",
        topic: "Logical Reasoning",
        difficulty: "Medium"
    },
    {
        question: "A shopkeeper cheats to the extent of 10% while buying as well as selling, by using false weights. His total gain percent is:",
        options: ["20%", "21%", "22%", "25%"],
        answer: "21%",
        topic: "Profit and Loss",
        difficulty: "Hard"
    },
    {
        question: "In an exam, 35% of candidates failed in English and 40% in Hindi. If 15% failed in both, find the percentage of candidates who passed in both.",
        options: ["40%", "45%", "50%", "60%"],
        answer: "40%",
        topic: "Percentages",
        difficulty: "Medium"
    }
];

const technicalQuestions = [
    {
        subject: "C",
        question: "Which symbol is used to end a statement in C?",
        options: [";", ":", ".", ","],
        answer: ";"
    },
    {
        subject: "C++",
        question: "Which concept allows one class to inherit another in OOP?",
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
        question: "Which language is used to query a relational database?",
        options: ["HTML", "CSS", "SQL", "Python"],
        answer: "SQL"
    },
    {
        subject: "Operating System",
        question: "Which scheduling algorithm gives minimum average waiting time?",
        options: ["FCFS", "Round Robin", "SJF", "Priority"],
        answer: "SJF"
    },
    {
        subject: "C",
        question: "What is the size of a char data type in C (standard)?",
        options: ["1 byte", "2 bytes", "4 bytes", "Depends on compiler"],
        answer: "1 byte"
    },
    {
        subject: "C",
        question: "Which function is used to read formatted input from standard input in C?",
        options: ["scanf()", "printf()", "gets()", "read()"],
        answer: "scanf()"
    },
    {
        subject: "C++",
        question: "Which of the following is used for standard input in C++?",
        options: ["cin", "cout", "scanf", "input"],
        answer: "cin"
    },
    {
        subject: "C++",
        question: "Who developed the C++ programming language?",
        options: ["Bjarne Stroustrup", "Dennis Ritchie", "James Gosling", "Guido van Rossum"],
        answer: "Bjarne Stroustrup"
    },
    {
        subject: "C++",
        question: "Which access specifier makes members accessible within the class and its derived classes?",
        options: ["private", "public", "protected", "friend"],
        answer: "protected"
    },
    {
        subject: "Java",
        question: "Which of these is NOT a feature of Java?",
        options: ["Platform independent", "Pointers", "Garbage collection", "Multithreaded"],
        answer: "Pointers"
    },
    {
        subject: "Java",
        question: "What is the root class of all classes in Java?",
        options: ["Object", "Class", "System", "String"],
        answer: "Object"
    },
    {
        subject: "Java",
        question: "Which variable modifier is used to define constants in Java?",
        options: ["final", "static", "const", "immutable"],
        answer: "final"
    },
    {
        subject: "Python",
        question: "Which keyword is used to define a function in Python?",
        options: ["def", "function", "fun", "define"],
        answer: "def"
    },
    {
        subject: "Python",
        question: "Which of the following data types in Python is mutable?",
        options: ["List", "Tuple", "String", "Integer"],
        answer: "List"
    },
    {
        subject: "Python",
        question: "What is the output of print(2 ** 3) in Python?",
        options: ["6", "8", "9", "5"],
        answer: "8"
    },
    {
        subject: "Python",
        question: "Which method is used to add an item to the end of a list in Python?",
        options: ["append()", "add()", "insert()", "push()"],
        answer: "append()"
    },
    {
        subject: "SQL",
        question: "Which clause is used to filter records in an SQL query?",
        options: ["WHERE", "GROUP BY", "ORDER BY", "HAVING"],
        answer: "WHERE"
    },
    {
        subject: "SQL",
        question: "Which SQL command is used to remove all records from a table without logging individual row deletions?",
        options: ["TRUNCATE", "DELETE", "DROP", "REMOVE"],
        answer: "TRUNCATE"
    },
    {
        subject: "SQL",
        question: "Which join returns all records when there is a match in either the left or right table?",
        options: ["FULL JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN"],
        answer: "FULL JOIN"
    },
    {
        subject: "DBMS",
        question: "What does ACID stand for in DBMS?",
        options: [
            "Atomicity Consistency Isolation Durability",
            "Atomicity Concurrency Isolation Dependability",
            "Accuracy Consistency Isolation Durability",
            "Atomicity Completeness Isolation Dependability"
        ],
        answer: "Atomicity Consistency Isolation Durability"
    },
    {
        subject: "DBMS",
        question: "A primary key in a relational database table must be:",
        options: ["Unique and Not Null", "Unique and Nullable", "Not Unique and Not Null", "Any key in the table"],
        answer: "Unique and Not Null"
    },
    {
        subject: "DBMS",
        question: "Which level of database abstraction describes how data is physically stored?",
        options: ["Physical Level", "Logical Level", "View Level", "External Level"],
        answer: "Physical Level"
    },
    {
        subject: "Operating System",
        question: "What is the state of a process when it is waiting for an I/O event to occur?",
        options: ["Blocked / Waiting", "Running", "Ready", "Terminated"],
        answer: "Blocked / Waiting"
    },
    {
        subject: "Operating System",
        question: "What is virtual memory?",
        options: [
            "An illusion of large main memory using disk space",
            "RAM memory expansion chips",
            "Cache memory",
            "Read Only Memory"
        ],
        answer: "An illusion of large main memory using disk space"
    },
    {
        subject: "Operating System",
        question: "What is a deadlock?",
        options: [
            "A situation where processes are blocked waiting for each other's resources",
            "A computer system crash",
            "Infinite loop in execution",
            "Memory leak in allocation"
        ],
        answer: "A situation where processes are blocked waiting for each other's resources"
    },
    {
        subject: "HTML",
        question: "Which HTML tag is used to create a hyperlink?",
        options: ["<a>", "<link>", "<href>", "<url>"],
        answer: "<a>"
    },
    {
        subject: "HTML",
        question: "What does HTML stand for?",
        options: [
            "Hyper Text Markup Language",
            "Home Tool Markup Language",
            "Hyperlinks and Text Markup Language",
            "Hyper Tool Markup Language"
        ],
        answer: "Hyper Text Markup Language"
    },
    {
        subject: "CSS",
        question: "Which property is used to change the background color in CSS?",
        options: ["background-color", "color", "bgcolor", "background"],
        answer: "background-color"
    },
    {
        subject: "CSS",
        question: "What does CSS stand for?",
        options: ["Cascading Style Sheets", "Creative Style Sheets", "Computer Style Sheets", "Colorful Style Sheets"],
        answer: "Cascading Style Sheets"
    },
    {
        subject: "JavaScript",
        question: "Which keyword is used to declare block-scoped variables in modern JavaScript?",
        options: ["let", "var", "const", "let and const"],
        answer: "let and const"
    },
    {
        subject: "JavaScript",
        question: "What is the value of typeof null in JavaScript?",
        options: ["object", "null", "undefined", "string"],
        answer: "object"
    },
    {
        subject: "JavaScript",
        question: "Which function converts a JSON string into a JavaScript object?",
        options: ["JSON.parse()", "JSON.stringify()", "JSON.object()", "JSON.toObject()"],
        answer: "JSON.parse()"
    },
    {
        subject: "Data Structures",
        question: "Which data structure follows the LIFO (Last In First Out) principle?",
        options: ["Stack", "Queue", "Linked List", "Tree"],
        answer: "Stack"
    },
    {
        subject: "Data Structures",
        question: "What is the average case time complexity of searching in a Hash Table?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        answer: "O(1)"
    },
    {
        subject: "Data Structures",
        question: "Which data structure is most suitable to implement Breadth First Search (BFS)?",
        options: ["Queue", "Stack", "Priority Queue", "Binary Tree"],
        answer: "Queue"
    },
    {
        subject: "Algorithms",
        question: "What is the average case time complexity of Quick Sort?",
        options: ["O(n log n)", "O(n^2)", "O(n)", "O(log n)"],
        answer: "O(n log n)"
    },
    {
        subject: "Algorithms",
        question: "Which search algorithm requires the array/list to be sorted first?",
        options: ["Binary Search", "Linear Search", "Depth First Search", "Breadth First Search"],
        answer: "Binary Search"
    },
    {
        subject: "C",
        question: "Which pointer holds the address of another pointer in C?",
        options: ["Double pointer", "Null pointer", "Void pointer", "Dangling pointer"],
        answer: "Double pointer"
    },
    {
        subject: "C++",
        question: "What is a virtual function in C++?",
        options: [
            "A function declared in base class and overridden by derived class",
            "A function with no body",
            "A helper function in a namespace",
            "A static member function"
        ],
        answer: "A function declared in base class and overridden by derived class"
    },
    {
        subject: "Java",
        question: "Which exception is thrown when an array is accessed with an invalid index in Java?",
        options: ["ArrayIndexOutOfBoundsException", "IndexOutOfBoundsException", "NullPointerException", "IllegalArgumentException"],
        answer: "ArrayIndexOutOfBoundsException"
    },
    {
        subject: "Python",
        question: "Which keyword is used to handle exceptions in Python?",
        options: ["except", "catch", "try", "throw"],
        answer: "except"
    },
    {
        subject: "SQL",
        question: "Which SQL command is used to add a new column to an existing table?",
        options: ["ALTER TABLE", "UPDATE TABLE", "ADD COLUMN", "INSERT COLUMN"],
        answer: "ALTER TABLE"
    },
    {
        subject: "DBMS",
        question: "Which normal form is concerned with eliminating transitive functional dependencies?",
        options: ["3NF", "1NF", "2NF", "BCNF"],
        answer: "3NF"
    },
    {
        subject: "Operating System",
        question: "What is a page fault?",
        options: [
            "A reference to a page not currently in physical memory (RAM)",
            "An error in physical memory hardware chips",
            "A program syntax crash",
            "Accessing memory beyond allocated limits"
        ],
        answer: "A reference to a page not currently in physical memory (RAM)"
    },
    {
        subject: "Data Structures",
        question: "A binary tree in which every node has either 0 or 2 children is called:",
        options: ["Full Binary Tree", "Complete Binary Tree", "Perfect Binary Tree", "Balanced Binary Tree"],
        answer: "Full Binary Tree"
    },
    {
        subject: "Algorithms",
        question: "Which algorithm design paradigm does Merge Sort use?",
        options: ["Divide and Conquer", "Greedy Method", "Dynamic Programming", "Backtracking"],
        answer: "Divide and Conquer"
    },
    {
        subject: "JavaScript",
        question: "What is the output of print('5' - 3) in JavaScript?",
        options: ["2", "53", "NaN", "TypeError"],
        answer: "2"
    },
    {
        subject: "CSS",
        question: "Which CSS property is used to align flex items along the cross axis?",
        options: ["justify-content", "align-content", "align-items", "text-align"],
        answer: "align-items"
    },
    {
        subject: "HTML",
        question: "Which attribute is used to provide a unique identifier for an HTML element?",
        options: ["id", "class", "name", "key"],
        answer: "id"
    }
];

async function seedIfEmpty() {
    try {
        const aptCount = await Question.countDocuments();
        const techCount = await TechnicalQuestion.countDocuments();
        if (aptCount < 40 || techCount < 40) {
            console.log("Database has few questions. Auto-seeding 100 questions...");
            await Question.deleteMany({});
            await TechnicalQuestion.deleteMany({});
            await Question.insertMany(aptitudeQuestions);
            await TechnicalQuestion.insertMany(technicalQuestions);
            console.log("Successfully auto-seeded 100 questions.");
        }
    } catch (err) {
        console.error("Auto-seeding failed:", err);
    }
}

async function seed() {
    try {
        console.log("Connecting to database at:", mongoUri);
        await mongoose.connect(mongoUri);
        console.log("Connected successfully. Deleting old questions...");

        await Question.deleteMany({});
        await TechnicalQuestion.deleteMany({});

        console.log("Seeding Aptitude Questions (50)...");
        await Question.insertMany(aptitudeQuestions);

        console.log("Seeding Technical Questions (50)...");
        await TechnicalQuestion.insertMany(technicalQuestions);

        console.log("Successfully seeded 100 questions (50 Aptitude, 50 Technical).");
        process.exit(0);
    } catch (e) {
        console.error("Error seeding questions:", e);
        process.exit(1);
    }
}

if (require.main === module) {
    seed();
}

module.exports = { seedIfEmpty, seed };
