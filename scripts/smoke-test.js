const fs = require("fs");
const path = require("path");

const readFile = (relativePath) =>
  fs.readFileSync(path.join(__dirname, "..", relativePath), "utf-8");

const assertIncludes = (content, token, label) => {
  if (!content.includes(token)) {
    throw new Error(`Missing ${label}: ${token}`);
  }
};

const indexHtml = readFile("index.html");
const appJs = readFile("app.js");

[
  'id="last-refresh"',
  'id="feed-status"',
  'id="live-count"',
  'id="upcoming-count"',
  'id="news-list"',
  'id="results"',
  'id="schedule"',
].forEach((id) => assertIncludes(indexHtml, id, "required HTML id"));

["feedConfig", "updateDashboard", "setInterval(updateDashboard", "fetchWithTimeout"].forEach(
  (token) => assertIncludes(appJs, token, "required JS hook")
);

console.log("Smoke test passed: required DOM hooks and JS refresh logic found.");
