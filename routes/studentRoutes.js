const express = require("express");
const multer = require("multer");
const path = require("path");

const studentController = require("../controllers/studentController");
const { requireUser } = require("../middleware/auth");

const router = express.Router();

// Multer Storage Configuration for Custom Resume upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed."), false);
        }
    }
});

// Multer Storage Configuration for Profile Avatar upload
const profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/profiles");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const profileUpload = multer({
    storage: profileStorage,
    limits: {
        fileSize: 2 * 1024 * 1024
    },
    fileFilter: function (req, file, cb) {
        if (
            file.mimetype === "image/png" ||
            file.mimetype === "image/jpeg" ||
            file.mimetype === "image/jpg"
        ) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, JPEG and PNG images are allowed."), false);
        }
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

module.exports = router;
