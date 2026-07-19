const path = require("path");
const fs   = require("fs");
const PDFDocument = require("pdfkit");

const { uploadFile } = require("../../database/config/cloudinary");

const User = require("../../database/models/User");
const Result = require("../../database/models/result");
const Company = require("../../database/models/Company");
const Application = require("../../database/models/Application");
const Notification = require("../../database/models/Notification");
const ExamSettings = require("../../database/models/ExamSettings");
const Question = require("../../database/models/Question");
const TechnicalQuestion = require("../../database/models/TechnicalQuestion");

// ==========================================
// VIEW PAGES
// ==========================================
exports.showDashboard = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "dashboard.html"));
};

exports.showProfile = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "profile.html"));
};

exports.showResume = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "resume.html"));
};

exports.showAptitude = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "aptitude.html"));
};

exports.showTechnical = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "technical.html"));
};

exports.showCareerGuide = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "career-guide.html"));
};

exports.showLeaderboard = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "leaderboard.html"));
};

exports.showPlacementDrives = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "placement-drives.html"));
};

exports.showHistory = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "history.html"));
};

exports.showMyApplications = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "my-applications.html"));
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
exports.uploadResume = async (req, res) => {
    try {
        if (!req.session.user) return res.redirect('/login');
        if (!req.file) return res.status(400).send("No PDF file received.");

        const user = await User.findById(req.session.user._id);
        if (!user) return res.status(404).send("User not found");

        // Upload PDF buffer directly via our fallback utility
        const resumeUrl = await uploadFile(
            req.file.buffer,
            'resumes',
            req.file.originalname,
            'raw'
        );

        user.resume = resumeUrl;
        await user.save();

        await Notification.create({
            userId: user._id,
            title: "Resume Uploaded",
            message: "Your resume has been uploaded successfully."
        });

        req.session.user.resume = user.resume;
        res.redirect('/resume');
    } catch (err) {
        console.error("Resume upload error:", err);
        res.status(500).send("Resume Upload Failed: " + err.message);
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
        const user = await User.findById(req.session.user._id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const uploadDir = path.join(__dirname, "../../frontend/public/uploads/resumes");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
        const filename = "resume-" + user._id + "-" + Date.now() + ".pdf";
        const filepath = path.join(uploadDir, filename);

        const writeStream = fs.createWriteStream(filepath);
        doc.pipe(writeStream);

        // Premium Color Palette Randomizer (different UI/UX look every time!)
        const palettes = [
            { primary: "#1e3a8a", secondary: "#475569", accent: "#2563eb" }, // Executive Navy
            { primary: "#0f766e", secondary: "#4b5563", accent: "#0d9488" }, // Modern Teal
            { primary: "#1e293b", secondary: "#64748b", accent: "#6366f1" }, // Charcoal Indigo
            { primary: "#065f46", secondary: "#475569", accent: "#059669" }, // Emerald Prestige
            { primary: "#7f1d1d", secondary: "#52525b", accent: "#dc2626" }  // Crimson Burgundy
        ];
        const theme = palettes[Math.floor(Math.random() * palettes.length)];
        const textColor = "#1e293b"; // Rich body text

        // Top decorative header accent bar
        doc.rect(0, 0, 612, 16).fill(theme.primary);

        // Candidate Name (Left aligned, premium title)
        doc.fillColor(theme.primary)
           .font("Helvetica-Bold")
           .fontSize(22)
           .text((user.name || "Student Name").toUpperCase(), 40, 36);

        // Subtitle (Candidate profile branch)
        doc.fillColor(theme.secondary)
           .font("Helvetica-Bold")
           .fontSize(10)
           .text((user.branch || "Software Engineering Student").toUpperCase(), 40, doc.y + 2);

        // Header bottom divider line
        doc.moveDown(0.8);
        doc.strokeColor("#cbd5e1")
           .lineWidth(1)
           .moveTo(40, doc.y)
           .lineTo(572, doc.y)
           .stroke();
        
        const startY = doc.y + 16;

        // ==========================================
        // LEFT COLUMN (X = 40, Width = 150)
        // ==========================================
        let leftY = startY;

        // Section 1: Contact
        doc.fillColor(theme.primary)
           .font("Helvetica-Bold")
           .fontSize(10)
           .text("CONTACT DETAILS", 40, leftY, { characterSpacing: 0.5 });
        
        leftY = doc.y + 6;
        doc.fillColor(textColor).font("Helvetica").fontSize(8.5);
        doc.text(`Email: ${user.email}`, 40, leftY, { width: 155 });
        leftY = doc.y + 4;
        doc.text(`Phone: ${user.phone || 'N/A'}`, 40, leftY, { width: 155 });
        leftY = doc.y + 4;
        doc.text(`LinkedIn: ${user.linkedin || 'N/A'}`, 40, leftY, { width: 155 });
        leftY = doc.y + 4;
        doc.text(`GitHub: ${user.github || 'N/A'}`, 40, leftY, { width: 155 });
        
        leftY = doc.y + 16;

        // Section 2: Education
        doc.fillColor(theme.primary)
           .font("Helvetica-Bold")
           .fontSize(10)
           .text("ACADEMIC METRICS", 40, leftY, { characterSpacing: 0.5 });
        
        leftY = doc.y + 6;
        doc.fillColor(textColor).font("Helvetica-Bold").fontSize(9).text(user.branch || 'Engineering', 40, leftY, { width: 150 });
        leftY = doc.y + 2;
        doc.font("Helvetica").fontSize(8.5).text(`Semester ${user.semester || 'N/A'}`, 40, leftY);
        leftY = doc.y + 2;
        doc.text(`Current CGPA: ${user.cgpa ? user.cgpa + ' / 10.0' : 'N/A'}`, 40, leftY);
        
        leftY = doc.y + 16;

        // Section 3: Tools & Platforms
        doc.fillColor(theme.primary)
           .font("Helvetica-Bold")
           .fontSize(10)
           .text("PLATFORMS & TOOLS", 40, leftY, { characterSpacing: 0.5 });
        
        leftY = doc.y + 6;
        doc.fillColor(textColor).font("Helvetica").fontSize(8.5);
        
        const branchToolsMap = {
            "computer": ["VS Code", "Git / GitHub", "Docker", "Postman", "MongoDB Compass"],
            "information": ["VS Code", "Git / GitHub", "Docker", "Postman", "MongoDB Compass"],
            "electronics": ["MATLAB", "Simulink", "Keil uVision", "Proteus", "Arduino IDE"],
            "mechanical": ["AutoCAD", "SolidWorks", "CATIA", "ANSYS", "Fusion 360"],
            "civil": ["Revit", "STAAD Pro", "AutoCAD", "SAP2000", "ArcGIS"],
            "electrical": ["MATLAB", "Simulink", "ETAP", "PSPICE", "Proteus"]
        };
        const branchLower = (user.branch || "").toLowerCase();
        let toolsList = ["Git", "VS Code", "Office Suit"];
        for (const [key, list] of Object.entries(branchToolsMap)) {
            if (branchLower.includes(key)) {
                toolsList = list;
                break;
            }
        }
        toolsList.forEach(tool => {
            doc.text(`  - ${tool}`, 40, leftY);
            leftY = doc.y + 2;
        });

        // ==========================================
        // VERTICAL SEPARATOR LINE
        // ==========================================
        const lineEndY = Math.max(leftY, 730);
        doc.strokeColor("#e2e8f0")
           .lineWidth(1)
           .moveTo(205, startY)
           .lineTo(205, lineEndY)
           .stroke();

        // ==========================================
        // RIGHT COLUMN (X = 220, Width = 352)
        // ==========================================
        let rightY = startY;

        // Section 1: Technical Skills
        doc.fillColor(theme.primary)
           .font("Helvetica-Bold")
           .fontSize(10)
           .text("TECHNICAL EXPERTISE & SKILLS", 220, rightY, { characterSpacing: 0.5 });
        
        rightY = doc.y + 6;
        doc.fillColor(textColor).font("Helvetica").fontSize(8.5);

        if (user.skills && user.skills.trim() !== "") {
            const skillList = user.skills.split(',').map(s => s.trim());
            skillList.forEach(skill => {
                const desc = getSkillDescription(skill);
                doc.fillColor(theme.accent)
                   .font("Helvetica-Bold")
                   .fontSize(9)
                   .text("  > ", 220, rightY, { continued: true })
                   .fillColor(textColor)
                   .text(`${skill}: `, { continued: true })
                   .font("Helvetica")
                   .fillColor(theme.secondary)
                   .text(desc, { width: 330 });
                rightY = doc.y + 4;
            });
        } else {
            doc.text("No technical expertise details added to profile registry.", 220, rightY);
            rightY = doc.y + 12;
        }

        rightY += 12;

        // Section 2: Key Engineering Projects
        doc.fillColor(theme.primary)
           .font("Helvetica-Bold")
           .fontSize(10)
           .text("KEY ENGINEERING PROJECTS", 220, rightY, { characterSpacing: 0.5 });
        
        rightY = doc.y + 6;

        // Project 1
        doc.fillColor(textColor)
           .font("Helvetica-Bold")
           .fontSize(10)
           .text("AI Placement Preparation & Recruitment Portal", 220, rightY);
        
        rightY = doc.y + 2;
        doc.font("Helvetica")
           .fontSize(8.5)
           .fillColor(theme.secondary)
           .text("- Developed a web application for student placement preparation, testing, and recruitment drives.", 220, rightY, { width: 340 });
        rightY = doc.y + 2;
        doc.text("- Configured REST routes, MVC controllers, secure authentication middleware, and database schemas.", 220, rightY, { width: 340 });
        rightY = doc.y + 2;
        doc.text("- Integrated responsive theme overrides for desktop, tablet, and mobile browsers.", 220, rightY, { width: 340 });
        rightY = doc.y + 2;
        doc.text("- Technologies: Node.js, Express, MongoDB, HTML, CSS, JavaScript.", 220, rightY, { width: 340 });

        rightY = doc.y + 10;

        // Project 2
        doc.fillColor(textColor)
           .font("Helvetica-Bold")
           .fontSize(10)
           .text("Interactive Online Code Assessment Platform", 220, rightY);
        
        rightY = doc.y + 2;
        doc.font("Helvetica")
           .fontSize(8.5)
           .fillColor(theme.secondary)
           .text("- Built dynamic quiz and testing modules with timed engines and visual grading analytics.", 220, rightY, { width: 340 });
        rightY = doc.y + 2;
        doc.text("- Programmed responsive candidate consoles mapping TCS iON exam layouts.", 220, rightY, { width: 340 });

        doc.end();

        writeStream.on('finish', async () => {
            user.resume = `/uploads/resumes/${filename}`;
            await user.save();

            await Notification.create({
                userId: user._id,
                title: "Resume Built Successfully",
                message: "A professional PDF resume was automatically built from your profile."
            });

            req.session.user.resume = user.resume;
            res.json({ success: true, filename: user.resume });
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

        // Fetch actual companies applied count from the Application model
        const companiesAppliedCount = await Application.countDocuments({ userId: user._id });

        res.json({
            ...user.toObject(),
            profileCompletion,
            companiesApplied: companiesAppliedCount
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Error");
    }
};
