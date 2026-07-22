const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const XLSX = require("xlsx");
const ExcelJS = require("exceljs");

const Admin = require("../../database/models/Admin");
const User = require("../../database/models/User");
const Question = require("../../database/models/Question");
const TechnicalQuestion = require("../../database/models/TechnicalQuestion");
const Result = require("../../database/models/result");
const Notification = require("../../database/models/Notification");
const Company = require("../../database/models/Company");
const Application = require("../../database/models/Application");
const ExamSettings = require("../../database/models/ExamSettings");
const AdminRequest = require("../../database/models/AdminRequest");
const CheatingLog = require("../../database/models/CheatingLog");

// ==========================================
// VIEW PAGES
// ==========================================
exports.showAdminLogin = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "admin-login.html"));
};

exports.showAdminDashboard = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "admin-dashboard.html"));
};

exports.showManageAdmins = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "manage-admins.html"));
};

exports.showStudents = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "students.html"));
};

exports.showManageQuestions = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "add-question.html"));
};

exports.showAddQuestion = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "add-question.html"));
};

exports.showImportQuestions = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "import-questions.html"));
};

exports.showAddCompany = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "add-company.html"));
};

exports.showManageCompanies = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "manage-companies.html"));
};

exports.showResults = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "results.html"));
};

exports.showApplications = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "applications.html"));
};

exports.showUpdateStatus = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "update-status.html"));
};

// ==========================================
// API / DATA
// ==========================================

// Authenticated current admin profile details
exports.getCurrentAdmin = (req, res) => {
    if (!req.session.admin) {
        return res.status(401).json({ error: "Admin authentication required" });
    }
    res.json({
        _id: req.session.admin._id,
        username: req.session.admin.username,
        role: req.session.admin.role,
        companyName: req.session.admin.companyName || ""
    });
};

// Get list of all administrators
exports.getAdminsData = async (req, res) => {
    try {
        const admins = await Admin.find({}, { password: 0 });
        res.json(admins);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
};

// Get list of all student registrations
exports.getStudentsData = async (req, res) => {
    try {
        const students = await User.find();
        res.json(students);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error");
    }
};

// Get global quiz settings config
exports.getExamSettings = async (req, res) => {
    try {
        const settings = await ExamSettings.findOne({ examType: req.params.type });
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
};

// Get list of questions (paginated in views)
exports.getQuestionsList = async (req, res) => {
    try {
        let filter = {};
        if (req.session.admin.role === "admin") {
            const co = req.session.admin.companyName;
            filter = co === "General" 
                ? { $or: [{ companyName: "General" }, { companyName: { $exists: false } }, { companyName: "" }] }
                : { companyName: co };
        } else {
            if (req.query.company) {
                const co = req.query.company;
                filter = co === "General" 
                    ? { $or: [{ companyName: "General" }, { companyName: { $exists: false } }, { companyName: "" }] }
                    : { companyName: co };
            }
        }

        if (req.params.type === "aptitude") {
            const list = await Question.find(filter);
            res.json(list);
        } else {
            const list = await TechnicalQuestion.find(filter);
            res.json(list);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
};

// Get analytical performance summaries for dashboard analytics
exports.getAdminAnalytics = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.status(401).send("Login First");
        }

        const isSuper = req.session.admin.role === "superadmin";
        const companyName = req.session.admin.companyName;

        let totalStudents;
        let totalCompanies;
        let totalApplications;
        let totalTests = 0;
        let averageScore = 0;

        if (isSuper) {
            totalStudents = await User.countDocuments();
            totalCompanies = await Company.countDocuments();
            totalApplications = await Application.countDocuments();
            const users = await User.find();
            let totalScore = 0;
            users.forEach(user => {
                totalTests += user.testsTaken || 0;
                totalScore += user.averageScore || 0;
            });
            averageScore = users.length > 0 ? Math.round(totalScore / users.length) : 0;
        } else {
            // Filtered by company name
            const myCompanies = await Company.find({ companyName });
            const myCompanyIds = myCompanies.map(c => c._id);
            totalCompanies = myCompanies.length;
            totalApplications = await Application.countDocuments({ companyId: { $in: myCompanyIds } });
            
            // Students who applied to this company's drives
            const appliedUserIds = await Application.distinct('userId', { companyId: { $in: myCompanyIds } });
            totalStudents = appliedUserIds.length;

            const results = await Result.find({ companyName });
            totalTests = results.length;
            let totalScore = 0;
            results.forEach(r => {
                totalScore += r.percentage || 0;
            });
            averageScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;
        }

        res.json({
            totalStudents,
            totalCompanies,
            totalApplications,
            totalTests,
            averageScore
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Error");
    }
};

// Get all applications list
exports.getApplicationsData = async (req, res) => {
    try {
        let query = {};
        if (req.session.admin && req.session.admin.role !== "superadmin") {
            const companyName = req.session.admin.companyName;
            const myCompanies = await Company.find({ companyName });
            const myCompanyIds = myCompanies.map(c => c._id);
            query = { companyId: { $in: myCompanyIds } };
        }
        const applications = await Application.find(query)
            .populate('userId')
            .populate('companyId');
        res.json(applications);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error");
    }
};

// Get all student results list
exports.getResultsData = async (req, res) => {
    try {
        let query = {};
        if (req.session.admin && req.session.admin.role !== "superadmin") {
            query = { companyName: req.session.admin.companyName };
        }
        const results = await Result.find(query)
            .populate("userId")
            .sort({ createdAt: -1 });
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error");
    }
};

// Get recent job applications list
exports.getRecentActivity = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.status(401).send("Login First");
        }

        let query = {};
        if (req.session.admin.role !== "superadmin") {
            const companyName = req.session.admin.companyName;
            const myCompanies = await Company.find({ companyName });
            const myCompanyIds = myCompanies.map(c => c._id);
            query = { companyId: { $in: myCompanyIds } };
        }

        const activities = await Application.find(query)
            .populate('userId')
            .populate('companyId')
            .sort({ appliedAt: -1 })
            .limit(10);
        res.json(activities);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error");
    }
};

