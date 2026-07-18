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
    res.sendFile(path.join(__dirname, "../../frontend/views", "manage-questions.html"));
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
        role: req.session.admin.role
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
        if (req.params.type === "aptitude") {
            const list = await Question.find();
            res.json(list);
        } else {
            const list = await TechnicalQuestion.find();
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

        const totalStudents = await User.countDocuments();
        const totalCompanies = await Company.countDocuments();
        const totalApplications = await Application.countDocuments();

        const users = await User.find();
        let totalTests = 0;
        let totalScore = 0;

        users.forEach(user => {
            totalTests += user.testsTaken || 0;
            totalScore += user.averageScore || 0;
        });

        const averageScore = users.length > 0 ? Math.round(totalScore / users.length) : 0;

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
        const applications = await Application.find()
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
        const results = await Result.find().populate("userId");
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
        const activities = await Application.find()
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
            role: admin.role
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
        const { username, password, role } = req.body;
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
            role
        });
        res.send("Admin created successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to create admin");
    }
};

// Add MCQ to database
exports.addQuestion = async (req, res) => {
    try {
        const { type, subject, question, options, answer, marks } = req.body;

        if (type === "aptitude") {
            const newQuestion = new Question({
                question,
                options,
                answer,
                marks: Number(marks) || 1
            });
            await newQuestion.save();
        } else {
            const newQuestion = new TechnicalQuestion({
                subject,
                question,
                options,
                answer,
                marks: Number(marks) || 1
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
        await Question.findByIdAndUpdate(req.params.id, {
            question,
            options,
            answer,
            marks: Number(marks) || 1
        });
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
        await TechnicalQuestion.findByIdAndUpdate(req.params.id, {
            subject,
            question,
            options,
            answer,
            marks: Number(marks) || 1
        });
        res.send("Question Updated Successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to update question");
    }
};

// Delete existing aptitude MCQ
exports.deleteQuestion = async (req, res) => {
    try {
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
                difficulty: row.Difficulty || "Easy"
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

        const company = new Company({
            companyName,
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
        const app = await Application.findByIdAndUpdate(id, {
            status: status
        }, { new: true });

        if (app) {
            await Notification.create({
                userId: app.userId,
                title: "Application Status Updated",
                message: `Your application status has been changed to "${status}".`
            });
        }

        res.send("Status Updated Successfully ✅");
    } catch (err) {
        console.log(err);
        res.status(500).send("Error Updating Status");
    }
};
