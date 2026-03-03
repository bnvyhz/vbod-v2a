// Authentication helper utilities for Vercel serverless functions.
// Token format:
//   base64(payloadJSON) + "." + hex(hmac_sha256(base64(payloadJSON), AUTH_SECRET))

var crypto = require('crypto');

function toBase64(text) {
    return Buffer.from(text, 'utf8').toString('base64');
}

function fromBase64(base64Text) {
    return Buffer.from(base64Text, 'base64').toString('utf8');
}

function hmacHex(value, secret) {
    return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function safeCompare(a, b) {
    var aBuf = Buffer.from(String(a), 'utf8');
    var bBuf = Buffer.from(String(b), 'utf8');
    if (aBuf.length !== bBuf.length) {
        return false;
    }
    return crypto.timingSafeEqual(aBuf, bBuf);
}

function signToken(payload, secret) {
    var payloadText = JSON.stringify(payload);
    var payloadB64 = toBase64(payloadText);
    var signature = hmacHex(payloadB64, secret);
    return payloadB64 + '.' + signature;
}

function verifyToken(token, secret) {
    if (!token || typeof token !== 'string') {
        return { valid: false, reason: 'missing_token' };
    }

    var parts = token.split('.');
    if (parts.length !== 2) {
        return { valid: false, reason: 'bad_format' };
    }

    var payloadB64 = parts[0];
    var signature = parts[1];
    var expectedSig = hmacHex(payloadB64, secret);

    if (!safeCompare(signature, expectedSig)) {
        return { valid: false, reason: 'bad_signature' };
    }

    var payload;
    try {
        payload = JSON.parse(fromBase64(payloadB64));
    } catch (err) {
        return { valid: false, reason: 'bad_payload' };
    }

    var now = Date.now();
    if (!payload || typeof payload.exp !== 'number' || payload.exp <= now) {
        return { valid: false, reason: 'expired' };
    }

    return { valid: true, payload: payload };
}

function getCookie(req, name) {
    var header = req.headers.cookie || '';
    var pairs = header.split(';');
    var i;

    for (i = 0; i < pairs.length; i++) {
        var part = pairs[i].trim();
        if (!part) {
            continue;
        }
        var eq = part.indexOf('=');
        if (eq === -1) {
            continue;
        }
        var key = part.slice(0, eq).trim();
        var val = part.slice(eq + 1).trim();
        if (key === name) {
            return decodeURIComponent(val);
        }
    }

    return null;
}

function isSecureRequest(req) {
    var proto = req.headers['x-forwarded-proto'];
    if (proto && String(proto).toLowerCase() === 'https') {
        return true;
    }
    // Fallback for environments where forwarded proto is not set.
    if (req.connection && req.connection.encrypted) {
        return true;
    }
    return false;
}

function setCookie(res, name, value, options) {
    var opts = options || {};
    var parts = [name + '=' + encodeURIComponent(value)];

    parts.push('Path=' + (opts.path || '/'));

    if (opts.httpOnly !== false) {
        parts.push('HttpOnly');
    }

    parts.push('SameSite=' + (opts.sameSite || 'Lax'));

    if (typeof opts.maxAge === 'number') {
        parts.push('Max-Age=' + String(opts.maxAge));
    }

    if (opts.expires) {
        parts.push('Expires=' + opts.expires.toUTCString());
    }

    if (opts.secure) {
        parts.push('Secure');
    }

    res.setHeader('Set-Cookie', parts.join('; '));
}

module.exports = {
    signToken: signToken,
    verifyToken: verifyToken,
    getCookie: getCookie,
    setCookie: setCookie,
    isSecureRequest: isSecureRequest
};
