const express = require("express");

const authController = require("../controllers/authController");

const router = express.Router();

router.get("/register", authController.showRegister);
router.post("/register", authController.register);
router.get("/login", authController.showLogin);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.post("/api/request-password-reset", authController.requestPasswordReset);

module.exports = router;
