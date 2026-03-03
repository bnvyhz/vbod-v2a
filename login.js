// POST /api/login
// Checks password against VBOD_PASSWORD and sets signed HttpOnly cookie.

var auth = require('./_auth');

module.exports = function handler(req, res) {
    if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    var expectedPassword = process.env.VBOD_PASSWORD;
    var secret = process.env.AUTH_SECRET;

    if (!expectedPassword || !secret) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Server env vars are not configured' }));
        return;
    }

    var password = req.body && req.body.password;
    if (password !== expectedPassword) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Invalid credentials' }));
        return;
    }

    var now = Date.now();
    var sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    var payload = {
        iat: now,
        exp: now + sevenDaysMs
    };
    var token = auth.signToken(payload, secret);

    auth.setCookie(res, 'vbod_session', token, {
        httpOnly: true,
        path: '/',
        sameSite: 'Lax',
        secure: auth.isSecureRequest(req),
        maxAge: 7 * 24 * 60 * 60
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
};
