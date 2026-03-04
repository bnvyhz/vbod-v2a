// api/board.js
var fs = require("fs");
var path = require("path");
var auth = require("./_auth");

// Reads board data from /data/board.json and only returns it if logged in.
module.exports = function (req, res) {
  // 1) Check authentication
  var session = auth.getCookie(req, "vbod_session");
  var ok = auth.verifyToken(session, process.env.AUTH_SECRET);

  if (!ok) {
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
