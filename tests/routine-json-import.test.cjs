"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

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

let uid = 0;
const context = {
  MAX_ROUTINE_IMPORT_COUNT: 100,
  loadSavedWorkouts: () => [],
  workoutUid: () => `imported-${++uid}`,
  normalizeDesignatedDays: (days) => Array.isArray(days) ? days.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6) : [],
  normalizeRoutineRole: (role) => ["pre", "main", "post", "holiday"].includes(role) ? role : "main",
  cloneWorkout: (workout) => ({
    ...JSON.parse(JSON.stringify(workout)),
    exercises: workout.exercises.map((exercise, index) => ({ ...exercise, id: `exercise-${uid}-${index}` }))
  })
};
vm.createContext(context);
vm.runInContext([
  sourceFor("isObject"),
  sourceFor("makeUniqueWorkoutName"),
  sourceFor("routineImportCandidates"),
  sourceFor("validateRoutineImportCandidate"),
  sourceFor("prepareRoutineImport")
].join("\n"), context);

const existing = [{ id: "existing", workout: { name: "Morning" } }];
const imported = context.prepareRoutineImport({
  routines: [
    { name: "Morning", rounds: 2, exercises: [{ name: "Squat", mode: "reps", value: 10 }] },
    {
      id: "existing",
      designated_days: [1, 3],
      routine_role: "pre",
      workout: { name: "Morning", rounds: 1, exercises: [{ name: "Mobility", mode: "time", value: 30 }] }
    }
  ]
}, existing, 1000);

assert.deepEqual(imported.map((record) => record.workout.name), ["Morning 2", "Morning 3"]);
assert.deepEqual(imported.map((record) => record.id), ["imported-1", "imported-2"]);
assert.ok(imported.every((record) => record.id !== "existing"), "imports must never reuse an existing routine ID");
assert.deepEqual(imported[1].designatedDays, [1, 3]);
assert.equal(imported[1].routineRole, "pre");
assert.equal(existing[0].workout.name, "Morning", "preparing an import must not mutate existing routines");

assert.equal(context.routineImportCandidates({ data: { savedWorkouts: [imported[0]] } }).length, 1);
assert.equal(context.routineImportCandidates([{ name: "One", exercises: [{}] }]).length, 1);
assert.throws(() => context.prepareRoutineImport({ routines: [] }, existing), /No routines/);
assert.throws(
  () => context.prepareRoutineImport({ name: "Broken", exercises: [] }, existing),
  /at least one exercise/
);
assert.throws(
  () => context.prepareRoutineImport({ name: "Broken", exercises: [{ mode: "reps" }] }, existing),
  /needs a name/
);

assert.match(html, /id="routineImportTitle">Add routines from JSON</);
assert.match(html, /id="importRoutinesButton"[^>]*>Import routines JSON</);
assert.match(html, /Imported routines are added to your library; existing routines and other data stay unchanged\./);
assert.match(app, /saveSavedWorkouts\(\[\.\.\.existing, \.\.\.imported\]\)/, "routine import should append in one local save");
assert.match(app, /queueSavedWorkoutUpserts\(savedImports\)/, "imports should use the existing offline sync queue");
assert.match(app, /importRoutinesInput\.addEventListener\("change", importRoutinesFile\)/);
assert.match(worker, /wellbeing-v50/);

console.log("Wellbeing Version 49 additive routine JSON import tests passed");
