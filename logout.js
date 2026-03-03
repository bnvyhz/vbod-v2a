// POST /api/logout
// Clears vbod_session cookie.

var auth = require('./_auth');

module.exports = function handler(req, res) {
    if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    auth.setCookie(res, 'vbod_session', '', {
        httpOnly: true,
        path: '/',
        sameSite: 'Lax',
        secure: auth.isSecureRequest(req),
        maxAge: 0,
        expires: new Date(0)
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
};
