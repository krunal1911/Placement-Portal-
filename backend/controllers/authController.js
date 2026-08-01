const path = require("path");
const bcrypt = require("bcryptjs");

const User = require("../../database/models/User");
const renderView = require("../utils/renderView");
const { sign } = require("../utils/authToken");

exports.showRegister = (req, res) => {
    renderView(res, "register.html");
};

exports.register = async (req, res) => {
    try {
        let { name, email, password, branch, semester } = req.body;

        name = name?.trim();
        email = email?.trim().toLowerCase();
        password = password?.trim();
        branch = branch?.trim();
        semester = semester?.trim();

        if (!name || !email || !password || !branch || !semester) {
            return res.status(400).send("Please fill all required fields.");
        }

        const nameRegex = /^[A-Za-z\s\.\-']{2,50}$/;

        if (!nameRegex.test(name)) {
            return res.status(400).send("Name should contain letters and be at least 2 characters long.");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).send("Please enter a valid email address.");
        }

        if (password.length < 8) {
            return res.status(400).send("Password must be at least 8 characters.");
        }

        const validSemesters = ["1", "2", "3", "4", "5", "6", "7", "8"];

        if (!validSemesters.includes(semester)) {
            return res.status(400).send("Invalid semester selected.");
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).send("Email already registered.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            branch,
            semester
        });

        await newUser.save();

        res.send("Registration Successful");
    } catch (err) {
        console.error("Registration Error:", err);
        if (err.code === 11000) {
            return res.status(400).send("Email address is already registered.");
        }
        res.status(500).send(err.message || "Registration failed. Please check inputs and try again.");
    }
};

exports.showLogin = (req, res) => {
    renderView(res, "login.html");
};

exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;

        email = email?.trim();
        password = password?.trim();

        if (!email || !password) {
            return res.status(400).send("Please fill all fields.");
        }

        const safeEmailRegex = new RegExp("^" + email.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "$", "i");
        const user = await User.findOne({ email: safeEmailRegex });

        if (!user) {
            return res.status(400).send("Invalid Email or Password. Account not found.");
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).send("Invalid Email or Password.");
        }

        delete req.session.admin;

        const token = sign({
            type: "user",
            id: String(user._id),
            _id: String(user._id),
            name: user.name,
            email: user.email,
            branch: user.branch,
            semester: user.semester
        });

        req.session.user = {
            id: user._id,
            _id: user._id,
            name: user.name,
            email: user.email,
            branch: user.branch,
            semester: user.semester
        };

        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).send("Session save failed. Please try again.");
            }
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.json({ success: true, message: "Login Successful", token });
            }
            res.send("Login Successful");
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).send("Something went wrong. Please try again.");
    }
};

exports.logout = (req, res) => {
    if (req.session) {
        delete req.session.user;
        try { sessionStorage.removeItem("active_page_loaded"); } catch(e) {}
        if (!req.session.admin) {
            return req.session.destroy(err => {
                if (err) console.error(err);
                res.clearCookie("connect.sid");
                res.redirect("/login");
            });
        }
        return req.session.save(() => res.redirect("/login"));
    }
    res.redirect("/login");
};

// Student Password Reset Request endpoint
exports.requestPasswordReset = async (req, res) => {
    try {
        let { email } = req.body;
        if (!email || !email.trim()) {
            return res.status(400).json({ error: "Please enter your registered email address." });
        }

        email = email.trim().toLowerCase();
        const safeEmailRegex = new RegExp("^" + email.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "$", "i");
        const user = await User.findOne({ email: safeEmailRegex });

        if (!user) {
            return res.status(404).json({ error: "No student account found with this email address." });
        }

        user.passwordResetRequested = true;
        user.passwordResetRequestedAt = new Date();
        await user.save();

        res.json({
            success: true,
            message: `Password reset request submitted for ${user.name} (${user.email}). The Placement Admin has been notified!`,
            studentName: user.name
        });
    } catch (err) {
        console.error("Password reset request error:", err);
        res.status(500).json({ error: "Failed to submit password reset request." });
    }
};
