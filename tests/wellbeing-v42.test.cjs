"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));

assert.match(html, /id="recordManualSessionEmptyButton"[\s\S]*id="recordManualSessionButton"/, "manual recording should be available with or without history");
assert.match(html, /id="manualSessionDialog"[\s\S]*name="workoutName"[\s\S]*name="sessionDate"[\s\S]*name="durationHours"[\s\S]*name="rpe"[\s\S]*name="zone5Minutes"[\s\S]*name="notes"/, "manual entry should include the full post-session data set");
assert.match(app, /function manualRoutineUid\(\)[\s\S]*manual-workout-/, "new manual workouts should receive a stable comparison identity");
assert.match(app, /function resolveManualRoutineId[\s\S]*selectedRoutineId[\s\S]*editingManualRoutineId[\s\S]*matchingTemplate/, "selection, edits and matching names should reuse an existing workout identity");
assert.match(app, /edit-manual-session[\s\S]*openManualSessionDialog\(record\)/, "manual history cards should be editable");
assert.match(app, /queueHistoryUpsert\(updated\)[\s\S]*syncWorkoutHistory/, "manual changes should use the existing offline sync queue");

assert.match(app, /session notes with equal weight to the numerical metrics/, "AI copy should explicitly give session notes equal importance");
assert.match(app, /entry_method: isManualSession\(record\) \? "manual"/, "AI exports should identify manual entries");

assert.match(app, /AUTH_SESSION_CHECK_TIMEOUT_MS = 4000/, "session checks should have a finite timeout");
assert.match(app, /Promise\.race\(\[sessionCheck, timeout\]\)/, "authentication should not wait indefinitely for the network");
assert.match(app, /catch \(error\) \{[\s\S]*if \(cachedUser\)[\s\S]*offline: true/, "cached users should enter the local app after a failed or timed-out check");

assert.match(html, /fonts\.googleapis\.com\/css2\?family=Inter/, "Inter should be loaded from Google Fonts");
assert.match(html, /id="appVersion"[^>]*>Version 42</, "Settings should show the cache-visible version discreetly");
assert.match(html, /id="voiceToggleButton"[\s\S]*class="speaker-svg"[\s\S]*M11\.553 3\.064/, "the supplied speaker SVG should replace the emoji");
assert.doesNotMatch(app, /voiceToggleButton\.textContent = runtime\.voiceEnabled/, "voice state changes should preserve the SVG");
assert.match(styles, /Version 42:[\s\S]*theme-toggle-button:hover \.header-svg,[\s\S]*transform: none;/, "theme and Settings icons should not animate on hover");
assert.match(styles, /--minimal-navy: #191919;/, "the main charcoal should be #191919");
assert.equal(manifest.theme_color, "#191919");
assert.match(worker, /wellbeing-v42/);
assert.match(html, /styles\.css\?v=42[\s\S]*wellness\.js\?v=42[\s\S]*app\.js\?v=42/);

console.log("Wellbeing Version 42 change-set tests passed");
