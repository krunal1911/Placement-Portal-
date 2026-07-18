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

module.exports = {
    requireUser,
    requireAdmin,
    requireSuperAdmin
};
