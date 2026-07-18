const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");

const User = require("../models/User");
const Result = require("../models/result");
const Company = require("../models/Company");
const Application = require("../models/Application");
const Notification = require("../models/Notification");
const ExamSettings = require("../models/ExamSettings");
const Question = require("../models/Question");
const TechnicalQuestion = require("../models/TechnicalQuestion");

// ==========================================
// VIEW PAGES
// ==========================================
exports.showDashboard = (req, res) => {
    res.sendFile(path.join(__dirname, "../views", "dashboard.html"));
};

exports.showProfile = (req, res) => {
    res.sendFile(path.join(__dirname, "../views", "profile.html"));
};

exports.showResume = (req, res) => {
    res.sendFile(path.join(__dirname, "../views", "resume.html"));
};

exports.showAptitude = (req, res) => {
    res.sendFile(path.join(__dirname, "../views", "aptitude.html"));
};

exports.showTechnical = (req, res) => {
    res.sendFile(path.join(__dirname, "../views", "technical.html"));
};

exports.showCareerGuide = (req, res) => {
    res.sendFile(path.join(__dirname, "../views", "career-guide.html"));
};

exports.showLeaderboard = (req, res) => {
    res.sendFile(path.join(__dirname, "../views", "leaderboard.html"));
};

exports.showPlacementDrives = (req, res) => {
    res.sendFile(path.join(__dirname, "../views", "placement-drives.html"));
};

exports.showHistory = (req, res) => {
    res.sendFile(path.join(__dirname, "../views", "history.html"));
};

exports.showMyApplications = (req, res) => {
    res.sendFile(path.join(__dirname, "../views", "my-applications.html"));
};

// ==========================================
// API / DATA ENDPOINTS
// ==========================================

// Get Current User Profile details (with profileImage & resume fields)
exports.getCurrentUser = (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not Logged In");
    }
    res.json({
        _id: req.session.user._id,
        name: req.session.user.name,
        email: req.session.user.email,
        branch: req.session.user.branch,
        semester: req.session.user.semester,
        resume: req.session.user.resume,
        profileImage: req.session.user.profileImage
    });
};

// Get student performance analytics metrics
exports.getDashboardData = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).send("Login First");
        }
        const user = await User.findById(req.session.user._id);
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.json({
            name: user.name,
            testsTaken: user.testsTaken || 0,
            averageScore: user.averageScore || 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading dashboard");
    }
};

// Get personal quiz score history logs
exports.getHistoryData = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).send("Login First");
        }
        const results = await Result.find({
            userId: req.session.user._id
        }).sort({ createdAt: -1 });
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error");
    }
};

// Get student ranking records
exports.getLeaderboardData = async (req, res) => {
    try {
        const students = await User.find({}, {
            name: 1,
            testsTaken: 1,
            averageScore: 1
        }).sort({ averageScore: -1 });
        res.json(students);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error");
    }
};

// Get all campus placement drives
exports.getCompanies = async (req, res) => {
    try {
        const companies = await Company.find();
        res.json(companies);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error Loading Companies");
    }
};

// Get student submitted drive application statuses
exports.getMyApplicationsData = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).send("Login First");
        }
        const applications = await Application.find({
            userId: req.session.user._id
        }).populate('companyId');
        res.json(applications);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error");
    }
};

// Get dynamic list of student notifications
exports.getNotifications = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Login First");
    }
    try {
        const notifications = await Notification.find({
            userId: req.session.user._id
        })
        .sort({ createdAt: -1 })
        .limit(10);
        res.json(notifications);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error");
    }
};