// Export student statistics as dynamic Excel sheets
exports.exportStudents = async (req, res) => {
    try {
        const students = await User.find();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Students");

        worksheet.columns = [
            { header: "Name", key: "name", width: 25 },
            { header: "Email", key: "email", width: 30 },
            { header: "Branch", key: "branch", width: 25 },
            { header: "Semester", key: "semester", width: 15 },
            { header: "Tests Taken", key: "testsTaken", width: 15 },
            { header: "Average Score", key: "averageScore", width: 20 }
        ];

        students.forEach(student => {
            worksheet.addRow({
                name: student.name,
                email: student.email,
                branch: student.branch,
                semester: student.semester,
                testsTaken: student.testsTaken,
                averageScore: student.averageScore + "%"
            });
        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="students.xlsx"'
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.log(err);
        res.status(500).send("Export Failed");
    }
};

// ==========================================
// POST WRITE ACTIONS
// ==========================================

// Authenticate Administrator login
exports.adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`[DEBUG - Admin Login] Attempting login. Username: "${username}", Password: "${password}"`);

        delete req.session.admin;

        const admin = await Admin.findOne({ username });
        if (!admin) {
            console.log(`[DEBUG - Admin Login] Admin NOT found in DB for: "${username}"`);
            return res.send("Admin Not Found");
        }

        console.log(`[DEBUG - Admin Login] Admin found in DB. Stored hash: ${admin.password}`);
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            console.log(`[DEBUG - Admin Login] Password mismatch for username: "${username}"`);
            return res.send("Wrong Password");
        }

        req.session.admin = {
            _id: admin._id,
            username: admin.username,
            role: admin.role,
            companyName: admin.companyName || ""
        };

        req.session.save((err) => {
            if (err) {
                console.error("[DEBUG - Admin Login] Session save failed:", err);
                return res.status(500).send("Session save failed.");
            }
            console.log(`[DEBUG - Admin Login] Session saved successfully for: "${username}"`);
            res.send("Success");
        });
    } catch (err) {
        console.log(err);
        res.send("Login Failed");
    }
};

