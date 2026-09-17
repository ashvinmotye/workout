"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

assert.match(html, /id="loadedWorkoutOverview"[\s\S]*id="startLoadedWorkoutButton"[\s\S]*id="editLoadedWorkoutButton"/, "Home should expose loaded-workout actions");
assert.match(html, /id="editLoadedWorkoutButton"[\s\S]*aria-label="Edit loaded workout"[\s\S]*<svg/, "the edit action should be an accessible icon-only button");
assert.match(html, /id="loadedSessionSettingsTitle">Session settings<[\s\S]*id="loadedSessionSettings"/, "read-only Home should have session settings");
assert.match(html, /id="loadedCircuitTitle">Exercises<[\s\S]*id="loadedExerciseList"/, "read-only Home should show the routine exercises");

assert.match(app, /const showReadonly = Boolean\(record\) && !setupEditMode;/, "a loaded routine should control read-only mode");
assert.match(app, /dom\.loadedWorkoutOverview\.hidden = !showReadonly;[\s\S]*dom\.workoutForm\.hidden = showReadonly;/, "Home should switch between overview and editor");
assert.match(app, /function startLoadedWorkout\(\)[\s\S]*startWorkout\(cloneWorkout\(record\.workout, false\)\)/, "the CTA should start the stored loaded workout");
assert.match(app, /function editLoadedWorkout\(\)[\s\S]*setupEditMode = true;[\s\S]*populateForm\(cloneWorkout\(record\.workout, false\)\)/, "the icon action should open the loaded routine in edit mode");
assert.match(app, /function startNewWorkout\(\)[\s\S]*setupEditMode = true;[\s\S]*setActiveSavedWorkoutId\(null\)/, "no loaded routine should open data-entry mode");
assert.match(app, /setActiveSavedWorkoutId\(record\.id\);[\s\S]*setupEditMode = false;[\s\S]*renderSetupHomepage\(\);/, "saving should return Home to read-only mode");
assert.match(app, /formatRoutineWeight\(exercise\.weight\) \|\| "None"/, "exercise cards should show equipment requirements");

assert.match(styles, /\.home-workout-cta-actions #startLoadedWorkoutButton \{[\s\S]*min-width: 220px;/, "the read-only start action should be visually prominent");
assert.match(styles, /\.loaded-workout-edit-button \{[\s\S]*width: 60px;/, "the edit action should remain a compact square target");
assert.match(worker, /wellbeing-v45/, "the current app should retain a fresh offline cache");

console.log("Wellbeing Version 38 homepage tests passed");
