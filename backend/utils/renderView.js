const path = require('path');
const fs = require('fs');

const viewCache = {};

function renderView(res, fileName) {
    try {
        if (!viewCache[fileName]) {
            const possiblePaths = [
                path.join(process.cwd(), 'frontend', 'views', fileName),
                path.join(__dirname, '../../frontend/views', fileName),
                path.join(__dirname, '../frontend/views', fileName)
            ];

            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    viewCache[fileName] = fs.readFileSync(p, 'utf8');
                    break;
                }
            }
        }

        if (viewCache[fileName]) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.send(viewCache[fileName]);
        }

        res.status(404).send(`View file "${fileName}" not found.`);
    } catch (err) {
        console.error(`Error rendering view "${fileName}":`, err);
        res.status(500).send("Internal Error Rendering View");
    }
}

module.exports = renderView;