// Add sub-admin profile
exports.addAdmin = async (req, res) => {
    try {
        const { username, password, role, companyName } = req.body;
        if (!username || !password || !role) {
            return res.status(400).send("All fields are required");
        }
        const existing = await Admin.findOne({ username });
        if (existing) {
            return res.status(400).send("Username already exists");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await Admin.create({
            username,
            password: hashedPassword,
            role,
            companyName: companyName || ""
        });
        res.send("Admin created successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to create admin");
    }
};

// Submit admin access request
exports.postAdminRequest = async (req, res) => {
    try {
        const { username, password, companyName, reason } = req.body;
        if (!username || !password || !companyName || !reason) {
            return res.status(400).send("All fields are required");
        }
        const existingRequest = await AdminRequest.findOne({ username, status: "pending" });
        const existingAdmin = await Admin.findOne({ username });
        if (existingRequest || existingAdmin) {
            return res.status(400).send("Username is already taken or pending request exists.");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await AdminRequest.create({
            username,
            password: hashedPassword,
            companyName,
            reason,
            status: "pending"
        });
        res.send("Success");
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to submit request");
    }
};

// Get list of all admin requests (superadmin only)
exports.getAdminRequests = async (req, res) => {
    try {
        const requests = await AdminRequest.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
};

// Approve access request (superadmin only)
exports.approveAdminRequest = async (req, res) => {
    try {
        const request = await AdminRequest.findById(req.params.id);
        if (!request || request.status !== "pending") {
            return res.status(400).send("Invalid or non-pending request");
        }
        
        const existingAdmin = await Admin.findOne({ username: request.username });
        if (existingAdmin) {
            request.status = "rejected";
            await request.save();
            return res.status(400).send("Admin username already exists. Request rejected.");
        }

        // Create the Admin account using the hashed password from the request
        await Admin.create({
            username: request.username,
            password: request.password,
            role: "admin",
            companyName: request.companyName
        });

        request.status = "approved";
        await request.save();
        res.send("Request Approved Successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error approving request");
    }
};

// Reject access request (superadmin only)
exports.rejectAdminRequest = async (req, res) => {
    try {
        const request = await AdminRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).send("Request not found");
        }
        request.status = "rejected";
        await request.save();
        res.send("Request Rejected Successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error rejecting request");
    }
};

// Add MCQ to database
exports.addQuestion = async (req, res) => {
    try {
        const { type, subject, question, options, answer, marks, companyName } = req.body;
        const adminCompany = req.session.admin.role === "admin" 
            ? req.session.admin.companyName 
            : (companyName || "General");

        if (type === "aptitude") {
            const newQuestion = new Question({
                question,
                options,
                answer,
                marks: Number(marks) || 1,
                companyName: adminCompany
            });
            await newQuestion.save();
        } else {
            const newQuestion = new TechnicalQuestion({
                subject,
                question,
                options,
                answer,
                marks: Number(marks) || 1,
                companyName: adminCompany
            });
            await newQuestion.save();
        }

        res.send("Question Added Successfully");
    } catch (err) {
        console.log(err);
        res.status(500).send("Error Adding Question");
    }
};

// Update quiz global settings configurations
exports.updateExamSettings = async (req, res) => {
    try {
        const { examName, duration } = req.body;
        await ExamSettings.findOneAndUpdate(
            { examType: req.params.type },
            { examName, duration: Number(duration) || 20 },
            { upsert: true, new: true }
        );
        res.send("Settings Saved Successfully ✅");
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to save settings");
    }
};

// Update existing aptitude MCQ
exports.updateQuestion = async (req, res) => {
    try {
        const { question, options, answer, marks } = req.body;
        const q = await Question.findById(req.params.id);
        if (!q) return res.status(404).send("Question not found");
        if (req.session.admin.role === "admin" && q.companyName !== req.session.admin.companyName) {
            return res.status(403).send("Unauthorized to modify this question");
        }

        q.question = question;
        q.options = options;
        q.answer = answer;
        q.marks = Number(marks) || 1;
        await q.save();

        res.send("Question Updated Successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to update question");
    }
};

// Update existing Technical coding MCQ
exports.updateTechnicalQuestion = async (req, res) => {
    try {
        const { subject, question, options, answer, marks } = req.body;
        const q = await TechnicalQuestion.findById(req.params.id);
        if (!q) return res.status(404).send("Question not found");
        if (req.session.admin.role === "admin" && q.companyName !== req.session.admin.companyName) {
            return res.status(403).send("Unauthorized to modify this question");
        }

        q.subject = subject;
        q.question = question;
        q.options = options;
        q.answer = answer;
        q.marks = Number(marks) || 1;
        await q.save();

        res.send("Question Updated Successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to update question");
    }
};

// Delete existing aptitude MCQ
exports.deleteQuestion = async (req, res) => {
    try {
        const q = await Question.findById(req.params.id);
        if (!q) return res.status(404).send("Question not found");
        if (req.session.admin.role === "admin" && q.companyName !== req.session.admin.companyName) {
            return res.status(403).send("Unauthorized to delete this question");
        }
        await Question.findByIdAndDelete(req.params.id);
        res.redirect('/manage-questions');
    } catch (err) {
        console.log(err);
        res.send("Error Deleting Question");
    }
};

// Delete existing Technical coding MCQ
exports.deleteTechnicalQuestion = async (req, res) => {
    try {
        const q = await TechnicalQuestion.findById(req.params.id);
        if (!q) return res.status(404).send("Question not found");
        if (req.session.admin.role === "admin" && q.companyName !== req.session.admin.companyName) {
            return res.status(403).send("Unauthorized to delete this question");
        }
        await TechnicalQuestion.findByIdAndDelete(req.params.id);
        res.redirect('/manage-questions');
    } catch (err) {
        console.log(err);
        res.send("Error Deleting Question");
    }
};

// Batch import MCQ questions via uploaded excel spreadsheets
exports.importQuestions = async (req, res) => {
    try {
        if (!req.file) {
            return res.send("Please select an Excel file.");
        }

        const adminCompany = req.session.admin.role === "admin" 
            ? req.session.admin.companyName 
            : "General";

        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        let imported = 0;
        let skipped = 0;

        for (const row of data) {
            const exists = await Question.findOne({
                question: row.Question
            });

            if (exists) {
                skipped++;
                continue;
            }

            await Question.create({
                question: row.Question,
                options: [
                    row["Option A"],
                    row["Option B"],
                    row["Option C"],
                    row["Option D"]
                ],
                answer: row.Answer,
                explanation: row.Explanation || "",
                topic: row.Topic || "General",
                difficulty: row.Difficulty || "Easy",
                companyName: adminCompany
            });
            imported++;
        }

        // Clean uploaded file from disk after parsing
        try {
            fs.unlinkSync(req.file.path);
        } catch (e) {
            console.error("Cleanup error:", e);
        }

        res.send(`
            <h2>Import Completed ✅</h2>
            <p>Imported: <b>${imported}</b></p>
            <p>Skipped (Duplicate): <b>${skipped}</b></p>
            <br>
            <a href="/admin-dashboard">Back to Dashboard</a>
        `);
    } catch (err) {
        console.log(err);
        res.status(500).send("Import Failed");
    }
};

// Add new placement drive target profile details
exports.addCompany = async (req, res) => {
    try {
        const {
            companyName,
            jobRole,
            package,
            location,
            eligibility,
            deadline
        } = req.body;

        let finalCompanyName = companyName;
        // Enforce company name if not superadmin
        if (req.session.admin && req.session.admin.role !== "superadmin") {
            finalCompanyName = req.session.admin.companyName;
        }

        const company = new Company({
            companyName: finalCompanyName,
            jobRole,
            package,
            location,
            eligibility,
            deadline
        });

        await company.save();
        res.send("Success");
    } catch (err) {
        console.log(err);
        res.status(500).send("Error Adding Company");
    }
};

// Update drive application status logs and trigger student logs notifications
exports.updateStatus = async (req, res) => {
    try {
        const { id, status } = req.body;
        const app = await Application.findById(id).populate('companyId');
        if (!app) {
            return res.status(404).send("Application not found");
        }

        // Verify ownership if not superadmin
        if (req.session.admin && req.session.admin.role !== "superadmin") {
            if (!app.companyId || app.companyId.companyName !== req.session.admin.companyName) {
                return res.status(403).send("Forbidden: You cannot modify this application.");
            }
        }

        app.status = status;
        await app.save();

        await Notification.create({
            userId: app.userId,
            title: "Application Status Updated",
            message: `Your application status has been changed to "${status}".`
        });

        res.send("Status Updated Successfully ✅");
    } catch (err) {
        console.log(err);
        res.status(500).send("Error Updating Status");
    }
};

// Delete existing administrator (superadmin only)
exports.deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        // Don't let superadmin delete themselves
        if (req.session.admin._id === id) {
            return res.status(400).send("You cannot delete your own account.");
        }
        const adminToDelete = await Admin.findById(id);
        if (!adminToDelete) {
            return res.status(404).send("Admin not found.");
        }
        if (adminToDelete.username === "superadmin") {
            return res.status(400).send("The main superadmin account cannot be deleted.");
        }
        await Admin.findByIdAndDelete(id);
        res.send("Administrator account deleted successfully.");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting administrator.");
    }
};