// Get career roadmaps
exports.getCareerGuideRoadmap = async (req, res) => {
    const career = req.params.career;
    const roadmaps = {
        "Java Developer": {
            skills: ["Core Java & OOPs", "Java Collections Framework", "Spring Boot & Spring Cloud", "Hibernate / JPA", "SQL & Relational Databases (MySQL/PostgreSQL)", "Unit Testing (JUnit, Mockito)"],
            roadmap: [
                "Master Core Java syntax, Object-Oriented programming, and Exception handling.",
                "Learn Advanced Java features like Streams API, Lambdas, and Concurrency/Multithreading.",
                "Build Maven/Gradle projects and understand SQL database interactions via JDBC.",
                "Develop RESTful Microservices with Spring Boot and JPA/Hibernate.",
                "Understand system design concepts, design patterns, and cloud deployment (Docker/AWS)."
            ],
            companies: ["Amazon", "Oracle", "JPMorgan Chase", "Infosys", "TCS", "Capgemini"]
        },
        "Web Developer": {
            skills: ["HTML5 & CSS3 (Flexbox/Grid)", "Modern JavaScript (ES6+)", "Frontend Frameworks (React, Vue, or Angular)", "Node.js & Express.js", "REST APIs & GraphQL", "Databases (MongoDB, PostgreSQL)"],
            roadmap: [
                "Learn Semantic HTML, CSS layouts, responsive design, and CSS frameworks (Tailwind/Bootstrap).",
                "Master Javascript DOM manipulation, Async/Await, Fetch API, and JS execution details.",
                "Adopt a modern frontend framework (React.js is highly recommended) and learn state management.",
                "Learn Backend programming with Node.js/Express and database integration (MongoDB/PostgreSQL).",
                "Build full-stack portfolios, configure authentication/security (JWT), and deploy to Vercel/Render."
            ],
            companies: ["Google", "Meta", "Netflix", "Uber", "Stripe", "Airbnb"]
        },
        "Python Developer": {
            skills: ["Python Scripting & OOPs", "Django / Flask / FastAPI frameworks", "Database engines (SQLite, PostgreSQL)", "API Development & Integration", "Asynchronous tasks (Celery, Redis)", "Testing frameworks (PyTest)"],
            roadmap: [
                "Learn Python fundamentals, data structures, control flows, and OOP paradigms.",
                "Build web APIs and MVC apps using Django or FastAPI.",
                "Learn SQL and database migrations in Django ORM or SQLAlchemy.",
                "Implement background workers, caching (Redis), and secure authentication.",
                "Deploy Python applications on Heroku/AWS and write automated unit tests."
            ],
            companies: ["Instagram", "Dropbox", "Spotify", "Reddit", "Intel", "Microsoft"]
        },
        "Data Analyst": {
            skills: ["Python (Pandas, NumPy, Matplotlib/Seaborn)", "SQL (Advanced Queries, Joins, CTEs)", "Data Visualization (Tableau, PowerBI)", "Statistics & Probability", "Excel (Macros, Pivot Tables)", "Data Warehousing (Snowflake, BigQuery)"],
            roadmap: [
                "Master Excel for spreadsheet manipulation and basic statistical charts.",
                "Learn SQL to query, join, and clean structured data from large database tables.",
                "Learn Python programming specifically for data analysis (Pandas & NumPy dataframes).",
                "Master data storytelling and dashboard creation using Tableau or PowerBI.",
                "Build analysis reports on real datasets (e.g. Kaggle datasets) and present business insights."
            ],
            companies: ["Deloitte", "KPMG", "EY", "PwC", "Accenture", "Walmart Global Tech"]
        },
        "AI Engineer": {
            skills: ["Python (PyTorch, TensorFlow, Keras)", "Machine Learning algorithms (Regression, Trees, SVMs)", "Deep Learning (CNNs, RNNs, Transformers)", "Natural Language Processing (NLP)", "Large Language Models & Prompt Engineering", "Vector Databases (Pinecone, ChromaDB)"],
            roadmap: [
                "Solidify foundations in linear algebra, calculus, probability, and statistics.",
                "Learn Python's scientific ecosystem (Scikit-Learn, Pandas) and classic ML algorithms.",
                "Dive into Neural Networks, Deep Learning architectures using PyTorch or TensorFlow.",
                "Learn LLM integration, prompt engineering, and building RAG (Retrieval-Augmented Generation) systems.",
                "Deploy models as APIs, monitor performance, and learn AI security/bias mitigation."
            ],
            companies: ["OpenAI", "Google DeepMind", "Microsoft", "NVIDIA", "Tesla", "Adobe"]
        },
        "Cyber Security": {
            skills: ["Networking Protocols (TCP/IP, DNS, SSL/TLS)", "Linux Operating System & Bash Scripting", "Penetration Testing (Metasploit, Burp Suite)", "OWASP Top 10 vulnerabilities", "Cryptography Basics", "SIEM Tools & Log Analysis"],
            roadmap: [
                "Understand fundamental network routing, port scanning, and OS architectures (Linux/Windows).",
                "Learn secure coding practices and identify common web vulnerabilities (XSS, SQLi, CSRF).",
                "Practice penetration testing on platforms like TryHackMe or HackTheBox.",
                "Learn incident response, log monitoring, and threat detection mechanisms.",
                "Obtain relevant certifications (CompTIA Security+, CEH, OSCP) to build credentials."
            ],
            companies: ["CrowdStrike", "Palo Alto Networks", "FireEye", "Cisco", "IBM Security", "Military/Government agencies"]
        },
        "Cloud Engineer": {
            skills: ["Cloud Platforms (AWS, Azure, or GCP)", "Infrastructure as Code (IaC - Terraform)", "Containerization (Docker, Kubernetes)", "CI/CD Pipelines (GitHub Actions, Jenkins)", "Linux System Administration", "Networking (VPC, Subnets, Firewalls)"],
            roadmap: [
                "Master Linux command line, system services, and shell scripting.",
                "Learn the fundamentals of a major cloud provider (preferably AWS Cloud Practitioner/Solutions Architect).",
                "Master containerization concepts using Docker and orchestrate containers with Kubernetes.",
                "Learn to write Terraform templates to manage infrastructure as code.",
                "Configure automated CI/CD pipelines to build, test, and deploy applications to the cloud."
            ],
            companies: ["Amazon Web Services", "Microsoft Azure", "Google Cloud", "Red Hat", "HashiCorp", "Netflix"]
        }
    };

    const roadmapData = roadmaps[career];
    if (roadmapData) {
        res.json(roadmapData);
    } else {
        res.status(404).json({ error: "Career roadmap not found" });
    }
};

