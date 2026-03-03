// GET /api/board
// Returns protected board data only for authenticated requests.

var auth = require('./_auth');

// Server-side board data. This is never exposed unless auth succeeds.
var boardMembers = [
    {
        name: 'Ava Patel',
        title: 'Operations Director',
        subsystem: 'Operations',
        mission: 'Keep daily execution consistent while removing bottlenecks across teams.',
        keyMetrics: ['Cycle Time', 'On-Time Delivery', 'Process Compliance'],
        keyQuestions: [
            'Where are work handoffs slowing down?',
            'Which process adds cost without adding value?',
            'What automation can remove repetitive work?'
        ],
        connectsTo: ['Finance', 'Sales', 'IT']
    },
    {
        name: 'Noah Rivera',
        title: 'Finance Director',
        subsystem: 'Finance',
        mission: 'Protect cash flow and allocate capital to the highest-return initiatives.',
        keyMetrics: ['Runway', 'Gross Margin', 'Budget Variance'],
        keyQuestions: [
            'Which initiatives are underperforming financially?',
            'How much runway remains at current burn?',
            'Where should we reinvest savings first?'
        ],
        connectsTo: ['Operations', 'Sales', 'Risk']
    },
    {
        name: 'Maya Chen',
        title: 'Technology Director',
        subsystem: 'IT',
        mission: 'Provide reliable systems that scale securely with business growth.',
        keyMetrics: ['System Uptime', 'Incident Response Time', 'Release Stability'],
        keyQuestions: [
            'What risks threaten platform availability?',
            'Which upgrades reduce support overhead?',
            'How do we improve deployment confidence?'
        ],
        connectsTo: ['Operations', 'Risk', 'Product']
    },
    {
        name: 'Liam Okafor',
        title: 'Sales Director',
        subsystem: 'Sales',
        mission: 'Grow predictable revenue by aligning pipeline quality with customer needs.',
        keyMetrics: ['Pipeline Coverage', 'Win Rate', 'Average Deal Size'],
        keyQuestions: [
            'Where are deals stalling in the funnel?',
            'Which segment shows strongest conversion?',
            'How can we shorten the sales cycle?'
        ],
        connectsTo: ['Marketing', 'Finance', 'Operations']
    },
    {
        name: 'Sofia Anders',
        title: 'Risk & Compliance Director',
        subsystem: 'Risk',
        mission: 'Reduce operational and regulatory risk while enabling fast decision making.',
        keyMetrics: ['Open Risk Items', 'Audit Findings', 'Policy Adoption Rate'],
        keyQuestions: [
            'What critical risks need immediate mitigation?',
            'Which controls are weak or outdated?',
            'Where is policy training incomplete?'
        ],
        connectsTo: ['Finance', 'IT', 'Legal']
    }
];

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

    if (!result.valid) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ members: boardMembers }));
};
