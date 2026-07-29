const crypto = require("crypto");

// Falls back to a fixed dev secret only if SESSION_SECRET isn't set, matching
// the rest of the app's session-secret handling.
const SECRET = process.env.SESSION_SECRET || "placementPortalSecret";

function base64url(str) {
    return Buffer.from(str, "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function base64urlDecode(str) {
    let s = str.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return Buffer.from(s, "base64").toString("utf8");
}

/**
 * Sign a payload into a compact, self-contained token: base64url(payload).hmacSignature
 * expiresInSeconds defaults to 12 hours.
 */
function sign(payload, expiresInSeconds = 12 * 60 * 60) {
    const body = Object.assign({}, payload, { exp: Date.now() + expiresInSeconds * 1000 });
    const encoded = base64url(JSON.stringify(body));
    const sig = crypto.createHmac("sha256", SECRET).update(encoded).digest("hex");
    return `${encoded}.${sig}`;
}

/**
 * Verify a token's signature and expiry. Returns the decoded payload, or null
 * if the token is missing, malformed, tampered with, or expired.
 */
function verify(token) {
    if (!token || typeof token !== "string" || token.indexOf(".") === -1) return null;
    const idx = token.lastIndexOf(".");
    const encoded = token.slice(0, idx);
    const sig = token.slice(idx + 1);
    if (!encoded || !sig) return null;

    const expected = crypto.createHmac("sha256", SECRET).update(encoded).digest("hex");
    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    let payload;
    try {
        payload = JSON.parse(base64urlDecode(encoded));
    } catch (e) {
        return null;
    }

    if (!payload || !payload.exp || Date.now() > payload.exp) return null;
    return payload;
}

module.exports = { sign, verify };
