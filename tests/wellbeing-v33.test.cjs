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

assert.match(html, /MOVE · BUILD · ASCEND/, "the compact Wellbeing header line should be present");
assert.doesNotMatch(html, /id="installButton"/, "the custom Install button should be removed");
assert.doesNotMatch(app, /beforeinstallprompt|setupInstallPrompt|deferredInstallPrompt/, "custom install-prompt handling should be removed");

assert.match(html, /class="saved-workout-drag-handle sortable-handle"/, "routines should expose a drag handle");
assert.match(html, /class="exercise-drag-handle sortable-handle"/, "exercises should expose a drag handle");
assert.match(app, /function setupPointerSortable\(/, "touch and pointer sorting should be implemented");
assert.doesNotMatch(html, /move-saved-workout-up|move-saved-workout-down|class="mini-icon move-up"|class="mini-icon move-down"/, "arrow sorting buttons should be removed");
assert.match(html, /class="saved-workout-preview-toggle"/, "routine exercise lists should be expandable");
assert.match(app, /expandedPreview = exerciseNames\.length \? exerciseNames\.join\(" • "\)/, "expanded routine previews should retain every exercise name");
assert.match(html, /routine-more-button/, "routine secondary actions should be compacted into an overflow menu");
assert.match(html, /delete-saved-workout danger-text[\s\S]*?<svg/, "routine deletion should use a bin icon");

const settingsPosition = html.indexOf('id="settingsScreen"');
const audioPosition = html.indexOf('id="voiceSettingsTitle"');
const setupPosition = html.indexOf('id="setupScreen"');
const routinesPosition = html.indexOf('id="savedWorkoutsScreen"');
assert.ok(audioPosition > settingsPosition, "audio controls should live in Settings");
assert.ok(audioPosition > routinesPosition && routinesPosition > setupPosition, "audio controls should no longer be in the Home/Forge form");

assert.match(html, /id="notificationsButton"/, "the header should include a notification bell");
assert.match(html, /id="notificationsScreen"/, "the app should include a manually cleared notification centre");
assert.match(html, /Daily weight · 07:00/, "the daily weight reminder should be configured");
assert.match(html, /Monday waist · 08:00/, "the weekly waist reminder should be configured");
assert.match(html, /Main workout · 16:00/, "the incomplete main-workout reminder should be configured");
assert.match(app, /action: "clear"/, "notification history should support manual clearing");
assert.match(worker, /addEventListener\("push"/, "the service worker should display Web Push messages");
assert.match(worker, /WELLBEING_OPEN_NOTIFICATIONS/, "notification taps should open the notification centre");

assert.match(migration, /create table if not exists public\.wellbeing_push_subscriptions/, "the migration should create push subscriptions");
assert.match(migration, /create table if not exists public\.wellbeing_notifications/, "the migration should create persistent notifications");
assert.match(migration, /enable row level security/, "notification data should use RLS");
assert.match(pushFunction, /parts\.hour === 7/, "weight reminders should dispatch in the 07:00 hour");
assert.match(pushFunction, /parts\.hour === 8 && parts\.weekday === "Mon"/, "waist reminders should dispatch on Monday at 08:00");
assert.match(pushFunction, /parts\.hour === 16/, "workout reminders should dispatch in the 16:00 hour");
assert.match(pushFunction, /eq\("status", "completed"\)/, "workout reminders should check completed sessions");
assert.match(pushFunction, /Last 7 days:[\s\S]*since first:/, "weight reminders should include both requested summaries");

assert.match(styles, /@media \(max-width: 620px\)[\s\S]*?min-height: 44px;/, "mobile form controls should be denser while retaining a touch target");

console.log("Wellbeing Version 33 feature tests passed");
