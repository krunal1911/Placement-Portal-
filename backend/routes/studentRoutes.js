const express = require("express");
const multer  = require("multer");

const studentController = require("../controllers/studentController");
const { requireUser, requireAdmin, requireUserOrAdmin, verifyExamLink } = require("../middleware/auth");

const router = express.Router();

// Use memory storage — files stored as buffer, uploaded to Cloudinary in controller
const memStorage = multer.memoryStorage();

// Resume upload (PDF only, max 5MB)
const upload = multer({
    storage: memStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const mime = (file.mimetype || "").toLowerCase();
        const fname = (file.originalname || "").toLowerCase();
        
        const isPdfMime = mime.includes("pdf") || mime.includes("octet-stream") || mime.includes("binary") || mime.includes("download") || mime === "";
        const isPdfExt = fname.endsWith(".pdf") || fname.endsWith(".doc") || fname.endsWith(".docx");

        if (isPdfMime || isPdfExt) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed."), false);
        }
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
router.get("/presentation", studentController.showPresentation);
router.get("/profile", requireUser, studentController.showProfile);
router.get("/resume", requireUser, studentController.showResume);
router.get("/aptitude", requireUser, verifyExamLink, studentController.showAptitude);
router.get("/technical", requireUser, verifyExamLink, studentController.showTechnical);
router.get("/combined", requireUser, verifyExamLink, studentController.showCombined);
router.get("/career-guide", requireUser, studentController.showCareerGuide);
router.get("/leaderboard", requireUser, studentController.showLeaderboard);
router.get("/placement-drives", requireUserOrAdmin, studentController.showPlacementDrives);
router.get("/history", requireUser, studentController.showHistory);
router.get("/my-applications", studentController.showMyApplications);
router.get("/view-resume", requireUser, studentController.viewOwnResume);
router.get("/view-resume/:studentId", requireAdmin, studentController.viewStudentResume);

// ==========================================
// API / DATA
// ==========================================
router.get("/current-user", requireUser, studentController.getCurrentUser);
router.get("/dashboard-data", requireUser, studentController.getDashboardData);
router.get("/history-data", requireUser, studentController.getHistoryData);
router.get("/leaderboard-data", requireUser, studentController.getLeaderboardData);
router.get("/companies", requireUserOrAdmin, studentController.getCompanies);
router.get("/my-applications-data", requireUser, studentController.getMyApplicationsData);
router.get("/notifications", requireUser, studentController.getNotifications);
router.get("/career-guide/:career", requireUser, studentController.getCareerGuideRoadmap);
router.get("/questions", requireUser, studentController.getQuestions);
router.get("/technical-questions", requireUser, studentController.getTechnicalQuestions);
router.get("/user", requireUser, studentController.getUserCompletionData);
router.get("/api/verify-token", studentController.verifyTokenAPI);

// ==========================================
// POST WRITE ACTIONS
// ==========================================
router.post("/update-profile", requireUser, studentController.updateProfile);
router.post("/upload-profile", requireUser, profileUpload.single("profileImage"), studentController.uploadProfileImage);
router.post("/upload-resume", requireUser, (req, res, next) => {
    upload.single("resume")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).send("Upload Error: " + err.message);
        } else if (err) {
            return res.status(400).send(err.message || "Please select a valid PDF file.");
        }
        next();
    });
}, studentController.uploadResume);
router.post("/build-resume", requireUser, studentController.buildResume);
router.post("/delete-resume", requireUser, studentController.deleteResume);
router.post("/submit-test", requireUser, studentController.submitTest);
router.post("/apply-company", requireUser, studentController.applyCompany);
router.get("/mock-interview", requireUser, studentController.showMockInterview);
router.post("/api/mock-interview/start", requireUser, studentController.startMockInterview);
router.post("/api/mock-interview/answer", requireUser, studentController.evaluateMockAnswer);
router.post("/api/ats-check", requireUser, studentController.analyzeATSResume);

module.exports = router;

