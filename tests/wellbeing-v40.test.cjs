"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

assert.match(app, /meta\.className = "loaded-exercise-meta";[\s\S]*\.join\(" • "\)/, "loaded exercise metadata should render as one joined line");
assert.match(styles, /\.loaded-exercise-meta \{[\s\S]*white-space: nowrap;/, "exercise metadata should remain on one line");
assert.match(styles, /\.history-status \{[\s\S]*padding-right: 0;[\s\S]*padding-left: 0;/, "session status labels should have no horizontal padding");
assert.match(styles, /\.saved-workouts-hero-actions \{[\s\S]*margin-top: 28px;/, "the Routines CTA should be separated from its title");
assert.match(styles, /\.weight-form-grid input\[name="measurementDate"\],[\s\S]*\.weight-form-grid input\[name="weightKg"\],[\s\S]*height: 50px;[\s\S]*min-height: 50px;/, "weight date and value controls should share a desktop height");
assert.match(styles, /@media \(max-width: 620px\) \{[\s\S]*\.weight-form-grid input\[name="measurementDate"\],[\s\S]*height: 38px;[\s\S]*min-height: 38px;/, "weight date and value controls should share a mobile height");
assert.match(worker, /wellbeing-v42/, "the current app should retain a fresh offline cache");

console.log("Wellbeing Version 40 alignment tests passed");
