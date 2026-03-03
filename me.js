// GET /api/me
// Returns authenticated: true/false based on cookie token verification.

var auth = require('./_auth');

module.exports = function handler(req, res) {
    if (req.method !== 'GET') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    var secret = process.env.AUTH_SECRET;
    if (!secret) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'AUTH_SECRET is missing' }));
        return;
    }

    var token = auth.getCookie(req, 'vbod_session');
    var result = auth.verifyToken(token, secret);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ authenticated: !!result.valid }));
};
