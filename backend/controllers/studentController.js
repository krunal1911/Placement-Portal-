const path = require("path");
const fs   = require("fs");

const { uploadFile } = require("../../database/config/cloudinary");

const User = require("../../database/models/User");
let Result;
try {
    Result = require("../../database/models/Result");
} catch (e) {
    try {
        Result = require("../../database/models/result");
    } catch (e2) {}
}
const Company = require("../../database/models/Company");
const Application = require("../../database/models/Application");
const Notification = require("../../database/models/Notification");
const ExamSettings = require("../../database/models/ExamSettings");
const Question = require("../../database/models/Question");
const TechnicalQuestion = require("../../database/models/TechnicalQuestion");
const CheatingLog = require("../../database/models/CheatingLog");

const renderView = require("../utils/renderView");

// ==========================================
// VIEW PAGES
// ==========================================
exports.showDashboard = (req, res) => {
    renderView(res, "dashboard.html");
};

exports.showPresentation = (req, res) => {
    renderView(res, "presentation.html");
};

exports.showProfile = (req, res) => {
    renderView(res, "profile.html");
};

exports.showResume = (req, res) => {
    renderView(res, "resume.html");
};

exports.showAptitude = (req, res) => {
    renderView(res, "aptitude.html");
};

exports.showTechnical = (req, res) => {
    renderView(res, "technical.html");
};

exports.showCombined = (req, res) => {
    renderView(res, "combined.html");
};

exports.showCareerGuide = (req, res) => {
    renderView(res, "career-guide.html");
};

exports.showLeaderboard = (req, res) => {
    renderView(res, "leaderboard.html");
};

exports.showPlacementDrives = (req, res) => {
    renderView(res, "placement-drives.html");
};

exports.showHistory = (req, res) => {
    renderView(res, "history.html");
};

exports.showMyApplications = (req, res) => {
    renderView(res, "my-applications.html");
};

// ==========================================
// API / DATA ENDPOINTS
// ==========================================

// Get Current User Profile details (with profileImage & resume fields)
exports.getCurrentUser = async (req, res) => {
    try {
        const activeUser = req.user || req.session.user;
        if (!activeUser) {
            return res.status(401).send("Not Logged In");
        }
        const user = await User.findById(activeUser._id || activeUser.id);
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            branch: user.branch,
            semester: user.semester,
            resume: user.resume,
            profileImage: user.profileImage || "default.png"
        });
    } catch (err) {
        console.error("getCurrentUser error:", err);
        res.status(500).send("Server Error");
    }
};

// Verification API endpoint for real-time exam link active checking
exports.verifyTokenAPI = async (req, res) => {
    try {
        const { company, token, examType } = req.query;
        if (!company || company === "General") {
            return res.json({ valid: true });
        }
        const ActiveExamLink = require("../../database/models/ActiveExamLink");
        const link = await ActiveExamLink.findOne({ token });
        if (!link || !link.isActive || link.companyName !== company || Date.now() > link.expiresAt.getTime()) {
            return res.status(410).json({ valid: false, message: "Exam token stopped or expired." });
        }
        res.json({ valid: true });
    } catch (err) {
        console.error("verifyTokenAPI error:", err);
        res.status(500).json({ valid: false });
    }
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
        }).sort({ averageScore: -1, testsTaken: -1 });
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
        const user = req.user || (req.session && req.session.user);
        if (!user) {
            return res.status(401).json({ error: "Login First" });
        }
        const userIdStr = String(user._id || user.id);
        const mongoose = require("mongoose");
        let queryUserIds = [userIdStr];
        if (mongoose.Types.ObjectId.isValid(userIdStr)) {
            queryUserIds.push(new mongoose.Types.ObjectId(userIdStr));
        }

        const applications = await Application.find({
            userId: { $in: queryUserIds }
        }).populate('companyId').sort({ appliedAt: -1 });

        res.json(applications || []);
    } catch (err) {
        console.error("getMyApplicationsData error:", err);
        res.json([]);
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

// Get randomized aptitude MCQ questions (Strict Company Isolation with Case-Insensitive Matching)
exports.getQuestions = async (req, res) => {
    try {
        const company = (req.query.company || "General").trim();
        const queryFilter = (company === "General" || !company)
            ? { $or: [{ companyName: "General" }, { companyName: { $exists: false } }, { companyName: "" }, { companyName: null }] }
            : { companyName: new RegExp(`^${company.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") };

        const questions = await Question.aggregate([
            { $match: queryFilter },
            { $sample: { size: 20 } }
        ]);
        res.json(questions);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error Loading Questions");
    }
};

// Get all technical MCQ coding questions (Strict Company Isolation with Case-Insensitive Matching)
exports.getTechnicalQuestions = async (req, res) => {
    try {
        const company = (req.query.company || "General").trim();
        const queryFilter = (company === "General" || !company)
            ? { $or: [{ companyName: "General" }, { companyName: { $exists: false } }, { companyName: "" }, { companyName: null }] }
            : { companyName: new RegExp(`^${company.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") };

        const questions = await TechnicalQuestion.aggregate([
            { $match: queryFilter },
            { $sample: { size: 20 } }
        ]);
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

        if (phone) {
            const cleanPhone = phone.trim();
            if (cleanPhone !== "" && !/^\d{10}$/.test(cleanPhone)) {
                return res.status(400).send("Contact number must be exactly 10 digits.");
            }
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

// Upload student profile image → Cloudinary or Local Fallback
exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.session.user) return res.redirect('/login');
        if (!req.file) return res.status(400).send("No image file received.");

        const user = await User.findById(req.session.user._id);
        if (!user) return res.status(404).send("User not found");

        // Upload buffer directly via our fallback utility
        const imageUrl = await uploadFile(
            req.file.buffer,
            'profiles',
            req.file.originalname,
            'image'
        );

        user.profileImage = imageUrl;
        const savedUser = await user.save();
        req.session.user.profileImage = savedUser.profileImage;
        res.redirect('/profile');
    } catch (err) {
        console.error("Profile upload error:", err);
        res.status(500).send("Profile Image Upload Failed: " + err.message);
    }
};

// Upload custom PDF resume → Cloudinary or Local Fallback
// Upload custom PDF resume → Cloudinary or Local Fallback
exports.uploadResume = async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).send("Login First");
        if (!req.file) return res.status(400).send("No PDF file received.");

        const user = await User.findById(req.session.user._id);
        if (!user) return res.status(404).send("User not found");

        user.resumeBuffer = req.file.buffer;
        user.resume = req.file.originalname || "attached_resume.pdf";
        await user.save();

        await Notification.create({
            userId: user._id,
            title: "Resume Uploaded",
            message: `Your resume (${user.resume}) has been uploaded successfully.`
        }).catch(() => {});

        req.session.user.resume = user.resume;
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.json({ success: true, message: "Resume Uploaded & Attached Successfully!", filename: user.resume });
        }
        res.redirect('/resume');
    } catch (err) {
        console.error("Resume upload error:", err);
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.status(500).json({ error: "Resume Upload Failed: " + err.message });
        }
        res.status(500).send("Resume Upload Failed: " + err.message);
    }
};

