const ActiveExamLink = require("../../database/models/ActiveExamLink");
const { verify } = require("../utils/authToken");

function getAdminTokenFromRequest(req) {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) return authHeader.slice(7).trim();
    if (req.query && req.query.tk) return req.query.tk;
    if (req.body && req.body.tk) return req.body.tk;
    return null;
}

// Cookie-based sessions are shared by EVERY tab in the same browser. If two
// different admin accounts log in from two tabs, they'd otherwise stomp on the
// same `req.session.admin`, which is why refreshing one tab could suddenly show
// the other tab's admin. To keep each tab's identity independent, each tab keeps
// its own signed token (see frontend/public/responsive.js) and we trust that
// token over the shared session whenever it's present.
function resolveAdmin(req) {
    const token = getAdminTokenFromRequest(req);
    if (token) {
        const payload = verify(token);
        if (payload && payload.type === "admin") {
            return {
                _id: payload.id,
                username: payload.username,
                role: payload.role,
                companyName: payload.companyName || ""
            };
        }
        return null;
    }
    return req.session.admin || null;
}

function resolveUser(req) {
    const token = getAdminTokenFromRequest(req);
    if (token) {
        const payload = verify(token);
        if (payload && payload.type === "user") {
            return {
                id: payload.id,
                _id: payload._id || payload.id,
                name: payload.name,
                email: payload.email,
                branch: payload.branch,
                semester: payload.semester
            };
        }
    }
    return req.session.user || null;
}

const requireUserOrAdmin = (req, res, next) => {
    req.admin = resolveAdmin(req);
    req.user = resolveUser(req);
    if (!req.user && !req.admin) {
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(401).json({ error: "Authentication required" });
        }
        return res.redirect('/login');
    }
    next();
};

const requireUser = (req, res, next) => {
    req.user = resolveUser(req);
    if (!req.user) {
        const isJsonRequest = req.xhr || 
            (req.headers.accept && req.headers.accept.indexOf('json') > -1) ||
            (req.headers['content-type'] && req.headers['content-type'].indexOf('json') > -1) ||
            req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE';

        if (isJsonRequest) {
            return res.status(401).json({ error: "Authentication required. Please log in as a student." });
        }
        const redirectParam = req.query.token ? `?redirect=${encodeURIComponent(req.originalUrl)}` : '';
        return res.redirect(`/login${redirectParam}`);
    }
    next();
};

const requireAdmin = (req, res, next) => {
    req.admin = resolveAdmin(req);
    if (!req.admin) {
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(401).json({ error: "Admin authentication required" });
        }
        return res.redirect('/admin-login');
    }
    next();
};

const requireSuperAdmin = (req, res, next) => {
    req.admin = resolveAdmin(req);
    if (!req.admin) {
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(401).json({ error: "Admin authentication required" });
        }
        return res.redirect('/admin-login');
    }
    if (req.admin.role !== "superadmin") {
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(403).json({ error: "Forbidden: Super Admin access required" });
        }
        return res.status(403).send("Forbidden: Super Admin access required.");
    }
    next();
};

const verifyExamLink = async (req, res, next) => {
    const { company, token } = req.query;
    const examType = req.path.replace("/", ""); // "aptitude", "technical", or "combined"
    
    // Allow general practice exams to be accessed without tokens
    if (!company || company.trim().toLowerCase() === "general") {
        return next();
    }
    
    // Force token verification for company-specific exams
    if (!token) {
        return res.status(403).send(`
            <div style="font-family: 'Poppins', sans-serif; text-align: center; padding: 50px 20px;">
                <h1 style="color: #dc2626; font-size: 32px; margin-bottom: 12px;">🔒 Access Denied</h1>
                <p style="color: #475569; font-size: 16px;">A secure authorization token is required to access this company's assessment.</p>
                <a href="/dashboard" style="display: inline-block; margin-top: 24px; padding: 12px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; transition: background 0.2s;">Go to Dashboard</a>
            </div>
        `);
    }
    
    try {
        const cleanToken = String(token).trim();
        const link = await ActiveExamLink.findOne({ token: cleanToken });
        
        if (!link) {
            return res.status(403).send(`
                <div style="font-family: 'Poppins', sans-serif; text-align: center; padding: 50px 20px;">
                    <h1 style="color: #dc2626; font-size: 32px; margin-bottom: 12px;">🚫 Invalid Exam Link</h1>
                    <p style="color: #475569; font-size: 16px;">This exam link token is invalid, expired, or has been revoked by the admin.</p>
                    <a href="/dashboard" style="display: inline-block; margin-top: 24px; padding: 12px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; transition: background 0.2s;">Go to Dashboard</a>
                </div>
            `);
        }
        
        // Check if the link matches the requested company and exam type (case-insensitive company match)
        const reqCo = (company || "").trim().toLowerCase();
        const linkCo = (link.companyName || "").trim().toLowerCase();

        if (reqCo !== linkCo || link.examType !== examType) {
            return res.status(400).send(`
                <div style="font-family: 'Poppins', sans-serif; text-align: center; padding: 50px 20px;">
                    <h1 style="color: #dc2626; font-size: 32px; margin-bottom: 12px;">🚫 Parameter Mismatch</h1>
                    <p style="color: #475569; font-size: 16px;">The exam link parameters do not match the secure token data.</p>
                    <a href="/dashboard" style="display: inline-block; margin-top: 24px; padding: 12px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; transition: background 0.2s;">Go to Dashboard</a>
                </div>
            `);
        }
        
        // Check if link is explicitly disabled or expired
        const expiresTime = link.expiresAt ? new Date(link.expiresAt).getTime() : 0;
        if (!link.isActive || (expiresTime > 0 && Date.now() > expiresTime)) {
            return res.status(410).send(`
                <div style="font-family: 'Poppins', sans-serif; text-align: center; padding: 50px 20px;">
                    <h1 style="color: #ef4444; font-size: 32px; margin-bottom: 12px;">⏰ Exam Link Closed (Timeout)</h1>
                    <p style="color: #475569; font-size: 16px;">The active window to join this assessment has ended (Expired or Revoked by Coordinator). Please contact your admin for a new link.</p>
                    <a href="/dashboard" style="display: inline-block; margin-top: 24px; padding: 12px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; transition: background 0.2s;">Go to Dashboard</a>
                </div>
            `);
        }
        
        next();
    } catch (err) {
        console.error("verifyExamLink error:", err);
        res.status(500).send("Database error verifying exam link.");
    }
};

module.exports = {
    requireUser,
    requireAdmin,
    requireSuperAdmin,
    requireUserOrAdmin,
    verifyExamLink
};
