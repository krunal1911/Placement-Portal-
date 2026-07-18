require('dotenv').config();

const express   = require('express');
const session   = require('express-session');
const path      = require('path');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const ExamSettings   = require('./models/ExamSettings');

// ─── Route Modules ────────────────────────────────────────────────────────────
const authRoutes    = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes   = require('./routes/adminRoutes');

// ─── App Instance ─────────────────────────────────────────────────────────────
const app = express();

// ─── Database Connection ──────────────────────────────────────────────────────
connectDB();

const Admin = require('./models/Admin');
const bcrypt = require('bcrypt');

// ─── Seed Exam Settings ───────────────────────────────────────────────────────
const initializeSettings = async () => {
    try {
        const aptitude = await ExamSettings.findOne({ examType: 'aptitude' });
        if (!aptitude) {
            await ExamSettings.create({
                examType: 'aptitude',
                examName: 'Placement Portal - Aptitude Practice Assessment',
                duration: 20
            });
        }
        const technical = await ExamSettings.findOne({ examType: 'technical' });
        if (!technical) {
            await ExamSettings.create({
                examType: 'technical',
                examName: 'Placement Portal - Technical Programming Assessment',
                duration: 20
            });
        }

        // Seed Admins automatically
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            console.log('🌱 No admins found. Seeding default admin accounts...');
            const superHashed = await bcrypt.hash("superadmin123", 10);
            await Admin.create({
                username: "superadmin",
                password: superHashed,
                role: "superadmin"
            });
            const regularHashed = await bcrypt.hash("admin123", 10);
            await Admin.create({
                username: "admin",
                password: regularHashed,
                role: "admin"
            });
            console.log('✅ Default admin (admin123) & superadmin (superadmin123) created successfully!');
        }
    } catch (err) {
        console.error('Failed to initialize settings/admins:', err);
    }
};
initializeSettings();

// ─── Security Middlewares ─────────────────────────────────────────────────────

// 1. Helmet — sets safe HTTP response headers
app.use(helmet({
    contentSecurityPolicy: false   // Disabled to allow inline scripts in HTML views
}));

// 2. Rate Limiter — blocks brute-force & spam attacks on authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minute window
    max: 30,                    // max 30 requests per window per IP
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/login', authLimiter);
app.use('/admin-login', authLimiter);
app.use('/register', authLimiter);

// 3. NoSQL Sanitizer — strips MongoDB operator keys from req.body (Express 5 compatible)
const sanitizeBody = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key in obj) {
        if (key.startsWith('$') || key.includes('.')) {
            delete obj[key];
        } else if (typeof obj[key] === 'object') {
            sanitizeBody(obj[key]);
        }
    }
};
app.use((req, res, next) => {
    if (req.body) sanitizeBody(req.body);
    next();
});

// ─── Standard Middlewares ─────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'placementPortalSecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,   // 24 hours
        httpOnly: true,                  // Prevents client-side JS from reading cookie
        sameSite: 'lax'
    }
}));

// ─── Static File Serving ──────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Home Route ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// ─── Routers ──────────────────────────────────────────────────────────────────
app.use('/', authRoutes);
app.use('/', studentRoutes);
app.use('/', adminRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).sendFile(path.join(__dirname, 'views', '500.html'));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