exports.showProctoring = (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/views", "proctoring.html"));
};

exports.getProctoringData = async (req, res) => {
    try {
        let query = {};
        if (req.session.admin && req.session.admin.role !== "superadmin") {
            query = { companyName: req.session.admin.companyName };
        }
        const logs = await CheatingLog.find(query)
            .populate("userId", "name email branch semester")
            .sort({ createdAt: -1 });
        res.json(logs);
    } catch (err) {
        console.error("Error fetching proctoring data:", err);
        res.status(500).json({ error: "Failed to load proctoring data" });
    }
};

exports.generateSignedLink = (req, res) => {
    try {
        const { examType, companyName, expiresMinutes } = req.body;
        if (!examType || !companyName || !expiresMinutes) {
            return res.status(400).send("Missing parameters");
        }
        if (req.session.admin.role === "admin" && companyName !== req.session.admin.companyName) {
            return res.status(403).send("Unauthorized to generate link for this company");
        }
        
        const expiresAt = Date.now() + Number(expiresMinutes) * 60 * 1000;
        const secret = process.env.SESSION_SECRET || "secure-session-secret-key-2026";
        const crypto = require("crypto");
        const dataToSign = `${examType}:${companyName}:${expiresAt}`;
        const sig = crypto.createHmac("sha256", secret).update(dataToSign).digest("hex");
        
        res.json({
            expiresAt,
            sig
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error generating signed link");
    }
};
