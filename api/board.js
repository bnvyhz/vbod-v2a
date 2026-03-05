// api/board.js
var fs = require("fs");
var path = require("path");
var auth = require("./_auth");

// Reads board data from /data/board.json and only returns it if logged in.
module.exports = function (req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  var secret = process.env.AUTH_SECRET;
  if (!secret) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "AUTH_SECRET is missing" }));
    return;
  }

  // 1) Check authentication
  var session = auth.getCookie(req, "vbod_session");
  var verification = auth.verifyToken(session, secret);

  if (!verification || !verification.valid) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  // 2) Load JSON file from /data/board.json
  try {
    var filePath = path.join(process.cwd(), "data", "board.json");
    var raw = fs.readFileSync(filePath, "utf8");
    var data = JSON.parse(raw);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Failed to load board.json",
        details: String(e && e.message ? e.message : e),
      })
    );
  }
};
