let app;

module.exports = async (req, res) => {
    try {
        if (!app) {
            app = require('../app');
        }
        return app(req, res);
    } catch (err) {
        console.error("Vercel Serverless Function Execution Error:", err);
        if (!res.headersSent) {
            res.status(500).json({
                error: "Serverless Function Execution Failed",
                message: err.message,
                stack: err.stack
            });
        }
    }
};
