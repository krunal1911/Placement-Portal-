const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const XLSX = require("xlsx");
const ExcelJS = require("exceljs");
const pdfParse = require("pdf-parse");

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
const ActiveExamLink = require("../../database/models/ActiveExamLink");

const renderView = require("../utils/renderView");

// ==========================================
// VIEW PAGES
// ==========================================
exports.showAdminLogin = (req, res) => {
    renderView(res, "admin-login.html");
};

exports.showAdminDashboard = (req, res) => {
    renderView(res, "admin-dashboard.html");
};

exports.showManageAdmins = (req, res) => {
    renderView(res, "manage-admins.html");
};

exports.showStudents = (req, res) => {
    renderView(res, "students.html");
};

exports.showManageQuestions = (req, res) => {
    renderView(res, "add-question.html");
};

exports.showAddQuestion = (req, res) => {
    renderView(res, "add-question.html");
};

exports.showImportQuestions = (req, res) => {
    renderView(res, "import-questions.html");
};

exports.showAddCompany = (req, res) => {
    renderView(res, "add-company.html");
};

exports.showManageCompanies = (req, res) => {
    renderView(res, "manage-companies.html");
};

exports.showResults = (req, res) => {
    renderView(res, "results.html");
};

exports.showApplications = (req, res) => {
    renderView(res, "applications.html");
};

exports.showUpdateStatus = (req, res) => {
    renderView(res, "update-status.html");
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
        const requests = await AdminRequest.find({ status: "pending" }).sort({ createdAt: -1 });
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
            return res.status(400).json({ success: false, message: "Invalid or non-pending request" });
        }
        
        const existingAdmin = await Admin.findOne({ username: request.username });
        if (existingAdmin) {
            request.status = "rejected";
            await request.save();
            return res.status(400).json({ success: false, message: "Admin username already exists. Request rejected." });
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
        res.json({ success: true, message: "Request Approved Successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error approving request" });
    }
};

// Reject access request (superadmin only)
exports.rejectAdminRequest = async (req, res) => {
    try {
        const request = await AdminRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }
        request.status = "rejected";
        await request.save();
        res.json({ success: true, message: "Request Rejected Successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error rejecting request" });
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

async function parseQuestionsFromPDF(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        const text = pdfData.text || "";
        const questions = [];

        const blocks = text.split(/(?:Question\s*\d+[:.]?|\bQ\d+[:.]?|\b\d+[\.\)]\s+)/i);

        for (let block of blocks) {
            if (!block || block.trim().length < 10) continue;

            const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            if (lines.length < 3) continue;

            let qTextLines = [];
            let optA = "", optB = "", optC = "", optD = "";
            let ans = "";
            let topic = "General";
            let difficulty = "Medium";
            let explanation = "";
            let currentSection = "question";

            for (let line of lines) {
                if (/^(?:A[\)\.:]|Option\s*A[:\s])/i.test(line)) {
                    optA = line.replace(/^(?:A[\)\.:]|Option\s*A[:\s])/i, "").trim();
                    currentSection = "optA";
                } else if (/^(?:B[\)\.:]|Option\s*B[:\s])/i.test(line)) {
                    optB = line.replace(/^(?:B[\)\.:]|Option\s*B[:\s])/i, "").trim();
                    currentSection = "optB";
                } else if (/^(?:C[\)\.:]|Option\s*C[:\s])/i.test(line)) {
                    optC = line.replace(/^(?:C[\)\.:]|Option\s*C[:\s])/i, "").trim();
                    currentSection = "optC";
                } else if (/^(?:D[\)\.:]|Option\s*D[:\s])/i.test(line)) {
                    optD = line.replace(/^(?:D[\)\.:]|Option\s*D[:\s])/i, "").trim();
                    currentSection = "optD";
                } else if (/^(?:Ans(?:wer)?[:\s])/i.test(line)) {
                    ans = line.replace(/^(?:Ans(?:wer)?[:\s])/i, "").trim();
                    currentSection = "answer";
                } else if (/^(?:Topic[:\s])/i.test(line)) {
                    topic = line.replace(/^(?:Topic[:\s])/i, "").trim();
                } else if (/^(?:Difficulty[:\s])/i.test(line)) {
                    difficulty = line.replace(/^(?:Difficulty[:\s])/i, "").trim();
                } else if (/^(?:Explanation[:\s])/i.test(line)) {
                    explanation = line.replace(/^(?:Explanation[:\s])/i, "").trim();
                } else if (currentSection === "question") {
                    qTextLines.push(line);
                }
            }

            const qText = qTextLines.join(" ").trim();
            if (qText && optA && optB) {
                if (/^[A-D]$/i.test(ans)) {
                    const letter = ans.toUpperCase();
                    if (letter === "A") ans = optA;
                    else if (letter === "B") ans = optB;
                    else if (letter === "C") ans = optC;
                    else if (letter === "D") ans = optD;
                }
                questions.push({
                    Question: qText,
                    "Option A": optA,
                    "Option B": optB,
                    "Option C": optC || "N/A",
                    "Option D": optD || "N/A",
                    Answer: ans || optA,
                    Explanation: explanation,
                    Topic: topic,
                    Difficulty: difficulty
                });
            }
        }
        return questions;
    } catch (e) {
        console.error("Error parsing PDF:", e);
        return [];
    }
}

