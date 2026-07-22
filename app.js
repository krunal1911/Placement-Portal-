require('dotenv').config();

const express   = require('express');
const session   = require('express-session');
const path      = require('path');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./database/config/db');
const ExamSettings   = require('./database/models/ExamSettings');

// ─── Route Modules ────────────────────────────────────────────────────────────
const authRoutes    = require('./backend/routes/authRoutes');
const studentRoutes = require('./backend/routes/studentRoutes');
const adminRoutes   = require('./backend/routes/adminRoutes');

// ─── App Instance ─────────────────────────────────────────────────────────────
const app = express();

// ─── Database Connection ──────────────────────────────────────────────────────
connectDB();

const Admin = require('./database/models/Admin');
const bcrypt = require('bcrypt');

// ─── Seed Exam Settings & Migrate Schemas ─────────────────────────────────────
const initializeSettings = async () => {
    try {
        const Question = require('./database/models/Question');
        const TechnicalQuestion = require('./database/models/TechnicalQuestion');

        // Migrate existing questions to have companyName: 'General' if missing
        await Question.updateMany(
            { companyName: { $exists: false } },
            { $set: { companyName: 'General' } }
        );
        await TechnicalQuestion.updateMany(
            { companyName: { $exists: false } },
            { $set: { companyName: 'General' } }
        );

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
            const superHashed = await bcrypt.hash("placementSuperAdmin2026!", 10);
            await Admin.create({
                username: "superadmin",
                password: superHashed,
                role: "superadmin"
            });
            const regularHashed = await bcrypt.hash("placementCompanyAdmin2026!", 10);
            await Admin.create({
                username: "admin",
                password: regularHashed,
                role: "admin"
            });
            console.log('✅ Default admins created successfully!');
        }
    } catch (err) {
        console.error('Failed to initialize settings/admins:', err);
    }
};
initializeSettings();

// Trust reverse proxy (Render) for rate-limiting headers
app.set('trust proxy', 1);

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



// ─── Standard Middlewares ─────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. NoSQL Sanitizer & XSS Prevention — strips MongoDB operator keys and scripts from requests
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

const sanitizeXSS = (val) => {
    if (typeof val === 'string') {
        return val.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').trim();
    }
    if (Array.isArray(val)) {
        return val.map(sanitizeXSS);
    }
    if (val && typeof val === 'object') {
        for (const key in val) {
            val[key] = sanitizeXSS(val[key]);
        }
    }
    return val;
};

app.use((req, res, next) => {
    if (req.body) {
        sanitizeBody(req.body);
        req.body = sanitizeXSS(req.body);
    }
    if (req.query) {
        req.query = sanitizeXSS(req.query);
    }
    if (req.params) {
        req.params = sanitizeXSS(req.params);
    }
    next();
});

app.use(session({
    secret: process.env.SESSION_SECRET || 'placementPortalSecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,   // 24 hours
        httpOnly: true,                  // Prevents client-side JS from reading cookie
        secure: process.env.NODE_ENV === 'production', // Secure cookies in production
        sameSite: 'lax'
    }
}));

// ─── Static File Serving ──────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'frontend/public')));
app.use('/uploads', express.static(path.join(__dirname, 'frontend/public/uploads')));

// Set custom views folder for templates
app.set('views', path.join(__dirname, 'frontend/views'));

// ─── Home Route ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'views', 'index.html'));
});

// ─── Routers ──────────────────────────────────────────────────────────────────
app.use('/', authRoutes);
app.use('/', studentRoutes);
app.use('/', adminRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'frontend', 'views', '404.html'));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).sendFile(path.join(__dirname, 'frontend', 'views', '500.html'));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