// Get randomized aptitude MCQ questions
exports.getQuestions = async (req, res) => {
    try {
        const questions = await Question.aggregate([
            { $sample: { size: 20 } }
        ]);
        res.json(questions);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error Loading Questions");
    }
};

// Get all technical MCQ coding questions
exports.getTechnicalQuestions = async (req, res) => {
    try {
        const questions = await TechnicalQuestion.find();
        res.json(questions);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error Loading Technical Questions");
    }
};

// ==========================================
// POST WRITE ACTIONS
// ==========================================

// Update student profile info
exports.updateProfile = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).send("Login First");
        }
        const {
            name,
            phone,
            branch,
            semester,
            cgpa,
            skills,
            linkedin,
            github
        } = req.body;

        const user = await User.findById(req.session.user._id);
        if (!user) {
            return res.status(404).send("User not found");
        }

        user.name = name;
        user.phone = phone;
        user.branch = branch;
        user.semester = semester;
        user.cgpa = cgpa;
        user.skills = skills;
        user.linkedin = linkedin;
        user.github = github;

        await user.save();

        await Notification.create({
            userId: user._id,
            title: "Profile Updated",
            message: "Your profile information was updated."
        });

        req.session.user.name = user.name;
        res.send("Profile Updated Successfully");
    } catch (err) {
        console.log(err);
        res.status(500).send("Error Updating Profile");
    }
};

// Upload student profile image
exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }
        const user = await User.findById(req.session.user._id);
        if (!user) {
            return res.send("User not found");
        }
        user.profileImage = req.file.path;  // Cloudinary URL
        const savedUser = await user.save();
        req.session.user.profileImage = savedUser.profileImage;
        res.redirect('/profile');
    } catch (err) {
        console.log("ERROR:", err);
        res.send("Profile Image Upload Failed");
    }
};

// Upload custom PDF resume
exports.uploadResume = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }
        const user = await User.findById(req.session.user._id);
        if (!user) {
            return res.send("User not found");
        }
        user.resume = req.file.path;  // Cloudinary URL
        await user.save();

        await Notification.create({
            userId: user._id,
            title: "Resume Uploaded",
            message: "Your resume has been uploaded successfully."
        });

        req.session.user.resume = user.resume;
        res.redirect('/resume');
    } catch (err) {
        console.log(err);
        res.send("Resume Upload Failed");
    }
};

