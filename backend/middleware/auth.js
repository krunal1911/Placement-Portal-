const requireUser = (req, res, next) => {
    if (!req.session.user) {
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(401).json({ error: "Authentication required" });
        }
        return res.redirect('/login');
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

const verifyExamLink = (req, res, next) => {
    const { company, expires, sig } = req.query;
    const examType = req.path.replace("/", ""); // "aptitude" or "technical"
    
    // Allow general practice exams to be accessed without signatures
    if (!company || company === "General") {
        return next();
    }
    
    // Force signature verification for company-specific exams
    if (!expires || !sig) {
        return res.status(403).send(`
            <div style="font-family: 'Poppins', sans-serif; text-align: center; padding: 50px 20px;">
                <h1 style="color: #dc2626; font-size: 32px; margin-bottom: 12px;">🔒 Access Denied</h1>
                <p style="color: #475569; font-size: 16px;">A secure authorization token is required to access this company's assessment.</p>
                <a href="/dashboard" style="display: inline-block; margin-top: 24px; padding: 12px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; transition: background 0.2s;">Go to Dashboard</a>
            </div>
        `);
    }
    
    // Verify computed cryptographic signature
    const crypto = require("crypto");
    const secret = process.env.SESSION_SECRET || "secure-session-secret-key-2026";
    const dataToSign = `${examType}:${company}:${expires}`;
    const computedSig = crypto.createHmac("sha256", secret).update(dataToSign).digest("hex");
    
    if (computedSig !== sig) {
        return res.status(403).send(`
            <div style="font-family: 'Poppins', sans-serif; text-align: center; padding: 50px 20px;">
                <h1 style="color: #dc2626; font-size: 32px; margin-bottom: 12px;">🚫 Invalid Exam Token</h1>
                <p style="color: #475569; font-size: 16px;">This exam link signature is invalid or has been tampered with.</p>
                <a href="/dashboard" style="display: inline-block; margin-top: 24px; padding: 12px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; transition: background 0.2s;">Go to Dashboard</a>
            </div>
        `);
    }
    
    // Check if current system timestamp exceeds expiration limit
    if (Date.now() > Number(expires)) {
        return res.status(410).send(`
            <div style="font-family: 'Poppins', sans-serif; text-align: center; padding: 50px 20px;">
                <h1 style="color: #ef4444; font-size: 32px; margin-bottom: 12px;">⏰ Exam Link Expired (Timeout)</h1>
                <p style="color: #475569; font-size: 16px;">The active window to join this assessment has ended. Please request a new test invitation link from your admin.</p>
                <a href="/dashboard" style="display: inline-block; margin-top: 24px; padding: 12px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; transition: background 0.2s;">Go to Dashboard</a>
            </div>
        `);
    }
    
    next();
};

module.exports = {
    requireUser,
    requireAdmin,
    requireSuperAdmin,
    verifyExamLink
};
