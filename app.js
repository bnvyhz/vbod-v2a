/*
  vBoD V2A Frontend (ES5 only)
  ----------------------------------------
  - Uses server-side authentication via HttpOnly cookie.
  - Cookie cannot be read in JavaScript (by design).
  - Frontend asks /api/me and /api/board to determine auth + data.
*/

(function () {
    var appEl = document.getElementById('app');
    var selectedIndex = 0;
    var boardMembers = [];

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function request(url, options) {
        var opts = options || {};
        if (!opts.headers) {
            opts.headers = {};
        }
        // Same-origin API call. Include cookies.
        opts.credentials = 'same-origin';
        return fetch(url, opts);
    }

    function renderLoading(message) {
        appEl.innerHTML = '<div class="center-screen"><div class="card"><p class="info-line">' +
            escapeHtml(message || 'Loading...') +
            '</p></div></div>';
    }

    function renderLogin(errorMessage) {
        var errorHtml = '';
        if (errorMessage) {
            errorHtml = '<div class="error">' + escapeHtml(errorMessage) + '</div>';
        }

        appEl.innerHTML =
            '<div class="center-screen">' +
            '<div class="card">' +
            '<h1>vBoD Login</h1>' +
            '<label for="passwordInput">Password</label>' +
            '<input id="passwordInput" type="password" placeholder="Enter password" />' +
            '<button id="loginBtn" class="btn-primary" type="button">Login</button>' +
            errorHtml +
            '<div class="small-note">Demo only. Not secure.</div>' +
            '</div>' +
            '</div>';

        var input = document.getElementById('passwordInput');
        var button = document.getElementById('loginBtn');

        function doLogin() {
            var password = input.value;
            renderLoading('Logging in...');

            request('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: password })
            })
                .then(function (res) {
                    if (!res.ok) {
                        throw new Error('Invalid password.');
                    }
                    return loadDashboard();
                })
                .catch(function () {
                    renderLogin('Invalid password. Please try again.');
                });
        }

        button.onclick = doLogin;
        input.onkeypress = function (evt) {
            if (evt && evt.keyCode === 13) {
                doLogin();
            }
        };
    }

    function renderDashboard() {
        var memberButtonsHtml = '';
        var i;

        for (i = 0; i < boardMembers.length; i++) {
            memberButtonsHtml += '<li><button class="member-btn ' +
                (i === selectedIndex ? 'active' : '') +
                '" data-index="' + i + '">' +
                escapeHtml(boardMembers[i].name) +
                '</button></li>';
        }

        appEl.innerHTML =
            '<div class="dashboard">' +
            '<header class="header">' +
            '<h1>Virtual Board of Directors</h1>' +
            '<button id="logoutBtn" class="logout-btn" type="button">Logout</button>' +
            '</header>' +
            '<div class="layout">' +
            '<aside class="sidebar">' +
            '<h2>Board Members</h2>' +
            '<ul class="member-list">' + memberButtonsHtml + '</ul>' +
            '</aside>' +
            '<main id="detailPanel" class="main"></main>' +
            '</div>' +
            '</div>';

        var buttons = document.getElementsByClassName('member-btn');
        for (i = 0; i < buttons.length; i++) {
            buttons[i].onclick = function () {
                selectedIndex = parseInt(this.getAttribute('data-index'), 10);
                renderDashboard();
            };
        }

        document.getElementById('logoutBtn').onclick = function () {
            request('/api/logout', { method: 'POST' })
                .then(function () {
                    boardMembers = [];
                    selectedIndex = 0;
                    renderLogin();
                })
                .catch(function () {
                    // Even if logout call fails, return user to login view.
                    boardMembers = [];
                    selectedIndex = 0;
                    renderLogin();
                });
        };

        renderDetailPanel();
    }

    function listHtml(items) {
        var html = '';
        var i;
        for (i = 0; i < items.length; i++) {
            html += '<li>' + escapeHtml(items[i]) + '</li>';
        }
        return html;
    }

    function renderDetailPanel() {
        var member = boardMembers[selectedIndex];
        var detailEl = document.getElementById('detailPanel');

        detailEl.innerHTML =
            '<section class="panel">' +
            '<h2>' + escapeHtml(member.name) + '</h2>' +
            '<p class="meta">' + escapeHtml(member.title) + '</p>' +
            '<span class="tag">Subsystem: ' + escapeHtml(member.subsystem) + '</span>' +
            '<p>' + escapeHtml(member.mission) + '</p>' +
            '</section>' +
            '<section class="panel">' +
            '<h3>Key Metrics</h3>' +
            '<ul>' + listHtml(member.keyMetrics) + '</ul>' +
            '</section>' +
            '<section class="panel">' +
            '<h3>Key Questions</h3>' +
            '<ul>' + listHtml(member.keyQuestions) + '</ul>' +
            '</section>' +
            '<section class="panel">' +
            '<h3>System Connections</h3>' +
            '<ul>' + listHtml(member.connectsTo) + '</ul>' +
            '</section>';
    }

    function loadDashboard() {
        renderLoading('Loading board data...');

        return request('/api/board')
            .then(function (res) {
                if (res.status === 401) {
                    throw new Error('Please log in again');
                }
                if (!res.ok) {
                    throw new Error('Failed to load dashboard data');
                }
                return res.json();
            })
            .then(function (data) {
                boardMembers = data.members || [];
                selectedIndex = 0;

                if (!boardMembers.length) {
                    throw new Error('No board data found');
                }

                renderDashboard();
            })
            .catch(function (err) {
                if (err && err.message === 'Please log in again') {
                    renderLogin('Please log in again.');
                } else {
                    renderLogin('Could not load board data. Please try again.');
                }
            });
    }

    function init() {
        renderLoading('Checking session...');

        request('/api/me')
            .then(function (res) {
                if (!res.ok) {
                    throw new Error('Failed to check session');
                }
                return res.json();
            })
            .then(function (data) {
                if (data && data.authenticated) {
                    loadDashboard();
                } else {
                    renderLogin();
                }
            })
            .catch(function () {
                renderLogin('Unable to reach server. Is Vercel dev running?');
            });
    }

    init();
}());
