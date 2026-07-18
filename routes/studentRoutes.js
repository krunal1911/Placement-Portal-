const express = require("express");
const multer  = require("multer");

const studentController = require("../controllers/studentController");
const { requireUser }   = require("../middleware/auth");

const router = express.Router();

// Use memory storage — files stored as buffer, uploaded to Cloudinary in controller
const memStorage = multer.memoryStorage();

// Resume upload (PDF only, max 5MB)
const upload = multer({
    storage: memStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        file.mimetype === "application/pdf"
            ? cb(null, true)
            : cb(new Error("Only PDF files are allowed."), false);
    }
});

// Profile image upload (JPG/PNG only, max 2MB)
const profileUpload = multer({
    storage: memStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        ["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)
            ? cb(null, true)
            : cb(new Error("Only JPG, JPEG and PNG images are allowed."), false);
    }
});

// ==========================================
// VIEWS / ROUTING
// ==========================================
router.get("/dashboard", requireUser, studentController.showDashboard);
router.get("/profile", requireUser, studentController.showProfile);
router.get("/resume", studentController.showResume);
router.get("/aptitude", studentController.showAptitude);
router.get("/technical", studentController.showTechnical);
router.get("/career-guide", studentController.showCareerGuide);
router.get("/leaderboard", studentController.showLeaderboard);
router.get("/placement-drives", studentController.showPlacementDrives);
router.get("/history", requireUser, studentController.showHistory);
router.get("/my-applications", requireUser, studentController.showMyApplications);

// ==========================================
// API / DATA
// ==========================================
router.get("/current-user", studentController.getCurrentUser);
router.get("/dashboard-data", requireUser, studentController.getDashboardData);
router.get("/history-data", requireUser, studentController.getHistoryData);
router.get("/leaderboard-data", studentController.getLeaderboardData);
router.get("/companies", studentController.getCompanies);
router.get("/my-applications-data", requireUser, studentController.getMyApplicationsData);
router.get("/notifications", requireUser, studentController.getNotifications);
router.get("/career-guide/:career", studentController.getCareerGuideRoadmap);
router.get("/questions", studentController.getQuestions);
router.get("/technical-questions", studentController.getTechnicalQuestions);
router.get("/user", requireUser, studentController.getUserCompletionData);

// ==========================================
// POST WRITE ACTIONS
// ==========================================
router.post("/update-profile", requireUser, studentController.updateProfile);
router.post("/upload-profile", profileUpload.single("profileImage"), studentController.uploadProfileImage);
router.post("/upload-resume", upload.single("resume"), studentController.uploadResume);
router.post("/build-resume", requireUser, studentController.buildResume);
router.post("/submit-test", requireUser, studentController.submitTest);
router.post("/apply-company", requireUser, studentController.applyCompany);

// ==========================================
// DIAGNOSTIC (remove after fixing)
// ==========================================
router.get("/check-config", (req, res) => {
    res.json({
        cloudinary_cloud_name : process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ MISSING",
        cloudinary_api_key    : process.env.CLOUDINARY_API_KEY    ? "✅ Set" : "❌ MISSING",
        cloudinary_api_secret : process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ MISSING",
        mongodb_uri           : process.env.MONGODB_URI           ? "✅ Set" : "❌ MISSING",
        session_secret        : process.env.SESSION_SECRET        ? "✅ Set" : "❌ MISSING",
        node_env              : process.env.NODE_ENV || "not set"
    });
});

const Question = require("../models/Question");
const TechnicalQuestion = require("../models/TechnicalQuestion");

router.get("/check-questions", async (req, res) => {
    try {
        const aptCount = await Question.countDocuments();
        const techCount = await TechnicalQuestion.countDocuments();
        const sampleApt = await Question.find().limit(5);
        res.json({
            aptitude_count: aptCount,
            technical_count: techCount,
            sample_aptitude_questions: sampleApt
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

