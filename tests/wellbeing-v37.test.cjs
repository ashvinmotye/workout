"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase", "migrations", "20260903_create_wellbeing_notifications.sql"), "utf8");
const pushFunction = fs.readFileSync(path.join(root, "supabase", "functions", "wellbeing-push", "index.ts"), "utf8");

assert.match(migration, /is_read boolean not null default false/, "notifications should retain read state");
assert.match(pushFunction, /select\("id, type, title, body, is_read, read_at, created_at"\)/, "notification state should return read fields");
assert.match(pushFunction, /gte\("created_at", zonedBoundaryIso\(today/, "notification state should start at the user's local day");
assert.match(pushFunction, /lt\("created_at", zonedBoundaryIso\(tomorrow/, "notification state should end at the next local day");
assert.match(pushFunction, /update\(\{ is_read: true, read_at:/, "read actions should update instead of delete");
assert.match(app, /unreadCount = notificationRecords\.filter/, "the bell badge should count only unread reminders");
assert.match(app, /article\.classList\.toggle\("is-read"/, "read reminders should remain rendered");

assert.match(pushFunction, /type === "weight"[\s\S]*?"\.\/\?weight=1"/, "weight pushes should deep-link to weight entry");
assert.match(worker, /WELLBEING_OPEN_WEIGHT/, "an open app should route weight taps directly to entry");
assert.match(html, /id="weightReminderSlab"/, "a missing-weight fallback slab should be available");
assert.match(html, /Snooze 1 hour[\s\S]*Dismiss for today[\s\S]*Save weight/, "the fallback slab should expose all requested actions");

assert.match(styles, /\.saved-workout-name,[\s\S]*?white-space: normal;[\s\S]*?overflow-wrap: anywhere;/, "routine titles should wrap without truncation");
assert.match(html, /saved-workout-loaded-state[\s\S]*loaded-checkmark/, "loaded state should use a footer checkmark");
assert.match(styles, /\.saved-workout-card-controls \{[\s\S]*?border-top: 1px solid var\(--line\);/, "routine actions should live in a divided footer");
assert.match(app, /Equipment ·/, "routine equipment should be shown in the library");

assert.match(html, /id="chartPopover"/, "charts should have a visible exact-value popover");
assert.match(app, /makeChartValueInteractive\(group/, "activity bars should be tappable");
assert.match(app, /makeChartValueInteractive\(column/, "load bars should be tappable");

assert.match(html, /copyCompleteSessionForAiButton/, "completed sessions should expose Copy for AI");
assert.match(app, /comparable_previous_sessions/, "AI export should include comparable sessions");
assert.match(app, /wellbeing_trends: trendContextForAi/, "AI export should include body and recovery trends");
assert.match(app, /training_context: loadTrainingContext/, "AI export should include current phase and goals");
assert.match(app, /weight_or_equipment:[\s\S]*sets_completed:/, "AI export should include exercise load and sets");

console.log("Wellbeing Version 37 backlog tests passed");
