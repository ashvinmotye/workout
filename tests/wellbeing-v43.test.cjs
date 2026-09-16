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
  for (let index = app.indexOf(") {", start) + 2; index < app.length; index += 1) {
    if (app[index] === "{") depth += 1;
    else if (app[index] === "}" && --depth === 0) return app.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

const storage = new Map();
const context = {
  defaultWorkout: () => ({
    name: "Default", rounds: 3, roundRest: 60, prepTime: 0, defaultRest: 20,
    exercises: [{ id: "default", name: "Squats", mode: "reps", value: 10, rest: 20, note: "" }]
  }),
  uid: () => "new-exercise",
  sessionUid: () => "session-test",
  PHASE: { ACTIVE_REPS: "active-reps", ACTIVE_TIME: "active-time", ROUND_REST: "round-rest" },
  localStorage: { setItem: (key, value) => storage.set(key, value) },
  SESSION_KEY: "saved-session",
  getElapsedDurationMs: () => 5000,
  loadWorkoutHistory: () => [],
  saveWorkoutHistory: () => {},
  queueHistoryUpsert: () => {},
  renderTrends: () => {},
  syncWorkoutHistory: () => Promise.resolve(),
  updateWorkoutDisplay: () => {},
  playTone: () => {},
  announceExercise: () => {},
  announceRoundComplete: () => {},
  resumeSessionClock: () => {},
  pauseSessionClock: () => {},
  clearTimer: () => {},
  persistSession: () => {},
  completeWorkout: () => { context.completed = true; },
  startTimer: (callback) => { context.timerComplete = callback; }
};
vm.createContext(context);
vm.runInContext([
  "const SESSION_KEY = 'saved-session';", // The real persistence function reads this constant.
  ...[
    "clampInteger", "normalizeWorkout", "allWorkoutExercises", "totalWorkoutRounds",
    "formatRoutineWeight", "getRoutineWeightLabels",
    "cloneWorkout", "createEmptyRuntime", "currentCircuit", "currentExercise",
    "startExercise", "finishCurrentExercise", "startRoundRest", "advanceAfterRoundRest",
    "normalizeHistoryExercise", "recordWorkoutSession"
  ].map(sourceFor)
].join("\n"), context);

const legacy = context.normalizeWorkout({
  name: "Old routine", rounds: 2, roundRest: 12,
  exercises: [{ id: "old", name: "Squat", mode: "reps", value: 10, rest: 0 }]
});
assert.equal(legacy.circuits.length, 1);
assert.equal(legacy.circuits[0].roundRest, 12);

const workout = context.normalizeWorkout({
  name: "Two circuits", prepTime: 0,
  circuits: [
    { name: "Strength", rounds: 2, roundRest: 7, exercises: [{ id: "s", name: "Squat", mode: "reps", value: 10, rest: 0 }] },
    { name: "Cardio", rounds: 1, roundRest: 30, exercises: [{ id: "c", name: "Run", mode: "reps", value: 1, rest: 0 }] }
  ]
});
assert.equal(context.totalWorkoutRounds(workout), 3);
assert.equal(context.allWorkoutExercises(workout).length, 2);
workout.circuits[1].exercises[0].weight = "12";
assert.deepEqual(Array.from(context.getRoutineWeightLabels(workout)), ["12kg"]);
const copy = context.cloneWorkout(workout, true);
assert.notEqual(copy.circuits[0].exercises[0].id, "s");
assert.notEqual(copy.circuits[1].exercises[0].id, "c");
assert.equal(copy.exercises, copy.circuits[0].exercises);

context.workout = workout;
context.runtime = context.createEmptyRuntime();
context.runtime.startedAt = Date.now();
context.runtime.exerciseCompletionCounts = [0, 0];
context.setPhase = (phase, seconds) => {
  context.runtime.phase = phase;
  context.runtime.remainingSeconds = seconds;
  context.runtime.totalSeconds = seconds;
  context.runtime.paused = false;
};
context.startExercise(0, 0);
context.finishCurrentExercise();
assert.equal(context.runtime.phase, "round-rest");
assert.equal(context.runtime.nextCircuitIndex, 0);
assert.equal(context.runtime.remainingSeconds, 7);
context.timerComplete();
assert.equal(context.runtime.roundIndex, 1);
context.finishCurrentExercise();
assert.equal(context.runtime.phase, "round-rest");
assert.equal(context.runtime.nextCircuitIndex, 1);
assert.equal(context.runtime.completedRounds, 2);

const partial = context.recordWorkoutSession("partial");
assert.equal(partial.plannedRounds, 3);
assert.equal(partial.completedRounds, 2);
assert.deepEqual(Array.from(partial.exercises, (item) => item.completedSets), [2, 0]);
assert.deepEqual(Array.from(partial.exercises, (item) => item.circuitName), ["Strength", "Cardio"]);
assert.equal(context.normalizeHistoryExercise(partial.exercises[1]).circuitName, "Cardio");
context.runtime.historyRecorded = false;

context.getSavedSession = () => JSON.parse(storage.get("saved-session"));
context.updateVoiceToggle = () => {};
context.showScreen = () => {};
context.getAudioContext = () => null;
context.requestWakeLock = () => {};
vm.runInContext([
  sourceFor("persistSession"),
  sourceFor("resumeSavedSession"),
  sourceFor("resumeTimerForCurrentPhase")
].join("\n"), context);
context.persistSession();
assert.equal(context.getSavedSession().runtime.nextCircuitIndex, 1);
context.workout = null;
context.runtime = context.createEmptyRuntime();
context.resumeSavedSession();
assert.equal(context.runtime.paused, true);
assert.equal(context.runtime.phase, "round-rest");
assert.equal(context.runtime.nextCircuitIndex, 1);
context.resumeTimerForCurrentPhase();
context.timerComplete();
assert.equal(context.runtime.circuitIndex, 1);
assert.equal(context.runtime.roundIndex, 0);
context.finishCurrentExercise();
assert.equal(context.completed, true, "final circuit should end without its last round rest");
assert.deepEqual(Array.from(context.runtime.exerciseCompletionCounts), [2, 1]);

assert.match(html, /id="addCircuitButton"/);
assert.match(html, /id="circuitsContainer"[\s\S]*id="firstCircuit"/);
assert.match(html, /Version 43/);
assert.match(worker, /wellbeing-v43/);
console.log("Wellbeing Version 43 circuit transitions passed");