// Batch import MCQ questions via uploaded Excel spreadsheets or PDF documents
exports.importQuestions = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("Please select a file to import (.xlsx, .xls, or .pdf).");
        }

        let targetCompany = req.body.companyName;
        if (req.session.admin.role === "admin") {
            targetCompany = req.session.admin.companyName || "General";
        } else if (!targetCompany) {
            targetCompany = "General";
        }

        const ext = path.extname(req.file.originalname).toLowerCase();
        let rows = [];

        if (ext === ".pdf") {
            rows = await parseQuestionsFromPDF(req.file.path);
        } else {
            const workbook = XLSX.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(sheet);
            rows = rawData.map(r => ({
                Question: r.Question || r.question || r["Question Text"],
                "Option A": r["Option A"] || r.optionA || r.A || r["Option 1"],
                "Option B": r["Option B"] || r.optionB || r.B || r["Option 2"],
                "Option C": r["Option C"] || r.optionC || r.C || r["Option 3"],
                "Option D": r["Option D"] || r.optionD || r.D || r["Option 4"],
                Answer: r.Answer || r.answer || r["Correct Answer"],
                Explanation: r.Explanation || r.explanation || "",
                Topic: r.Topic || r.topic || "General",
                Difficulty: r.Difficulty || r.difficulty || "Easy"
            }));
        }

        let imported = 0;
        let skipped = 0;

        for (const row of rows) {
            if (!row.Question || !row["Option A"] || !row["Option B"]) {
                skipped++;
                continue;
            }

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
                answer: row.Answer || row["Option A"],
                explanation: row.Explanation || "",
                topic: row.Topic || "General",
                difficulty: row.Difficulty || "Easy",
                companyName: targetCompany
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
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Import Summary | Placement Portal</title>
                <link rel="stylesheet" href="/dashboard.css?v=2.3">
            </head>
            <body style="background: var(--bg-main); font-family: 'Poppins', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
                <div style="background: var(--bg-card); padding: 40px; border-radius: 16px; border: 1px solid var(--border); box-shadow: var(--shadow-md); text-align: center; max-width: 480px; width: 90%;">
                    <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
                    <h2 style="color: var(--text-main); margin-bottom: 16px;">Import Complete</h2>
                    <div style="display: flex; justify-content: space-around; background: var(--bg-main); padding: 16px; border-radius: 12px; margin-bottom: 24px; border: 1px solid var(--border);">
                        <div>
                            <div style="font-size: 26px; font-weight: 700; color: var(--success);">${imported}</div>
                            <div style="font-size: 12px; color: var(--text-muted);">Imported</div>
                        </div>
                        <div>
                            <div style="font-size: 26px; font-weight: 700; color: var(--warning);">${skipped}</div>
                            <div style="font-size: 12px; color: var(--text-muted);">Skipped / Duplicates</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <a href="/add-question" class="btn btn-primary" style="flex: 1; text-decoration: none; padding: 12px;">View Question Bank</a>
                        <a href="/import-questions" class="btn btn-secondary" style="flex: 1; text-decoration: none; padding: 12px;">Import Another</a>
                    </div>
                </div>
            </body>
            </html>
        `);
    } catch (err) {
        console.error("Import error:", err);
        res.status(500).send("Import Failed: " + err.message);
    }
};

// Download sample Excel template
exports.downloadQuestionTemplate = (req, res) => {
    try {
        const sampleData = [
            {
                "Question": "What is the time complexity of searching in a balanced Binary Search Tree (BST)?",
                "Option A": "O(1)",
                "Option B": "O(log n)",
                "Option C": "O(n)",
                "Option D": "O(n log n)",
                "Answer": "O(log n)",
                "Explanation": "Balanced BST search takes O(log n) time.",
                "Topic": "Data Structures",
                "Difficulty": "Easy"
            },
            {
                "Question": "Which SQL statement is used to extract data from a database?",
                "Option A": "EXTRACT",
                "Option B": "GET",
                "Option C": "SELECT",
                "Option D": "OPEN",
                "Answer": "SELECT",
                "Explanation": "The SELECT statement is used to query database records.",
                "Topic": "Database",
                "Difficulty": "Easy"
            }
        ];
        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.json_to_sheet(sampleData);
        XLSX.utils.book_append_sheet(workbook, sheet, "Questions");
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=Question_Import_Template.xlsx");
        res.send(buffer);
    } catch (e) {
        console.error("Template download error:", e);
        res.status(500).send("Could not generate template");
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
    renderView(res, "proctoring.html");
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

exports.generateSignedLink = async (req, res) => {
    try {
        const { examType, companyName, expiresMinutes } = req.body;
        if (!examType || !companyName || !expiresMinutes) {
            return res.status(400).send("Missing parameters");
        }
        if (req.session.admin.role === "admin" && companyName !== req.session.admin.companyName) {
            return res.status(403).send("Unauthorized to generate link for this company");
        }
        
        const crypto = require("crypto");
        const token = crypto.randomBytes(16).toString("hex");
        const expiresAt = new Date(Date.now() + Number(expiresMinutes) * 60 * 1000);
        
        const newLink = new ActiveExamLink({
            examType,
            companyName,
            expiresAt,
            token,
            isActive: true,
            createdById: req.session.admin._id
        });
        await newLink.save();
        
        res.json({
            expiresAt: expiresAt.getTime(),
            token
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error generating signed link");
    }
};

exports.getActiveLinks = async (req, res) => {
    try {
        let query = {};
        if (req.session.admin.role !== "superadmin") {
            query = { companyName: req.session.admin.companyName };
        }
        const links = await ActiveExamLink.find(query)
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(links);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching active links");
    }
};

exports.extendLink = async (req, res) => {
    try {
        const { id } = req.params;
        const { minutes } = req.body;
        if (!minutes || isNaN(minutes)) {
            return res.status(400).send("Invalid extension minutes");
        }
        
        const link = await ActiveExamLink.findById(id);
        if (!link) {
            return res.status(404).send("Link not found");
        }
        if (req.session.admin.role !== "superadmin" && link.companyName !== req.session.admin.companyName) {
            return res.status(403).send("Unauthorized");
        }
        
        // Extend time (if it's already expired, extend relative to now; otherwise relative to the current expiresAt)
        const currentExpiration = link.expiresAt.getTime();
        const baseTime = currentExpiration > Date.now() ? currentExpiration : Date.now();
        link.expiresAt = new Date(baseTime + Number(minutes) * 60 * 1000);
        link.isActive = true; // reactivate if it was inactive
        await link.save();
        
        res.json({ message: "Time extended successfully", expiresAt: link.expiresAt.getTime() });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error extending link");
    }
};

exports.stopLink = async (req, res) => {
    try {
        const { id } = req.params;
        const link = await ActiveExamLink.findById(id);
        if (!link) {
            return res.status(404).send("Link not found");
        }
        if (req.session.admin.role !== "superadmin" && link.companyName !== req.session.admin.companyName) {
            return res.status(403).send("Unauthorized");
        }
        
        link.isActive = false;
        link.expiresAt = new Date(); // expire immediately
        await link.save();
        
        res.json({ message: "Exam link revoked/stopped successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error stopping link");
    }
};

exports.exportResultPDF = async (req, res) => {
    try {
        const { resultId } = req.params;
        const result = await Result.findById(resultId).populate("userId");
        if (!result) {
            return res.status(404).send("Result not found");
        }
        
        if (req.session.admin.role !== "superadmin" && result.companyName !== req.session.admin.companyName) {
            return res.status(403).send("Unauthorized to export this candidate's report");
        }
        
        const cheatingLogs = await CheatingLog.find({
            userId: result.userId?._id,
            testType: result.testType,
            companyName: result.companyName
        }).sort({ createdAt: 1 });

        const PDFDocument = require("pdfkit");
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="Candidate_Report_${result.userId ? result.userId.name.replace(/\s+/g, '_') : 'Student'}_${result.testType}.pdf"`
        );
        doc.pipe(res);
        
        // Header
        doc.fillColor("#1e3a8a")
           .font("Helvetica-Bold")
           .fontSize(22)
           .text("PLACEMENT PORTAL", { align: "left" });
        doc.fillColor("#64748b")
           .font("Helvetica")
           .fontSize(10)
           .text("AI Placement Preparation & Assessment Platform", { align: "left" });
        
        doc.moveDown(1.5);
        
        // Main Title
        doc.fillColor("#0f172a")
           .font("Helvetica-Bold")
           .fontSize(16)
           .text("CANDIDATE ASSESSMENT & PROCTORING REPORT", { align: "center", underline: true });
        
        doc.moveDown(2);
        
        // Table: Candidate Information
        doc.fillColor("#1e3a8a")
           .font("Helvetica-Bold")
           .fontSize(12)
           .text("1. CANDIDATE PROFILE DETAILS", { underline: true });
        doc.moveDown(0.5);
        
        doc.fillColor("#334155").font("Helvetica").fontSize(10);
        
        const candidateInfo = [
            ["Name:", result.userId ? result.userId.name : "Unknown"],
            ["Email:", result.userId ? result.userId.email : "N/A"],
            ["Branch:", result.userId ? result.userId.branch : "N/A"],
            ["Semester:", result.userId ? result.userId.semester : "N/A"]
        ];
        
        let startY = doc.y;
        candidateInfo.forEach(([label, value]) => {
            doc.font("Helvetica-Bold").text(label, 70, startY);
            doc.font("Helvetica").text(value, 150, startY);
            startY += 18;
        });
        
        doc.y = startY + 10;
        doc.moveDown(1);
        
        // Table: Assessment Overview
        doc.fillColor("#1e3a8a")
           .font("Helvetica-Bold")
           .fontSize(12)
           .text("2. ASSESSMENT PERFORMANCE OVERVIEW", { underline: true });
        doc.moveDown(0.5);
        
        const percentage = result.percentage || Math.round((result.score / result.totalQuestions) * 100) || 0;
        
        const testInfo = [
            ["Assessment Type:", `${result.testType} Exam`],
            ["Target Company:", result.companyName || "General"],
            ["Score Obtained:", `${result.score} / ${result.totalQuestions}`],
            ["Percentage Score:", `${percentage}%`],
            ["Date Completed:", new Date(result.createdAt).toLocaleString()]
        ];
        
        startY = doc.y;
        testInfo.forEach(([label, value]) => {
            doc.font("Helvetica-Bold").text(label, 70, startY);
            doc.font("Helvetica").text(value, 180, startY);
            startY += 18;
        });
        
        doc.y = startY + 10;
        doc.moveDown(1);
        
        // Proctoring Audit Section
        doc.fillColor("#1e3a8a")
           .font("Helvetica-Bold")
           .fontSize(12)
           .text("3. PROCTORING & SECURITY AUDIT SUMMARY", { underline: true });
        doc.moveDown(0.5);
        
        const warningCount = cheatingLogs.length;
        doc.fillColor("#334155").font("Helvetica").fontSize(10);
        doc.text(`Total Proctoring Flags Logged: `, { docX: 70, continued: true });
        doc.font("Helvetica-Bold").fillColor(warningCount > 0 ? "#dc2626" : "#16a34a").text(`${warningCount} warnings triggered.`);
        
        doc.fillColor("#334155").font("Helvetica").moveDown(0.5);
        
        if (cheatingLogs.length === 0) {
            doc.text("Clean record: No browser tabs switches, exit-fullscreen, or developer tools attempts were logged during this exam.", 70);
        } else {
            doc.moveDown(0.5);
            cheatingLogs.forEach((log, index) => {
                doc.font("Helvetica-Bold").fillColor("#0f172a").text(`Flag #${index + 1}: ${log.incidentType}`, 70);
                doc.font("Helvetica-Oblique").fillColor("#475569").text(`Details: ${log.details}`, 85);
                doc.font("Helvetica").fillColor("#dc2626").text(`AI Analysis: ${log.aiAnalysis || "Suspicious tab switch activity."}`, 85);
                doc.font("Helvetica").fillColor("#64748b").text(`Logged At: ${new Date(log.createdAt).toLocaleTimeString()}`, 85);
                doc.moveDown(0.5);
            });
        }
        
        doc.moveDown(2);
        
        // Footer
        doc.fillColor("#94a3b8")
           .font("Helvetica-Oblique")
           .fontSize(8)
           .text("This is a system-generated document compiled by the Placement Portal assessment proctoring module.", { align: "center" });
        
        doc.end();
    } catch (err) {
        console.error("PDF Export failed:", err);
        res.status(500).send("Failed to export PDF report");
    }
};

exports.getCompaniesList = async (req, res) => {
    try {
        const companyDrives = await Company.find({}, { companyName: 1, jobRole: 1 });
        const adminAccounts = await Admin.find({ role: "admin" }, { companyName: 1 });

        const set = new Map();

        // 1. Include registered placement drives
        companyDrives.forEach(c => {
            if (c.companyName && c.companyName.trim()) {
                set.set(c.companyName.trim().toLowerCase(), { companyName: c.companyName.trim(), jobRole: c.jobRole || "Hiring Drive" });
            }
        });

        // 2. Include registered company administrator accounts
        adminAccounts.forEach(a => {
            if (a.companyName && a.companyName.trim()) {
                const key = a.companyName.trim().toLowerCase();
                if (!set.has(key)) {
                    set.set(key, { companyName: a.companyName.trim(), jobRole: "Company Account" });
                }
            }
        });

        res.json(Array.from(set.values()));
    } catch (err) {
        console.error("Error fetching companies:", err);
        res.status(500).json({ error: "Failed to load companies" });
    }
};
