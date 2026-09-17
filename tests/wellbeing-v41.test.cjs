"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const wellness = fs.readFileSync(path.join(root, "wellness.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const pushFunction = fs.readFileSync(path.join(root, "supabase", "functions", "wellbeing-push", "index.ts"), "utf8");

assert.match(html, /id="weightQuickEntryDialog"[\s\S]*id="weightQuickEntryForm"[\s\S]*Cancel[\s\S]*Save weight/, "Home weight should open a Save/Cancel popup");
assert.match(html, /id="readinessQuickEntryDialog"[\s\S]*id="readinessQuickEntryForm"[\s\S]*Cancel[\s\S]*Save readiness/, "weight entry should continue to a Save/Cancel readiness popup");
assert.match(wellness, /finishQuickWellnessSave\("Weight saved\."\);[\s\S]*window\.setTimeout\(openReadinessQuickEntry, 900\)/, "successful weight entry should show its toast before continuing directly to readiness");
assert.match(wellness, /finishQuickWellnessSave\("Readiness saved\."\)/, "successful readiness entry should show a toast");
assert.match(app, /function openWeightEntryFromReminder\(\)[\s\S]*openWeightQuickEntry\(\)/, "the homepage weight action should use the direct popup");

assert.match(html, /id="waistQuickEntryDialog"[\s\S]*id="waistQuickEntryForm"[\s\S]*Cancel[\s\S]*Save waist/, "waist reminders should have a single-screen entry popup");
assert.match(pushFunction, /type === "waist" \? "\.\/\?waist=1"/, "waist pushes should deep-link directly to waist entry");
assert.match(worker, /WELLBEING_OPEN_WAIST/, "an open app should route waist notification taps directly to waist entry");
assert.match(app, /event\.data\?\.type === "WELLBEING_OPEN_WAIST"[\s\S]*openWaistEntryFromReminder\(\)/, "the app should open the waist popup from the service worker message");
assert.match(wellness, /finishQuickWellnessSave\("Waist measurement saved\."\)/, "successful waist entry should show a toast");

assert.equal((wellness.match(/class="overall-trend-line"/g) || []).length, 2, "weight and waist graphs should each connect their first and last visible entries");
assert.match(styles, /\.weight-chart \.overall-trend-line \{[\s\S]*stroke-dasharray:[\s\S]*opacity:/, "the overall trend connector should be faint and dotted");

assert.match(pushFunction, /select\("id, name, designated_days"\)[\s\S]*eq\("routine_role", "main"\)/, "the reminder should load every main routine");
assert.match(pushFunction, /scheduledRoutines = \(mainRoutines \|\| \[\]\)\.filter/, "the reminder text should still be based on today's scheduled main routines");
assert.match(pushFunction, /mainRoutineIds = \(mainRoutines \|\| \[\]\)\.map[\s\S]*\.in\("routine_id", mainRoutineIds\)/, "any completed main routine should suppress the 16:00 reminder");
assert.match(html, /Only when no main workout has been completed today/, "Settings should describe the updated reminder rule");

assert.match(html, /styles\.css\?v=46[\s\S]*wellness\.js\?v=46[\s\S]*app\.js\?v=46/, "Current assets should be cache-busted");
assert.match(worker, /wellbeing-v46/, "The current version should use a fresh offline cache");

console.log("Wellbeing Version 41 backlog tests passed");
