const path = require("path");
const bcrypt = require("bcrypt");

const User = require("../../database/models/User");

exports.showRegister = (req, res) => {
    res.sendFile(path.join(process.cwd(), "frontend", "views", "register.html"));
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

        const nameRegex = /^[A-Za-z ]{3,50}$/;

        if (!nameRegex.test(name)) {
            return res.status(400).send("Name should contain only letters and be at least 3 characters long.");
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
        console.error(err);
        res.status(500).send("Something went wrong. Please try again.");
    }
};

exports.showLogin = (req, res) => {
    res.sendFile(path.join(process.cwd(), "frontend", "views", "login.html"));
};

exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;

        email = email?.trim().toLowerCase();
        password = password?.trim();

        if (!email || !password) {
            return res.status(400).send("Please enter both email and password.");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).send("Please enter a valid email address.");
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).send("Invalid email or password.");
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).send("Invalid email or password.");
        }

        req.session.user = {
            _id: user._id,
            name: user.name,
            email: user.email
        };

        req.session.save((err) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Session save failed. Please try again.");
            }
            res.status(200).send("Success");
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong. Please try again.");
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
};
