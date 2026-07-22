const ActiveExamLink = require("../../database/models/ActiveExamLink");

const requireUser = (req, res, next) => {
    if (!req.session.user) {
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const redirectParam = req.query.token ? `?redirect=${encodeURIComponent(req.originalUrl)}` : '';
        return res.redirect(`/login${redirectParam}`);
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session.admin) {
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(401).json({ error: "Admin authentication required" });
        }
        return res.redirect('/admin-login');
    }
    next();
};

const requireSuperAdmin = (req, res, next) => {
    if (!req.session.admin) {
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(401).json({ error: "Admin authentication required" });
        }
        return res.redirect('/admin-login');
    }
    if (req.session.admin.role !== "superadmin") {
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
    if (!company || company === "General") {
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
        const link = await ActiveExamLink.findOne({ token });
        if (!link) {
            return res.status(403).send(`
                <div style="font-family: 'Poppins', sans-serif; text-align: center; padding: 50px 20px;">
                    <h1 style="color: #dc2626; font-size: 32px; margin-bottom: 12px;">🚫 Invalid Exam Link</h1>
                    <p style="color: #475569; font-size: 16px;">This exam link token is invalid, expired, or has been revoked by the admin.</p>
                    <a href="/dashboard" style="display: inline-block; margin-top: 24px; padding: 12px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; transition: background 0.2s;">Go to Dashboard</a>
                </div>
            `);
        }
        
        // Check if the link matches the requested company and exam type
        if (link.companyName !== company || link.examType !== examType) {
            return res.status(400).send(`
                <div style="font-family: 'Poppins', sans-serif; text-align: center; padding: 50px 20px;">
                    <h1 style="color: #dc2626; font-size: 32px; margin-bottom: 12px;">🚫 Parameter Mismatch</h1>
                    <p style="color: #475569; font-size: 16px;">The exam link parameters do not match the secure token data.</p>
                    <a href="/dashboard" style="display: inline-block; margin-top: 24px; padding: 12px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; transition: background 0.2s;">Go to Dashboard</a>
                </div>
            `);
        }
        
        // Check if link is explicitly disabled or expired
        if (!link.isActive || Date.now() > link.expiresAt.getTime()) {
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
    verifyExamLink
};
