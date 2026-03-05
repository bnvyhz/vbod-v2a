// POST /api/admin-board
// Updates data/board.json for authenticated sessions.

var fs = require('fs');
var path = require('path');
var auth = require('./_auth');

module.exports = function handler(req, res) {
    if (req.method !== 'POST') {
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

    var session = auth.getCookie(req, 'vbod_session');
    var verification = auth.verifyToken(session, secret);

    if (!verification || !verification.valid) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
    }

    var payload = req.body;
    if (!payload || typeof payload !== 'object' || !payload.members || !payload.site) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Invalid board payload' }));
        return;
    }

    try {
        var filePath = path.join(process.cwd(), 'data', 'board.json');
        fs.writeFileSync(filePath, JSON.stringify(payload, null, 4), 'utf8');

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
    } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Failed to save board.json' }));
    }
};