// Delete attached resume
exports.deleteResume = async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).send("Login First");

        const user = await User.findById(req.session.user._id);
        if (!user) return res.status(404).send("User not found");

        user.resume = null;
        user.resumeBuffer = null;
        await user.save();

        req.session.user.resume = null;

        await Notification.create({
            userId: user._id,
            title: "Resume Deleted",
            message: "Your active resume has been removed."
        }).catch(() => {});

        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.json({ success: true, message: "Resume deleted successfully." });
        }
        res.status(200).send("Resume deleted successfully.");
    } catch (err) {
        console.error("Resume delete error:", err);
        res.status(500).send("Failed to delete resume: " + err.message);
    }
};

// View own uploaded PDF resume
exports.viewOwnResume = async (req, res) => {
    try {
        if (!req.session.user) return res.redirect('/login');

        const user = await User.findById(req.session.user._id);
        if (!user || !user.resumeBuffer) {
            return res.status(404).send("No resume PDF found for your account.");
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${user.resume || 'resume.pdf'}"`);
        return res.send(user.resumeBuffer);
    } catch (err) {
        console.error("View own resume error:", err);
        return res.status(500).send("Error fetching resume PDF: " + err.message);
    }
};

// View student PDF resume (for Admins)
exports.viewStudentResume = async (req, res) => {
    try {
        const { studentId } = req.params;
        const user = await User.findById(studentId);
        if (!user || !user.resumeBuffer) {
            return res.status(404).send("No resume PDF found for this student.");
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${user.name || 'Student'}_Resume.pdf"`);
        return res.send(user.resumeBuffer);
    } catch (err) {
        console.error("View student resume error:", err);
        return res.status(500).send("Error fetching student resume PDF: " + err.message);
    }
};

// Helper to get professional brief descriptions for candidate skills
const getSkillDescription = (skillName) => {
    const cleanSkill = skillName.trim().toLowerCase();
    const skillMap = {
        "javascript": "Core dynamic web logic, async API fetching, and modern client/server scripting.",
        "html": "Semantic document structures, responsive DOM layout standardizations, and SEO layouts.",
        "css": "Responsive layouts (Grid/Flexbox), modern styling frameworks, keyframe animations.",
        "node.js": "Backend REST API runtime builds, asynchronous event loops, server scripting.",
        "node": "Backend REST API runtime builds, asynchronous event loops, server scripting.",
        "express": "MVC routing systems, intermediate query processing, backend middleware flows.",
        "express.js": "MVC routing systems, intermediate query processing, backend middleware flows.",
        "mongodb": "Document-based NoSQL database indexing, aggregation queries, Mongoose modeling.",
        "react": "Reusable UI components, state lifecycle controls, dynamic client rendering.",
        "react.js": "Reusable UI components, state lifecycle controls, dynamic client rendering.",
        "python": "Data analytics automation scripts, computational algorithms, and server applications.",
        "sql": "Relational schema designs, transaction logic scripting, database query pipelines.",
        "java": "Object-oriented program designs, threading, data structures, and class models.",
        "c++": "Efficient low-level algorithms, custom data templates, object design abstractions.",
        "c": "Core procedurual coding controls, hardware mapping, memory allocations.",
        "git": "Repo version histories, merge conflicts handling, branches, and version control."
    };
    for (const [key, desc] of Object.entries(skillMap)) {
        if (cleanSkill.includes(key)) return desc;
    }
    return `Applied expertise, logic, and practical implementation in ${skillName}.`;
};

// Generate AI PDF Resume
exports.buildResume = async (req, res) => {
    try {
        const { hasProjects, projects, linkedin, github } = req.body;
        const user = await User.findById(req.session.user._id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        let needsSave = false;
        if (linkedin !== undefined && user.linkedin !== linkedin) {
            user.linkedin = linkedin;
            needsSave = true;
        }
        if (github !== undefined && user.github !== github) {
            user.github = github;
            needsSave = true;
        }
        if (hasProjects && Array.isArray(projects)) {
            user.projects = projects;
            needsSave = true;
        }
        if (needsSave) {
            await user.save();
        }

        const uploadDir = path.join(__dirname, "../../frontend/public/uploads/resumes");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const doc = new PDFDocument({ margin: 0, size: 'LETTER' });
        const filename = "resume-" + user._id + "-" + Date.now() + ".pdf";
        const filepath = path.join(uploadDir, filename);

        const writeStream = fs.createWriteStream(filepath);
        doc.pipe(writeStream);

        // Premium Color Palettes - Different every time!
        const palettes = [
            { primary: "#1e3a8a", accent: "#2563eb" }, // Navy Blue
            { primary: "#0f766e", accent: "#0d9488" }, // Teal
            { primary: "#374151", accent: "#6366f1" }, // Charcoal Indigo
            { primary: "#065f46", accent: "#10b981" }, // Emerald
            { primary: "#4c1d95", accent: "#7c3aed" }  // Royal Purple
        ];
        const theme = palettes[Math.floor(Math.random() * palettes.length)];

        const PAGE_W = 612;
        const SIDEBAR_W = 185;
        const RIGHT_X = SIDEBAR_W + 25;
        const RIGHT_W = PAGE_W - SIDEBAR_W - 45;
        const white = "#ffffff";
        const darkText = "#1e293b";
        const mutedText = "#64748b";
        const lightBg = "#f8fafc";
        const sidebarBg = theme.primary;

        // ─── FULL-WIDTH HEADER BANNER ────────────────────────────────
        const HEADER_H = 110;
        doc.rect(0, 0, PAGE_W, HEADER_H).fill(theme.primary);

        // Name
        doc.fillColor(white)
           .font("Helvetica-Bold")
           .fontSize(26)
           .text((user.name || "Student Name").toUpperCase(), 24, 20, { width: PAGE_W - 48 });

        // Branch subtitle
        doc.fillColor("#bfdbfe")
           .font("Helvetica")
           .fontSize(11)
           .text((user.branch || "Engineering Student").toUpperCase(), 24, 52, { characterSpacing: 0.8 });

        // Contact row inside header
        const contactY = 74;
        const contactItems = [
            user.email,
            user.phone || "N/A",
            user.linkedin ? "LinkedIn: " + user.linkedin : "LinkedIn: N/A",
            user.github ? "GitHub: " + user.github : "GitHub: N/A"
        ];
        doc.fillColor("#e0f2fe").font("Helvetica").fontSize(8);
        let contactX = 24;
        contactItems.forEach((item, i) => {
            if (i > 0) {
                doc.fillColor("#93c5fd").text(" | ", contactX, contactY, { continued: true });
                contactX += doc.widthOfString(" | ");
            }
            doc.fillColor("#e0f2fe").text(item, contactX, contactY, { continued: i < contactItems.length - 1, width: PAGE_W - 48 });
            contactX += doc.widthOfString(item);
        });

        // ─── SIDEBAR BACKGROUND ──────────────────────────────────────
        doc.rect(0, HEADER_H, SIDEBAR_W, 792 - HEADER_H).fill("#1e3055");

        // ─── BODY BACKGROUND (right side) ───────────────────────────
        doc.rect(SIDEBAR_W, HEADER_H, PAGE_W - SIDEBAR_W, 792 - HEADER_H).fill(white);

        // ─── HELPER: SIDEBAR SECTION HEADER ─────────────────────────
        let sideY = HEADER_H + 22;
        const sidebarSection = (title) => {
            doc.fillColor("#93c5fd").font("Helvetica-Bold").fontSize(8.5)
               .text(title, 14, sideY, { characterSpacing: 1 });
            sideY = doc.y + 4;
            doc.strokeColor("#3b5bdb").lineWidth(0.5)
               .moveTo(14, sideY).lineTo(SIDEBAR_W - 14, sideY).stroke();
            sideY += 8;
        };

        // ─── HELPER: RIGHT SECTION HEADER ───────────────────────────
        let rightY = HEADER_H + 22;
        const rightSection = (title) => {
            doc.fillColor(theme.accent).font("Helvetica-Bold").fontSize(12)
               .text(title, RIGHT_X, rightY, { characterSpacing: 0.5 });
            rightY = doc.y + 3;
            doc.strokeColor(theme.accent).lineWidth(1.5)
               .moveTo(RIGHT_X, rightY).lineTo(RIGHT_X + RIGHT_W, rightY).stroke();
            rightY += 10;
        };

        // ─── SIDEBAR CONTENT ─────────────────────────────────────────

        // Academic Metrics
        sidebarSection("ACADEMICS");
        doc.fillColor(white).font("Helvetica-Bold").fontSize(9)
           .text(user.branch || "Engineering", 14, sideY, { width: SIDEBAR_W - 24 });
        sideY = doc.y + 4;
        doc.fillColor("#bfdbfe").font("Helvetica").fontSize(8.5)
           .text("Semester: " + (user.semester || "N/A"), 14, sideY);
        sideY = doc.y + 3;
        doc.text("CGPA: " + (user.cgpa ? user.cgpa + " / 10.0" : "N/A"), 14, sideY);
        sideY = doc.y + 20;

        // Platforms & Tools
        sidebarSection("PLATFORMS & TOOLS");
        const branchToolsMap = {
            "computer":    ["VS Code", "Git & GitHub", "Docker", "Postman", "MongoDB Compass", "Node.js"],
            "information": ["VS Code", "Git & GitHub", "Docker", "Postman", "MongoDB Compass", "Node.js"],
            "electronics": ["MATLAB", "Simulink", "Keil uVision", "Proteus", "Arduino IDE", "Xilinx ISE"],
            "mechanical":  ["AutoCAD", "SolidWorks", "CATIA", "ANSYS", "Fusion 360", "MATLAB"],
            "civil":       ["Revit", "STAAD Pro", "AutoCAD Civil 3D", "SAP2000", "ArcGIS", "Primavera"],
            "electrical":  ["MATLAB", "Simulink", "ETAP", "PSPICE", "Proteus", "AutoCAD Electrical"]
        };
        const branchLower = (user.branch || "").toLowerCase();
        let toolsList = ["VS Code", "Git & GitHub", "MS Office"];
        for (const [key, list] of Object.entries(branchToolsMap)) {
            if (branchLower.includes(key)) { toolsList = list; break; }
        }
        doc.fillColor("#bfdbfe").font("Helvetica").fontSize(8.5);
        toolsList.forEach(tool => {
            doc.text("  > " + tool, 14, sideY, { width: SIDEBAR_W - 20 });
            sideY = doc.y + 3;
        });

        sideY += 14;

        // Core Strengths
        sidebarSection("CORE STRENGTHS");
        let strengths = ["Problem Solving", "Quick Learner", "Team Collaboration"];
        if (user.branch) {
            if (user.branch.includes("Computer") || user.branch.includes("Information")) {
                strengths.push("Software Design", "Logic & Analysis");
            } else if (user.branch.includes("Mechanical")) {
                strengths.push("CAD/CAE Design", "System Dynamics");
            } else if (user.branch.includes("Electrical") || user.branch.includes("Electronic")) {
                strengths.push("Circuit Design", "Signal Analysis");
            } else if (user.branch.includes("Civil")) {
                strengths.push("Structural Analysis", "Project Supervision");
            }
        }
        if (user.cgpa && parseFloat(user.cgpa) >= 8.5) {
            strengths.push("Academic Excellence");
        }
        if (user.skills && user.skills.trim()) {
            const list = user.skills.split(",").map(s => s.trim());
            if (list.length > 0) strengths.unshift(list[0] + " Specialist");
        }
        strengths = [...new Set(strengths)].slice(0, 5);

        doc.fillColor("#bfdbfe").font("Helvetica").fontSize(8.5);
        strengths.forEach(s => {
            doc.text("  > " + s, 14, sideY, { width: SIDEBAR_W - 20 });
            sideY = doc.y + 3;
        });

        // ─── RIGHT COLUMN CONTENT ─────────────────────────────────────

        // TECHNICAL SKILLS
        rightSection("TECHNICAL SKILLS");
        if (user.skills && user.skills.trim()) {
            const skillList = user.skills.split(",").map(s => s.trim());
            skillList.forEach(skill => {
                const desc = getSkillDescription(skill);
                doc.fillColor(darkText).font("Helvetica-Bold").fontSize(9.5)
                   .text(skill, RIGHT_X + 8, rightY, { continued: true })
                   .font("Helvetica").fillColor(mutedText).fontSize(8.5)
                   .text("  —  " + desc, { width: RIGHT_W - 10 });
                rightY = doc.y + 5;
            });
        } else {
            doc.fillColor(mutedText).font("Helvetica").fontSize(9)
               .text("No skills listed in profile.", RIGHT_X + 8, rightY);
            rightY = doc.y + 10;
        }

        rightY += 14;

        // PROJECTS
        // PROJECTS
        const finalProjects = (projects && Array.isArray(projects) && projects.length > 0) 
            ? projects 
            : (user.projects || []);

        if (hasProjects !== false && finalProjects.length > 0) {
            rightSection("PROJECTS");

            finalProjects.forEach((proj) => {
                doc.fillColor(darkText).font("Helvetica-Bold").fontSize(10)
                   .text(proj.title || "Project Title", RIGHT_X + 8, rightY, { width: RIGHT_W });
                rightY = doc.y + 2;

                if (proj.tech) {
                    doc.fillColor(theme.accent).font("Helvetica").fontSize(8)
                       .text(proj.tech, RIGHT_X + 8, rightY);
                    rightY = doc.y + 5;
                }

                if (proj.desc) {
                    doc.fillColor(mutedText).font("Helvetica").fontSize(8.5);
                    const bullets = proj.desc.split("\n").map(line => line.trim()).filter(line => line.length > 0);
                    bullets.forEach(bullet => {
                        const bulletText = bullet.startsWith("-") || bullet.startsWith("*") ? bullet : "  -  " + bullet;
                        doc.text(bulletText, RIGHT_X + 8, rightY, { width: RIGHT_W });
                        rightY = doc.y + 3;
                    });
                }

                rightY += 12;
            });
        }

        // CERTIFICATIONS (if space allows)
        if (rightY < 700) {
            rightSection("CERTIFICATIONS & ACHIEVEMENTS");
            const certs = [];
            
            // 1. Dynamic aptitude/technical test stats
            if (user.testsTaken && user.testsTaken > 0) {
                certs.push(`Successfully completed ${user.testsTaken} assessment modules with an average score of ${user.averageScore}%.`);
            } else {
                certs.push("Completed university engineering curriculum modules and coursework.");
            }
            
            // 2. Dynamic projects achievement
            if (user.projects && user.projects.length > 0) {
                const projNames = user.projects.map(p => p.title).join(", ");
                certs.push(`Designed and deployed professional software engineering projects including: ${projNames}.`);
            } else {
                certs.push("Active contributor in team-based software engineering project development.");
            }

            // 3. Dynamic branch/CGPA achievement
            if (user.cgpa && parseFloat(user.cgpa) >= 7.5) {
                certs.push(`Maintained an exceptional academic standard with a current CGPA of ${user.cgpa}.`);
            } else {
                certs.push("Participated in campus placement preparation drives and mock interviews.");
            }

            doc.fillColor(mutedText).font("Helvetica").fontSize(8.5);
            certs.forEach(c => {
                doc.text("  -  " + c, RIGHT_X + 8, rightY, { width: RIGHT_W });
                rightY = doc.y + 3;
            });
        }

        // Footer line
        doc.rect(0, 775, PAGE_W, 17).fill(theme.primary);
        doc.fillColor(white).font("Helvetica").fontSize(7)
           .text("Generated by Placement Portal AI Resume Builder", 0, 779, { align: "center", width: PAGE_W });

        doc.end();

        writeStream.on('finish', async () => {
            try {
                // Read local temp file buffer
                const fileBuffer = fs.readFileSync(filepath);

                user.resumeBuffer = fileBuffer;
                user.resume = "attached";
                await user.save();

                // Clean up the local temp file
                try {
                    fs.unlinkSync(filepath);
                } catch (cleanupErr) {
                    console.error("Temp file cleanup error:", cleanupErr);
                }

                await Notification.create({
                    userId: user._id,
                    title: "Resume Built Successfully",
                    message: "A professional PDF resume was automatically built from your profile and saved to the database."
                });

                req.session.user.resume = user.resume;
                res.json({ success: true, filename: user.resume });
            } catch (err) {
                console.error("Mongoose PDF save failed:", err);
                res.status(500).json({ error: "Failed to save generated resume to database." });
            }
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
        const { score, total, testType, companyName } = req.body;
        const percentage = Math.round((score / total) * 100);

        const result = new Result({
            userId: req.session.user._id,
            score,
            totalQuestions: total,
            percentage,
            testType: testType || "Aptitude",
            companyName: companyName || "General"
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

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).send("Company not found");
        }

        const user = await User.findById(req.session.user._id);
        if (!user) {
            return res.status(404).send("User not found");
        }

        // Check if application deadline has passed
        const deadlineStr = company.deadline || company.lastDate;
        if (deadlineStr && deadlineStr.trim().toLowerCase() !== "flexible" && deadlineStr.trim().toLowerCase() !== "n/a") {
            const deadlineDate = new Date(deadlineStr);
            if (!isNaN(deadlineDate.getTime())) {
                deadlineDate.setHours(23, 59, 59, 999);
                if (new Date() > deadlineDate) {
                    return res.status(400).send(`Application Closed: The application deadline (${deadlineStr}) for ${company.companyName} has passed.`);
                }
            }
        }

        const studentCgpa = parseFloat(user.cgpa);
        const requiredCgpa = parseFloat(company.eligibility);

        if (isNaN(studentCgpa)) {
            return res.status(400).send("Please update your CGPA in your profile first to check eligibility.");
        }

        if (!isNaN(requiredCgpa) && studentCgpa < requiredCgpa) {
            return res.status(400).send(`You are not eligible for this company. Your CGPA (${studentCgpa}) is below the required criteria (${requiredCgpa}).`);
        }

        const alreadyApplied = await Application.findOne({
            userId: req.session.user._id,
            companyId: companyId
        });

        if (alreadyApplied) {
            return res.status(400).send("You have already applied.");
        }

        const application = new Application({
            userId: req.session.user._id,
            companyId: companyId
        });

        await application.save();

        await Notification.create({
            userId: req.session.user._id,
            title: "Application Submitted",
            message: `Your application to ${company.companyName} has been submitted successfully.`
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

        const userId = req.session.user._id || req.session.user.id || req.session.user;
        const user = await User.findById(userId);
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

        let testsTaken = user.testsTaken || 0;
        let averageScore = user.averageScore || 0;
        let companiesAppliedCount = 0;

        try {
            if (Result) {
                const results = await Result.find({ userId: user._id });
                if (results && results.length > 0) {
                    testsTaken = results.length;
                    let totalScoreSum = 0;
                    results.forEach(r => {
                        totalScoreSum += (r.percentage !== undefined && r.percentage !== null) 
                            ? r.percentage 
                            : (r.totalQuestions > 0 ? Math.round((r.score / r.totalQuestions) * 100) : 0);
                    });
                    averageScore = Math.round(totalScoreSum / testsTaken);
                }
            }
        } catch (rErr) {
            console.warn("getUserCompletionData Result query warning:", rErr.message);
        }

        try {
            if (Application) {
                companiesAppliedCount = await Application.countDocuments({ userId: user._id });
            }
        } catch (aErr) {
            console.warn("getUserCompletionData Application query warning:", aErr.message);
        }

        const userObj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
        delete userObj.password;
        delete userObj.resumeBuffer;

        res.json({
            ...userObj,
            testsTaken,
            averageScore,
            profileCompletion,
            companiesApplied: companiesAppliedCount
        });
    } catch (err) {
        console.error("getUserCompletionData Error:", err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
};

// Dynamically build professional PDF resume using student profile details
exports.buildResume = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).send("Login First");
        }

        const user = await User.findById(req.session.user._id);
        if (!user) {
            return res.status(404).send("User not found");
        }

        const PDFDocument = require("pdfkit");
        const doc = new PDFDocument({ margin: 40, size: "A4" });
        const buffers = [];

        doc.on("data", (chunk) => buffers.push(chunk));
        doc.on("end", async () => {
            try {
                const pdfBuffer = Buffer.concat(buffers);
                user.resumeBuffer = pdfBuffer;
                user.resume = `/view-resume/${user._id}`;
                await user.save();

                await Notification.create({
                    userId: user._id,
                    title: "Resume Generated",
                    message: "Your AI-formatted PDF resume has been built and saved successfully!"
                });

                req.session.user.resume = user.resume;
                res.send("Resume Built Successfully ✅");
            } catch (saveErr) {
                console.error("Error saving built resume PDF:", saveErr);
                res.status(500).send("Failed to save generated resume PDF.");
            }
        });

        // ─── RESUME PDF LAYOUT DESIGN ──────────────────────────────────────────
        // Header Name & Contact Info
        doc.fillColor("#1e3a8a").fontSize(22).text((user.name || "Student").toUpperCase(), { align: "center" });
        doc.fontSize(10).fillColor("#475569").text(`${user.email} | Phone: ${user.phone || "N/A"} | ${user.branch || "Engineering"} (Semester ${user.semester || "N/A"})`, { align: "center" });
        if (user.linkedin || user.github) {
            doc.fontSize(9).fillColor("#2563eb").text(`LinkedIn: ${user.linkedin || "N/A"} | GitHub: ${user.github || "N/A"}`, { align: "center" });
        }
        doc.moveDown();
        doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown();

        // Academic Profile
        doc.fillColor("#1e293b").fontSize(14).text("ACADEMIC PROFILE", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor("#334155");
        doc.text(`Degree & Branch: Bachelor of Technology - ${user.branch || "Engineering"}`);
        doc.text(`Current Academic Semester: Semester ${user.semester || "N/A"}`);
        doc.text(`Cumulative CGPA: ${user.cgpa || "N/A"} / 10.0`);
        doc.moveDown();

        // Technical Skills
        doc.fillColor("#1e293b").fontSize(14).text("TECHNICAL SKILLS & COMPETENCIES", { underline: true });
        doc.moveDown(0.5);
        const skillsList = user.skills ? user.skills.split(",").map(s => s.trim()).join(" • ") : "Programming, Problem Solving, Data Structures, Web Technology";
        doc.fontSize(10).fillColor("#334155").text(skillsList);
        doc.moveDown();

        // Projects & Certifications
        doc.fillColor("#1e293b").fontSize(14).text("PROJECTS & PRACTICAL ASSESSMENTS", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor("#334155");
        doc.text("• AI Placement Preparation Portal — Full-stack candidate assessment and proctoring suite.");
        doc.text("• Technical & Aptitude Competency Assessments — Solved quantitative, logical, and core CS evaluations.");
        doc.moveDown();

        // Footer Note
        doc.fillColor("#94a3b8").fontSize(8).text("Dynamically generated via Placement Preparation Portal", { align: "center" });

        doc.end();
    } catch (err) {
        console.error("buildResume Error:", err);
        res.status(500).send("Error building PDF resume.");
    }
};

// Remove student's resume
exports.deleteResume = async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).send("Login First");

        const user = await User.findById(req.session.user._id);
        if (!user) return res.status(404).send("User not found");

        user.resume = "";
        user.resumeBuffer = undefined;
        await user.save();

        await Notification.create({
            userId: user._id,
            title: "Resume Removed",
            message: "Your resume has been successfully removed."
        });

        req.session.user.resume = "";
        res.send("Success");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error removing resume");
    }
};

const streamResume = async (user, res) => {
    try {
        if (!user) {
            return res.status(404).send("<h1>Student not found</h1>");
        }
        
        // 1. Direct stream from MongoDB Buffer (Highly reliable, bypasses Cloudinary restrictions)
        if (user.resumeBuffer && user.resumeBuffer.length > 0) {
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", 'inline; filename="resume.pdf"');
            return res.send(user.resumeBuffer);
        }
        
        // 2. Backward compatibility fallback for old URLs
        if (!user.resume) {
            return res.status(404).send("<h1>No resume found</h1><p>The student has not uploaded or built a resume yet.</p>");
        }
        
        if (user.resume.startsWith("http")) {
            const cloudRes = await fetch(user.resume);
            if (!cloudRes.ok) {
                return res.status(404).send("<h1>Resume Expired or Blocked</h1><p>This is an old Cloudinary link that is blocked. Please log in as the student and rebuild or upload your resume again to store it permanently in the database.</p>");
            }
            const buffer = await cloudRes.arrayBuffer();
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", 'inline; filename="resume.pdf"');
            return res.send(Buffer.from(buffer));
        } else {
            const localPath = path.join(__dirname, "../../frontend/public", user.resume);
            if (fs.existsSync(localPath)) {
                res.setHeader("Content-Type", "application/pdf");
                res.setHeader("Content-Disposition", 'inline; filename="resume.pdf"');
                return res.sendFile(localPath);
            }
            return res.status(404).send("<h1>Resume Not Found</h1><p>Please log in as the student and rebuild your resume to save it permanently.</p>");
        }
    } catch (err) {
        console.error("Error streaming resume:", err);
        res.status(500).send("<h1>Server Error</h1><p>An error occurred while displaying the PDF resume.</p>");
    }
};

exports.viewOwnResume = async (req, res) => {
    try {
        const activeUser = req.user || (req.session && req.session.user);
        if (!activeUser) {
            return res.redirect("/login");
        }
        const user = await User.findById(activeUser._id || activeUser.id);
        if (!user) {
            return res.status(404).send("User profile not found.");
        }
        await streamResume(user, res);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

exports.viewStudentResume = async (req, res) => {
    try {
        const user = await User.findById(req.params.studentId);
        await streamResume(user, res);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

exports.logCheating = async (req, res) => {
    try {
        const { testType, incidentType, details, companyName, snapshotImage, candidateName, candidateEmail } = req.body;
        
        let userId = null;
        let name = candidateName || "";
        let email = candidateEmail || "";

        if (req.session && req.session.user) {
            userId = req.session.user._id;
            name = name || req.session.user.name || "Registered Candidate";
            email = email || req.session.user.email || "";
        }

        if (!name) name = "Assessment Candidate";

        let cleanCompanyName = (companyName || "").trim();
        if (!cleanCompanyName || cleanCompanyName === "undefined" || cleanCompanyName === "null") {
            cleanCompanyName = "General";
        }

        let aiAnalysis = "";
        if (incidentType === "Tab Switch") {
            aiAnalysis = "High Severity: Candidate switched windows or tabs during test, enabling external lookup.";
        } else if (incidentType === "Copy Action") {
            aiAnalysis = "Medium Severity: Candidate attempted to copy test questions or options.";
        } else if (incidentType === "Screenshot Attempt") {
            aiAnalysis = "High Severity: Candidate attempted screen capture shortcut to save exam material.";
        } else if (incidentType === "Exit Fullscreen") {
            aiAnalysis = "Medium Severity: Candidate exited forced fullscreen mode.";
        } else {
            aiAnalysis = "Proctor Alert: Security boundary event recorded during assessment.";
        }

        const logData = {
            testType: testType || "Aptitude",
            incidentType: incidentType || "Proctor Alert",
            details: details || "Security Boundary Alert",
            aiAnalysis,
            companyName: cleanCompanyName,
            snapshotImage: snapshotImage || "",
            candidateName: name,
            candidateEmail: email
        };

        if (userId) {
            logData.userId = userId;
        }

        const log = await CheatingLog.create(logData);
        res.json({ success: true, log });
    } catch (err) {
        console.error("Error logging cheating incident:", err);
        res.status(500).json({ error: "Failed to log proctoring incident" });
    }
};

// ==========================================
// AI MOCK INTERVIEW SIMULATOR & ATS SCANNER
// ==========================================
exports.showMockInterview = (req, res) => {
    renderView(res, "mock-interview.html");
};

// Start AI Mock Interview session with track questions & rich explanations
exports.startMockInterview = async (req, res) => {
    try {
        const { track } = req.body;
        const mockQuestions = {
            fullstack: [
                { 
                    id: "fs1", 
                    question: "Explain the Virtual DOM in React and how reconciliation optimizes re-renders.", 
                    expectedKeywords: ["virtual dom", "reconciliation", "diffing", "state", "props", "render"],
                    idealAnswer: "The Virtual DOM is an in-memory representation of the real DOM. When state or props change, React creates a new Virtual DOM tree, performs a fast diffing algorithm against the previous tree (Reconciliation), and batches only the minimum required changes to the real DOM.",
                    explanation: "Real DOM updates are expensive because browser layout calculations and repaints are slow. React avoids this by updating an in-memory JS tree (Virtual DOM) first, calculating the exact difference (diffing algorithm), and applying only the modified nodes to the DOM."
                },
                { 
                    id: "fs2", 
                    question: "How do Node.js Event Loop and non-blocking I/O operate under heavy concurrency?", 
                    expectedKeywords: ["event loop", "non-blocking", "call stack", "callback queue", "libuv", "async"],
                    idealAnswer: "Node.js runs on a single thread powered by the libuv library. Asynchronous I/O operations (file system, network calls) are offloaded to libuv thread pool or OS kernel. When completed, callbacks are pushed to the Event Queue and executed by the Event Loop when the main Call Stack is empty.",
                    explanation: "Instead of creating a thread per connection (which consumes high RAM), Node.js delegates I/O tasks asynchronously. The single-threaded Event Loop continuously polls the microtask/macrotask queues and pushes completed callbacks back onto the Call Stack."
                },
                { 
                    id: "fs3", 
                    question: "What is the difference between SQL indexes and NoSQL document sharding?", 
                    expectedKeywords: ["indexing", "b-tree", "sharding", "scalability", "nosql", "primary key"],
                    idealAnswer: "SQL indexes use data structures like B-Trees on table columns to speed up query retrieval without scanning entire tables. NoSQL document sharding is a horizontal partitioning technique that distributes database records across multiple server nodes for horizontal scalability.",
                    explanation: "Indexing optimizes search performance on a single database node by maintaining ordered pointers (B-Tree). Sharding scales databases horizontally across multiple machines by partitioning dataset keys across nodes."
                },
                { 
                    id: "fs4", 
                    question: "How do JWT authentication tokens differ from server-side session cookies in security?", 
                    expectedKeywords: ["jwt", "stateless", "cookies", "session", "httpOnly", "secret", "bearer"],
                    idealAnswer: "JWT is a stateless authentication token signed with a secret key that contains encoded user payloads. Server-side session cookies store session state in server memory or database (like Redis) and send a session ID cookie with every request.",
                    explanation: "JWTs eliminate server-side session storage lookups, making them ideal for distributed microservices. However, JWTs cannot be invalidated server-side before expiration unless paired with a token blacklist or short TTLs."
                },
                { 
                    id: "fs5", 
                    question: "Explain RESTful API design principles and HTTP status codes for creation vs validation errors.", 
                    expectedKeywords: ["rest", "stateless", "201", "400", "422", "endpoint", "json"],
                    idealAnswer: "RESTful APIs use standard HTTP verbs (GET, POST, PUT, DELETE) on noun-based URI resources. HTTP 201 Created signifies successful resource creation, HTTP 400 Bad Request indicates malformed requests, and HTTP 422 Unprocessable Entity denotes validation errors.",
                    explanation: "REST guidelines enforce client-server separation and stateless communication. Using uniform HTTP status codes ensures standardized API response handling for frontend clients."
                }
            ],
            python: [
                { 
                    id: "py1", 
                    question: "Explain Python Decorators and give a practical use case like logging or auth.", 
                    expectedKeywords: ["decorator", "wrapper", "first-class function", "kwargs", "args"],
                    idealAnswer: "A Python decorator is a design pattern used to extend or modify the behavior of a function or method without altering its source code. Decorators take a function as an argument, wrap it with extra functionality (like authentication or execution timing), and return the wrapped function.",
                    explanation: "Functions in Python are first-class objects. Decorators use `@decorator_name` syntax to wrap execution logic cleanly, making code DRY and modular for middleware, permission checks, and logging."
                },
                { 
                    id: "py2", 
                    question: "What is the Global Interpreter Lock (GIL) in CPython and how does it affect multi-threading?", 
                    expectedKeywords: ["gil", "cpython", "thread", "multiprocessing", "cpu-bound", "concurrency"],
                    idealAnswer: "The GIL is a mutex lock in CPython that allows only one native thread to execute Python bytecode at a time. It prevents race conditions in memory management but limits CPU-bound multi-threading. For CPU-intensive tasks, multiprocessing or C-extensions are used instead.",
                    explanation: "Because memory management in CPython is not thread-safe (reference counting), GIL ensures atomic operations. I/O-bound tasks still benefit from threading because the GIL is released during socket/file I/O wait periods."
                },
                { 
                    id: "py3", 
                    question: "How do Generators and the yield keyword optimize memory in Python processing?", 
                    expectedKeywords: ["generator", "yield", "memory", "iterator", "lazy evaluation"],
                    idealAnswer: "Generators are iterators defined using functions containing the `yield` keyword. Unlike lists that store all elements in RAM simultaneously, generators produce values one at a time on demand (lazy evaluation), reducing memory footprint to O(1).",
                    explanation: "When a generator function encounters `yield`, it pauses execution and returns the current value, preserving the stack state until `.next()` is called again."
                },
                { 
                    id: "py4", 
                    question: "Explain deep copy vs shallow copy in Python data structures.", 
                    expectedKeywords: ["copy", "deepcopy", "reference", "mutable", "object"],
                    idealAnswer: "A shallow copy (`copy.copy()`) creates a new container object but inserts references to the nested objects of the original. A deep copy (`copy.deepcopy()`) recursively constructs a brand new copy of the container and all nested objects inside it.",
                    explanation: "Modifying nested mutable elements (like list of lists) in a shallow copy will mutate the original structure, whereas a deep copy completely decouples the memory addresses."
                },
                { 
                    id: "py5", 
                    question: "What is Django ORM and how do select_related and prefetch_related solve N+1 query problems?", 
                    expectedKeywords: ["orm", "n+1", "select_related", "prefetch_related", "join", "query"],
                    idealAnswer: "The N+1 query problem occurs when fetching a list of parent records triggers N additional queries for each related child record. `select_related` performs a SQL JOIN for single-valued relationships (ForeignKey), while `prefetch_related` performs separate queries and joins them in Python for multi-valued relationships (ManyToMany).",
                    explanation: "Using `select_related` reduces total DB roundtrips from N+1 down to 1 single JOIN query, dramatically optimizing database latency."
                }
            ],
            data: [
                { 
                    id: "da1", 
                    question: "Explain the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN in SQL.", 
                    expectedKeywords: ["join", "inner", "left", "null", "matching", "table"],
                    idealAnswer: "INNER JOIN returns only matching records present in both tables. LEFT JOIN returns all records from the left table and matched records from the right table (filling non-matches with NULL). FULL OUTER JOIN returns all records when there is a match in either left or right table.",
                    explanation: "JOINs combine columns from one or more tables based on related keys. Use INNER JOIN for strict intersections, LEFT JOIN to preserve base dataset rows, and FULL OUTER JOIN for complete set unions."
                },
                { 
                    id: "da2", 
                    question: "How do Pandas groupby and aggregate functions work when cleaning missing dataset values?", 
                    expectedKeywords: ["pandas", "groupby", "fillna", "dropna", "aggregate", "dataframe"],
                    idealAnswer: "Pandas `groupby()` splits data into subset groups based on keys, applies transformations or aggregations (like mean/median), and combines the results. Missing values (NaN) can be cleaned using `fillna(df.groupby('category').transform('median'))` or `dropna()`.",
                    explanation: "Cleaning data by category-specific imputation (e.g. filling missing salary by job role median) avoids biasing dataset metrics compared to global mean filling."
                },
                { 
                    id: "da3", 
                    question: "What is the difference between Mean, Median, Mode, and Standard Deviation in dataset distributions?", 
                    expectedKeywords: ["mean", "median", "std dev", "outliers", "skewness", "distribution"],
                    idealAnswer: "Mean is the mathematical average (sensitive to extreme outliers). Median is the 50th percentile midpoint (robust to outliers). Mode is the most frequent value. Standard Deviation measures data dispersion and spread around the mean.",
                    explanation: "In skewed distributions (e.g. income data), median is preferred over mean because extreme values distort the average away from central tendency."
                },
                { 
                    id: "da4", 
                    question: "Explain CTEs (Common Table Expressions) vs Subqueries in SQL performance optimization.", 
                    expectedKeywords: ["cte", "with", "subquery", "readability", "execution plan"],
                    idealAnswer: "A CTE is defined using the `WITH` clause to create a temporary named result set accessible within the main query. CTEs improve query readability, modularity, and recursive query handling compared to nested subqueries.",
                    explanation: "Modern SQL optimizers execute CTEs and subqueries similarly, but CTEs allow self-referencing recursive logic (e.g. organizational hierarchy trees) and cleaner code structure."
                },
                { 
                    id: "da5", 
                    question: "What is A/B testing and how do p-values determine statistical significance in business metrics?", 
                    expectedKeywords: ["a/b test", "p-value", "hypothesis", "null hypothesis", "significance", "conversion"],
                    idealAnswer: "A/B testing compares two versions (Control A vs Variant B) to measure conversion changes. The p-value measures the probability that the observed result occurred by random chance. A p-value < 0.05 rejects the null hypothesis and confirms statistical significance.",
                    explanation: "Ensuring statistical significance guarantees that a product change (e.g. new checkout UI) drives genuine user behavior improvements rather than random sampling noise."
                }
            ],
            core_cs: [
                { 
                    id: "cs1", 
                    question: "Explain the 4 fundamental principles of Object-Oriented Programming (OOPs).", 
                    expectedKeywords: ["encapsulation", "abstraction", "inheritance", "polymorphism", "class", "object"],
                    idealAnswer: "The 4 OOP principles are: 1. Encapsulation (bundling data and methods with private access), 2. Abstraction (hiding implementation complexity behind simple interfaces), 3. Inheritance (reusing parent class properties), and 4. Polymorphism (allowing objects to take multiple forms via method overriding/overloading).",
                    explanation: "OOP structure promotes code reuse, maintainability, and security by restricting direct attribute access and providing modular design patterns."
                },
                { 
                    id: "cs2", 
                    question: "What is Process vs Thread and how does context switching overhead differ?", 
                    expectedKeywords: ["process", "thread", "memory space", "context switch", "overhead", "cpu"],
                    idealAnswer: "A Process is an independent executing program with its own isolated memory address space. A Thread is a lightweight unit of execution within a process that shares memory with sibling threads. Context switching between processes incurs heavy CPU overhead due to virtual memory page table switching, whereas thread context switching is significantly faster.",
                    explanation: "Because threads within the same process share heap memory and file descriptors, switching between them only saves registers and stack pointers."
                },
                { 
                    id: "cs3", 
                    question: "Explain ACID properties in Relational Database Management Systems.", 
                    expectedKeywords: ["atomicity", "consistency", "isolation", "durability", "transaction", "commit"],
                    idealAnswer: "ACID properties ensure database transaction reliability: Atomicity (all operations complete or all rollback), Consistency (data obeys constraints before and after transaction), Isolation (concurrent transactions execute independently without interference), and Durability (committed data persists permanently even during crash).",
                    explanation: "ACID guarantees data integrity during bank transfers and financial transactions, preventing double-spending or partial state updates."
                },
                { 
                    id: "cs4", 
                    question: "How does the TCP 3-Way Handshake establish a reliable connection?", 
                    expectedKeywords: ["syn", "syn-ack", "ack", "tcp", "handshake", "connection"],
                    idealAnswer: "The TCP 3-Way Handshake establishes connection via: 1. Client sends SYN (Synchronize sequence number) packet to server, 2. Server responds with SYN-ACK (Synchronize-Acknowledge), 3. Client replies with ACK (Acknowledge). Both endpoints now synchronize sequence numbers and establish full-duplex communication.",
                    explanation: "Unlike connectionless UDP, TCP handshake ensures sequence synchronization and buffer allocation before transmitting application payload data."
                },
                { 
                    id: "cs5", 
                    question: "What is a Deadlock in OS and what are the 4 necessary conditions for a deadlock?", 
                    expectedKeywords: ["deadlock", "mutual exclusion", "hold and wait", "no preemption", "circular wait"],
                    idealAnswer: "A Deadlock occurs when set of processes are blocked because each holds a resource while waiting for another resource held by another process. The 4 Coffman conditions are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.",
                    explanation: "Breaking any one of the 4 conditions (e.g., using Banker's algorithm or resource ordering) prevents deadlocks from occurring."
                }
            ],
            hr: [
                { 
                    id: "hr1", 
                    question: "Tell me about yourself, your technical background, and what drives your career goals.", 
                    expectedKeywords: ["background", "projects", "skills", "passion", "career", "goals"],
                    idealAnswer: "Structure your response in 90 seconds using Present-Past-Future format: Summarize your current engineering specialization and technical skills, highlight 1-2 key project wins or internship contributions, and state how your career goals align with this role.",
                    explanation: "Keep your response concise, professional, and tailored to software engineering. Focus on technical problem-solving, hands-on project experience, and enthusiasm for continuous learning."
                },
                { 
                    id: "hr2", 
                    question: "Describe a situation where you faced a tough technical bug or project deadline. How did you handle it?", 
                    expectedKeywords: ["problem", "action", "result", "teamwork", "deadline", "solution"],
                    idealAnswer: "Use the STAR method (Situation, Task, Action, Result). State the technical bottleneck, describe your debugging approach (log analysis, root cause diagnosis, or refactoring), explain your collaboration with team members, and end with the positive outcome.",
                    explanation: "Interviewers evaluate your resilience and systematic problem-solving under pressure. Allocate 70% of your time to the Action steps you took to diagnose and resolve the issue."
                },
                { 
                    id: "hr3", 
                    question: "What are your greatest technical strengths and one area you are actively improving?", 
                    expectedKeywords: ["strengths", "improvement", "learning", "growth", "practice"],
                    idealAnswer: "State 1-2 core technical strengths backed by examples (e.g. system design, rapid debugging). For improvement, pick a genuine technical skill you are currently mastering (e.g. Docker containerization or Kubernetes) and outline the steps you take to learn it.",
                    explanation: "Avoid cliché weaknesses like 'I work too hard'. Instead, show self-awareness and proactive learning by describing a real technical skill you are expanding through projects or courses."
                },
                { 
                    id: "hr4", 
                    question: "Why do you want to join our organization and where do you see yourself in 3 years?", 
                    expectedKeywords: ["company", "values", "growth", "contribution", "leadership"],
                    idealAnswer: "Connect your career aspiration to the company's tech stack, culture, and products. Explain that in 3 years, you aim to grow into a senior technical contributor or module lead taking ownership of critical engineering projects.",
                    explanation: "Demonstrate that you have researched the company's mission and engineering accomplishments, showing long-term commitment and growth potential."
                },
                { 
                    id: "hr5", 
                    question: "How do you handle disagreement with a team member or project lead on technical decisions?", 
                    expectedKeywords: ["communication", "listen", "data", "consensus", "respect", "compromise"],
                    idealAnswer: "I listen respectfully to understand their architectural perspective, present data-driven benchmarks or documentation supporting my approach, and collaborate to find the optimal trade-off. Once a decision is finalized by the lead, I fully commit to executing it.",
                    explanation: "Professional maturity means setting ego aside, relying on data and benchmarks, and committing to team decisions to deliver high-quality software."
                }
            ]
        };

        const questions = mockQuestions[track] || mockQuestions.fullstack;
        res.json({ track, questions });
    } catch (err) {
        console.error("startMockInterview Error:", err);
        res.status(500).json({ error: "Failed to start mock interview" });
    }
};

// Evaluate candidate's text/speech response with AI grading logic & rich explanation
exports.evaluateMockAnswer = async (req, res) => {
    try {
        const { questionId, questionText, expectedKeywords = [], candidateAnswer } = req.body;
        const textLower = candidateAnswer.toLowerCase();

        const matchedKeywords = [];
        const missingKeywords = [];

        expectedKeywords.forEach(kw => {
            if (textLower.includes(kw.toLowerCase())) {
                matchedKeywords.push(kw);
            } else {
                missingKeywords.push(kw);
            }
        });

        const keywordCoveragePct = expectedKeywords.length > 0
            ? Math.round((matchedKeywords.length / expectedKeywords.length) * 100)
            : 75;

        // Word count & confidence estimation
        const wordCount = candidateAnswer.trim().split(/\s+/).length;
        let confidenceScore = 60;
        if (wordCount >= 25) confidenceScore += 20;
        if (wordCount >= 50) confidenceScore += 15;
        if (matchedKeywords.length >= 3) confidenceScore += 5;
        confidenceScore = Math.min(100, confidenceScore);

        const technicalAccuracy = Math.min(100, Math.max(35, keywordCoveragePct));

        let feedback = "";
        if (technicalAccuracy >= 80) {
            feedback = "Outstanding response! You effectively covered essential technical concepts with strong clarity and keyword depth.";
        } else if (technicalAccuracy >= 60) {
            feedback = "Good answer. You communicated core concepts well, but try incorporating more specific industry keywords to demonstrate deeper technical mastery.";
        } else {
            feedback = "Basic response. Be sure to elaborate further with precise technical terms such as: " + (missingKeywords.slice(0, 3).join(", ") || "core principles");
        }

        res.json({
            questionId,
            questionText,
            candidateAnswer,
            accuracy: technicalAccuracy,
            confidence: confidenceScore,
            matchedKeywords,
            missingKeywords,
            feedback
        });
    } catch (err) {
        console.error("evaluateMockAnswer Error:", err);
        res.status(500).json({ error: "Failed to evaluate answer" });
    }
};

// ATS Resume Scanner & Keyword Optimizer
exports.analyzeATSResume = async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ message: "Login required" });

        const user = await User.findById(req.session.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Require active resume uploaded or built
        if (!user.resume && (!user.resumeBuffer || user.resumeBuffer.length === 0)) {
            return res.status(400).json({
                message: "No active resume found! Please upload a PDF resume or click '⚡ Build PDF Resume' first before running the ATS scan."
            });
        }

        const { role = "fullstack" } = req.body;

        let resumeText = `${user.name || ''} ${user.email || ''} ${user.branch || ''} ${user.skills || ''}`;

        // If stored PDF buffer exists, extract raw text using pdf-parse
        if (user.resumeBuffer && user.resumeBuffer.length > 0) {
            try {
                const pdfParse = require("pdf-parse");
                const parsed = await pdfParse(user.resumeBuffer);
                if (parsed && parsed.text) {
                    resumeText += " " + parsed.text;
                }
            } catch (pErr) {
                console.warn("PDF parse fallback warning:", pErr.message);
            }
        }

        const resumeLower = resumeText.toLowerCase();

        const roleKeywordsMap = {
            fullstack: ["react", "javascript", "node", "express", "sql", "mongodb", "git", "rest api", "html", "css", "data structures"],
            python: ["python", "django", "flask", "sql", "oops", "data structures", "git", "api", "postgres", "linux"],
            data: ["sql", "python", "pandas", "excel", "statistics", "tableau", "powerbi", "data cleaning", "numpy", "queries"],
            core: ["oops", "dbms", "sql", "operating systems", "networking", "c++", "java", "data structures", "git", "algorithms"]
        };

        const targetKeywords = roleKeywordsMap[role] || roleKeywordsMap.fullstack;
        const matched = [];
        const missing = [];

        targetKeywords.forEach(kw => {
            if (resumeLower.includes(kw.toLowerCase())) {
                matched.push(kw.toUpperCase());
            } else {
                missing.push(kw.toUpperCase());
            }
        });

        const matchPct = Math.round((matched.length / targetKeywords.length) * 100);

        let bonus = 0;
        if (user.linkedin && user.linkedin.trim() !== "") bonus += 5;
        if (user.github && user.github.trim() !== "") bonus += 5;
        if (user.projects && user.projects.length > 0) bonus += 10;
        if (user.cgpa && Number(user.cgpa) >= 7.5) bonus += 5;

        const score = Math.min(100, Math.max(30, matchPct + bonus));

        let grade = "C";
        if (score >= 85) grade = "A+";
        else if (score >= 75) grade = "A";
        else if (score >= 60) grade = "B";

        const recommendations = [];
        if (missing.length > 0) {
            recommendations.push(`Include target keywords like: <b>${missing.slice(0, 4).join(", ")}</b> in your skills or project descriptions.`);
        }
        if (!user.linkedin) recommendations.push("Add a professional LinkedIn profile URL to boost recruiter contactability.");
        if (!user.github) recommendations.push("Add a GitHub profile link to showcase repository contributions.");
        recommendations.push("Ensure clean standard section titles: Education, Skills, Technical Projects, Experience.");
        recommendations.push("Use action verbs (e.g. Developed, Architected, Optimized) for project bullet points.");

        res.json({
            score,
            grade,
            matched,
            missing,
            recommendations
        });
    } catch (err) {
        console.error("analyzeATSResume Error:", err);
        res.status(500).json({ message: "Failed to perform ATS resume scan." });
    }
};
