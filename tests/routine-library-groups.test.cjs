"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const holidayMigration = fs.readFileSync(path.join(root, "supabase", "migrations", "20261006_allow_holiday_routine_role.sql"), "utf8");

function sourceFor(name) {
  const start = app.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist`);
  let depth = 0;
  let opened = false;
  for (let index = start; index < app.length; index += 1) {
    if (app[index] === "{") { depth += 1; opened = true; }
    else if (app[index] === "}" && --depth === 0 && opened) return app.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

const groups = [
  { key: "unassigned", label: "Unassigned", hideWhenEmpty: true },
  { key: "main", label: "Main workouts" },
  { key: "pre", label: "Pre workouts" },
  { key: "post", label: "Post workouts" },
  { key: "holiday", label: "Holiday", hideWhenEmpty: true }
];
const context = {
  ROUTINE_ROLE_ORDER: { pre: 0, main: 1, post: 2, holiday: 3 },
  ROUTINE_LIBRARY_GROUPS: groups
};
vm.createContext(context);
vm.runInContext([
  sourceFor("normalizeRoutineRole"),
  sourceFor("routineLibraryGroup"),
  sourceFor("groupSavedWorkouts")
].join("\n"), context);

const records = [
  { id: "u", designatedDays: [], routineRole: "main" },
  { id: "m1", designatedDays: [1], routineRole: "main" },
  { id: "p", designatedDays: [1], routineRole: "pre" },
  { id: "m2", designatedDays: [3], routineRole: "main" },
  { id: "post", designatedDays: [5], routineRole: "post" },
  { id: "trip", designatedDays: [], routineRole: "holiday" },
  { id: "trip-day", designatedDays: [6], routineRole: "holiday" }
];
const grouped = JSON.parse(JSON.stringify(context.groupSavedWorkouts(records)));
assert.deepEqual(grouped.unassigned.map((record) => record.id), ["u"]);
assert.deepEqual(grouped.main.map((record) => record.id), ["m1", "m2"]);
assert.deepEqual(grouped.pre.map((record) => record.id), ["p"]);
assert.deepEqual(grouped.post.map((record) => record.id), ["post"]);
assert.deepEqual(grouped.holiday.map((record) => record.id), ["trip", "trip-day"]);
assert.deepEqual(groups.map((group) => group.label), ["Unassigned", "Main workouts", "Pre workouts", "Post workouts", "Holiday"]);
assert.equal(groups.filter((group) => group.hideWhenEmpty).map((group) => group.key).join(), "unassigned,holiday");

let stored = records.map((record, sortOrder) => ({ ...record, sortOrder, updatedAt: 1 }));
Object.assign(context, {
  loadSavedWorkouts: () => stored,
  saveSavedWorkouts: (next) => { stored = next.map((record, sortOrder) => ({ ...record, sortOrder })); },
  queueSavedWorkoutUpserts: () => {},
  syncSavedWorkouts: () => Promise.resolve(),
  showToast: () => {},
  Date
});
vm.runInContext(sourceFor("reorderSavedWorkoutGroup"), context);
context.reorderSavedWorkoutGroup("main", ["m2", "m1"]);
assert.deepEqual(stored.map((record) => record.id), ["u", "m2", "p", "m1", "post", "trip", "trip-day"]);
assert.equal(stored.find((record) => record.id === "m2").routineRole, "main");
assert.deepEqual(stored.find((record) => record.id === "m2").designatedDays, [3]);

const renderSource = sourceFor("renderSavedWorkouts");
assert.match(renderSource, /document\.createElement\("details"\)/, "groups should use native collapsed disclosure sections");
assert.match(renderSource, /group\.hideWhenEmpty && groupRecords\.length === 0/, "empty Unassigned should be omitted");
assert.doesNotMatch(renderSource, /section\.open\s*=|setAttribute\("open"/, "groups must render collapsed by default");
assert.match(renderSource, /routine-library-group-count[\s\S]*String\(groupRecords\.length\)/);
assert.match(renderSource, /setupPointerSortable\(list,[\s\S]*reorderSavedWorkoutGroup/, "sorting should remain scoped to each group");
assert.match(styles, /\.routine-library-group-count \{[\s\S]*border-radius: 999px;/, "counts should use circular badges");
assert.match(html, /<span>Routine type<\/span>[\s\S]*<option value="holiday">Holiday<\/option>/);
assert.match(holidayMigration, /check \(routine_role in \('pre', 'main', 'post', 'holiday'\)\)/);
assert.match(app, /Holiday routine sync needs the included Supabase migration/);
assert.match(worker, /wellbeing-v52/);

console.log("Wellbeing Version 48 grouped Routine Library tests passed");