// Generate AI PDF Resume
exports.buildResume = async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const uploadDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const doc = new PDFDocument({ margin: 50 });
        const filename = "resume-" + user._id + "-" + Date.now() + ".pdf";
        const filepath = path.join(uploadDir, filename);

        const writeStream = fs.createWriteStream(filepath);
        doc.pipe(writeStream);

        const primaryColor = "#1e3a8a";
        const secondaryColor = "#4b5563";
        const textColor = "#1f2937";

        doc.fillColor(primaryColor)
           .font("Helvetica-Bold")
           .fontSize(26)
           .text(user.name || "Student Name", { align: "center" });

        doc.fontSize(10)
           .fillColor(secondaryColor)
           .font("Helvetica")
           .text(`${user.email} | Phone: ${user.phone || 'N/A'}`, { align: "center" })
           .text(`LinkedIn: ${user.linkedin || 'N/A'} | GitHub: ${user.github || 'N/A'}`, { align: "center" });

        doc.moveDown(1.5);
        
        doc.strokeColor("#e5e7eb")
           .lineWidth(1)
           .moveTo(50, doc.y)
           .lineTo(562, doc.y)
           .stroke();
        doc.moveDown(1.5);

        doc.fillColor(primaryColor)
           .font("Helvetica-Bold")
           .fontSize(14)
           .text("EDUCATION");
        
        doc.moveDown(0.5);
        doc.fillColor(textColor)
           .font("Helvetica")
           .fontSize(11);
        
        doc.text(`Branch: ${user.branch || 'N/A'}`);
        doc.text(`Semester: Semester ${user.semester || 'N/A'}`);
        doc.text(`Current CGPA: ${user.cgpa ? user.cgpa + ' / 10.0' : 'N/A'}`);

        doc.moveDown(1.5);
        
        doc.strokeColor("#e5e7eb")
           .lineWidth(1)
           .moveTo(50, doc.y)
           .lineTo(562, doc.y)
           .stroke();
        doc.moveDown(1.5);

        doc.fillColor(primaryColor)
           .font("Helvetica-Bold")
           .fontSize(14)
           .text("TECHNICAL SKILLS");
        
        doc.moveDown(0.5);
        doc.fillColor(textColor)
           .font("Helvetica")
           .fontSize(11);

        if (user.skills && user.skills.trim() !== "") {
            const skillList = user.skills.split(',').map(s => s.trim());
            doc.text(skillList.join(" | "));
        } else {
            doc.text("No skills listed yet.");
        }

        doc.moveDown(1.5);
        
        doc.strokeColor("#e5e7eb")
           .lineWidth(1)
           .moveTo(50, doc.y)
           .lineTo(562, doc.y)
           .stroke();
        doc.moveDown(1.5);

        doc.fillColor(primaryColor)
           .font("Helvetica-Bold")
           .fontSize(14)
           .text("PROJECTS");
        
        doc.moveDown(0.5);
        doc.fillColor(textColor)
           .font("Helvetica")
           .fontSize(11);

        doc.font("Helvetica-Bold").text("Academic Project: AI Placement Preparation Portal");
        doc.font("Helvetica").fontSize(10).text("• Developed a web application for student placement preparation, testing, and recruitment drives.");
        doc.text("• Technologies used: Node.js, Express, MongoDB, HTML, CSS, JavaScript.");

        doc.moveDown(1);
        doc.font("Helvetica-Bold").fontSize(11).text("Interactive Online Code Assessment Platform");
        doc.font("Helvetica").fontSize(10).text("• Built dynamic quiz and testing modules with timed engines and visual grading analytics.");

        doc.end();

        writeStream.on('finish', async () => {
            user.resume = filename;
            await user.save();

            await Notification.create({
                userId: user._id,
                title: "Resume Built Successfully",
                message: "A professional PDF resume was automatically built from your profile."
            });

            req.session.user.resume = filename;
            res.json({ success: true, filename: filename });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to generate resume" });
    }
};

// Save timed assessment quiz result scores
exports.submitTest = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).send("Login First");
        }
        const { score, total } = req.body;
        const percentage = Math.round((score / total) * 100);

        const result = new Result({
            userId: req.session.user._id,
            score,
            totalQuestions: total,
            percentage
        });

        await result.save();

        const user = await User.findById(req.session.user._id);
        const totalTests = user.testsTaken + 1;
        const average = ((user.averageScore * user.testsTaken) + percentage) / totalTests;

        user.testsTaken = totalTests;
        user.averageScore = Math.round(average);
        await user.save();

        req.session.user = user;
        res.send("Saved");
    } catch (err) {
        console.log(err);
        res.status(500).send("Error");
    }
};

// Apply for placement drive job roles
exports.applyCompany = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).send("Login First");
        }
        const { companyId } = req.body;

        const alreadyApplied = await Application.findOne({
            userId: req.session.user._id,
            companyId: companyId
        });

        if (alreadyApplied) {
            return res.send("You have already applied.");
        }

        const application = new Application({
            userId: req.session.user._id,
            companyId: companyId
        });

        await application.save();

        await Notification.create({
            userId: req.session.user._id,
            title: "Application Submitted",
            message: "Your application has been submitted successfully."
        });

        res.send("Application Submitted Successfully ✅");
    } catch (err) {
        console.log(err);
        res.status(500).send("Error");
    }
};

// Get profile completion metadata calculations
exports.getUserCompletionData = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).send("Not Logged In");
        }

        const user = await User.findById(req.session.user._id);
        if (!user) {
            return res.status(404).send("User not found");
        }

        let completed = 0;
        let total = 8;

        if (user.name && user.name.trim() !== "") completed++;
        if (user.phone && user.phone.trim() !== "") completed++;
        if (user.profileImage && user.profileImage !== "default.png") completed++;
        if (user.resume && user.resume !== "") completed++;
        if (user.skills && user.skills.trim() !== "") completed++;
        if (user.linkedin && user.linkedin.trim() !== "") completed++;
        if (user.github && user.github.trim() !== "") completed++;
        if (user.cgpa && Number(user.cgpa) > 0) completed++;

        const profileCompletion = Math.round((completed / total) * 100);

        res.json({
            ...user.toObject(),
            profileCompletion
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Error");
    }
};
