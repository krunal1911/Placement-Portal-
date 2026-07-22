const express = require("express");
const multer = require("multer");
const path = require("path");

const adminController = require("../controllers/adminController");
const { requireAdmin, requireSuperAdmin } = require("../middleware/auth");

const router = express.Router();

// Multer Storage Configuration for dynamic Excel file uploading
const excelStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const fileUpload = multer({
    storage: excelStorage,
    fileFilter: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === ".xlsx" || ext === ".xls" || ext === ".pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only Excel (.xlsx, .xls) and PDF (.pdf) files are allowed."), false);
        }
    }
});

// ==========================================
// VIEWS / ROUTING
// ==========================================
router.get("/admin-login", adminController.showAdminLogin);
router.get("/admin-dashboard", requireAdmin, adminController.showAdminDashboard);
router.get("/manage-admins", requireSuperAdmin, adminController.showManageAdmins);
router.get("/students", requireSuperAdmin, adminController.showStudents);
router.get("/manage-questions", requireAdmin, adminController.showManageQuestions);
router.get("/add-question", requireAdmin, adminController.showAddQuestion);
router.get("/import-questions", requireAdmin, adminController.showImportQuestions);
router.get("/add-company", requireAdmin, adminController.showAddCompany);
router.get("/manage-companies", requireAdmin, adminController.showManageCompanies);
router.get("/results", requireAdmin, adminController.showResults);
router.get("/applications", requireAdmin, adminController.showApplications);
router.get("/proctoring", requireAdmin, adminController.showProctoring);
router.get("/update-status", requireAdmin, adminController.showUpdateStatus);

// ==========================================
// API / DATA
// ==========================================
router.get("/current-admin", requireAdmin, adminController.getCurrentAdmin);
router.get("/admins-data", requireSuperAdmin, adminController.getAdminsData);
router.get("/students-data", requireSuperAdmin, adminController.getStudentsData);
router.get("/exam-settings/:type", adminController.getExamSettings);
router.get("/questions-list/:type", requireAdmin, adminController.getQuestionsList);
router.get("/admin-analytics", requireAdmin, adminController.getAdminAnalytics);
router.get("/applications-data", requireAdmin, adminController.getApplicationsData);
router.get("/proctoring-data", requireAdmin, adminController.getProctoringData);
router.get("/results-data", requireAdmin, adminController.getResultsData);
router.get("/recent-activity", requireAdmin, adminController.getRecentActivity);
router.get("/export-result-pdf/:resultId", requireAdmin, adminController.exportResultPDF);
router.get("/export-students", requireSuperAdmin, adminController.exportStudents);
router.get("/companies-list", requireAdmin, adminController.getCompaniesList);

router.get("/download-question-template", requireAdmin, adminController.downloadQuestionTemplate);

// Admin Requests API (for approval flow)
router.post("/admin-request", adminController.postAdminRequest);
router.get("/admin-requests-data", requireSuperAdmin, adminController.getAdminRequests);
router.get("/access-requests-data", requireSuperAdmin, adminController.getAdminRequests);
router.post("/admin-request/approve/:id", requireSuperAdmin, adminController.approveAdminRequest);
router.post("/approve-request/:id", requireSuperAdmin, adminController.approveAdminRequest);
router.post("/admin-request/reject/:id", requireSuperAdmin, adminController.rejectAdminRequest);
router.post("/reject-request/:id", requireSuperAdmin, adminController.rejectAdminRequest);
router.delete("/reject-request/:id", requireSuperAdmin, adminController.rejectAdminRequest);

// ==========================================
// POST WRITE ACTIONS
// ==========================================
router.post("/admin-login", adminController.adminLogin);
router.post("/add-admin", requireSuperAdmin, adminController.addAdmin);
router.post("/add-question", requireAdmin, adminController.addQuestion);
router.post("/exam-settings/:type", requireSuperAdmin, adminController.updateExamSettings);
router.post("/update-question/:id", requireAdmin, adminController.updateQuestion);
router.post("/update-technical/:id", requireAdmin, adminController.updateTechnicalQuestion);
router.get("/delete-question/:id", requireAdmin, adminController.deleteQuestion);
router.get("/delete-technical/:id", requireAdmin, adminController.deleteTechnicalQuestion);
router.post("/import-questions", requireAdmin, fileUpload.single("importFile"), adminController.importQuestions);
router.post("/add-company", requireAdmin, adminController.addCompany);
router.post("/update-status", requireAdmin, adminController.updateStatus);
router.post("/generate-signed-link", requireAdmin, adminController.generateSignedLink);
router.get("/active-links", requireAdmin, adminController.getActiveLinks);
router.post("/extend-link/:id", requireAdmin, adminController.extendLink);
router.post("/stop-link/:id", requireAdmin, adminController.stopLink);
router.delete("/delete-admin/:id", requireSuperAdmin, adminController.deleteAdmin);

module.exports = router;
