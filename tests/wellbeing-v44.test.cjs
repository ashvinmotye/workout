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

class Element {
  constructor() { this.children = []; this.listeners = {}; this.disabled = false; }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = [...items]; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  setAttribute(name, value) { this[name] = value; }
  focus() {}
}

const one = { id: "monday", workout: {
  name: "Monday", rounds: 2, roundRest: 5, prepTime: 0, defaultRest: 0,
  exercises: [{ id: "s", name: "Squat", mode: "reps", value: 10, rest: 0, weight: "", note: "" }]
} };
const two = { id: "cardio", workout: {
  name: "Cardio", rounds: 1, roundRest: 18, prepTime: 0, defaultRest: 0,
  exercises: [{ id: "c", name: "Shuttle", mode: "reps", value: 2, rest: 0, weight: "", note: "" }]
} };
const originalRecords = JSON.stringify([one, two]);
const savedSettings = [];
const history = [];
const storage = new Map();
const context = {
  document: { createElement: () => new Element() },
  dom: {
    circuitRoutineList: new Element(), circuitRoutineSelect: new Element(),
    startCircuitButton: new Element(), circuitSelectionHint: new Element(),
    completeWorkoutName: new Element(), completeSummary: new Element()
  },
  PHASE: { PREP: "prep", ACTIVE_REPS: "active-reps", ACTIVE_TIME: "active-time", ROUND_REST: "round-rest", COMPLETE: "complete" },
  defaultWorkout: () => ({ name: "Default", rounds: 1, roundRest: 5, prepTime: 0, defaultRest: 0, exercises: [{ name: "Default", mode: "reps", value: 1, rest: 0 }] }),
  uid: () => "exercise-new",
  sessionUid: () => "session-test",
  loadSavedWorkouts: () => [one, two],
  saveSettings: (settings) => savedSettings.push(settings),
  findSavedWorkout: (id) => [one, two].find((item) => item.id === id),
  closeCircuitDialog: () => { context.selectedCircuitRoutineIds = []; },
  clearSavedSession: () => {},
  updateVoiceToggle: () => {},
  showScreen: () => {},
  getAudioContext: () => null,
  requestWakeLock: () => {},
  releaseWakeLock: () => {},
  cancelSpeech: () => {},
  playTone: () => {},
  speak: () => {},
  updateWorkoutDisplay: () => {},
  announceExercise: () => {},
  announceRoundComplete: () => {},
  startTimer: (callback) => { context.timerComplete = callback; },
  clearTimer: () => {},
  persistSession: () => {},
  resumeSessionClock: () => {},
  pauseSessionClock: () => {},
  getElapsedDurationMs: () => 60000,
  loadWorkoutHistory: () => [...history],
  saveWorkoutHistory: (records) => { history.splice(0, history.length, ...records); },
  queueHistoryUpsert: () => {},
  renderTrends: () => {},
  syncWorkoutHistory: () => Promise.resolve(),
  prepareCompleteSessionReview: () => {},
  localStorage: { setItem: (key, value) => storage.set(key, value) },
  SESSION_KEY: "session",
  getSavedSession: () => JSON.parse(storage.get("session"))
};
vm.createContext(context);
vm.runInContext([
  "var workout = null, routineSequence = null, selectedCircuitRoutineIds = [], activeSavedWorkoutId = null, runtime = createEmptyRuntime();",
  ...[
    "clampInteger", "normalizeWorkout", "cloneWorkout", "createEmptyRuntime",
    "renderCircuitSelection", "startConfiguredCircuit", "sequenceExercises", "sequenceRounds",
    "previousSequenceRounds", "sequenceExerciseOffset", "circuitSessionName", "circuitRoutineId",
    "startWorkout", "startExercise", "currentExercise", "finishCurrentExercise", "startExerciseRest",
    "startRoundRest", "advanceAfterRoundRest", "completeWorkout", "recordWorkoutSession",
    "normalizeHistoryExercise"
  ].map(sourceFor)
].join("\n"), context);
context.setPhase = (phase, seconds) => {
  context.runtime.phase = phase;
  context.runtime.remainingSeconds = seconds;
  context.runtime.totalSeconds = seconds;
  context.runtime.paused = false;
};

context.renderCircuitSelection();
assert.deepEqual(context.dom.circuitRoutineSelect.children.map((item) => item.value), ["", "monday", "cardio"]);
context.selectedCircuitRoutineIds.push("monday");
context.renderCircuitSelection();
assert.deepEqual(context.dom.circuitRoutineSelect.children.map((item) => item.value), ["", "cardio"]);
assert.equal(context.dom.startCircuitButton.disabled, true);
context.dom.circuitRoutineList.children[0].children[1].listeners.click();
assert.deepEqual(context.dom.circuitRoutineSelect.children.map((item) => item.value), ["", "monday", "cardio"]);

context.selectedCircuitRoutineIds.push("monday", "cardio");
context.renderCircuitSelection();
assert.equal(context.dom.startCircuitButton.disabled, false);
assert.notEqual(context.circuitRoutineId([one, two]), context.circuitRoutineId([two, one]));
context.startConfiguredCircuit();
assert.equal(context.routineSequence.length, 2);
assert.equal(context.workout.name, "Monday");
assert.equal(savedSettings.length, 0, "a circuit must not overwrite the workout draft");
assert.equal(JSON.stringify([one, two]), originalRecords, "saved routines must remain intact");

context.finishCurrentExercise();
assert.equal(context.runtime.phase, "round-rest");
assert.equal(context.runtime.remainingSeconds, 5);
assert.equal(context.runtime.pendingNextRoutine, false);
context.timerComplete();
assert.equal(context.runtime.roundIndex, 1);
context.finishCurrentExercise();
assert.equal(context.runtime.phase, "round-rest");
assert.equal(context.runtime.pendingNextRoutine, true);
assert.equal(context.runtime.sequenceIndex, 0);

vm.runInContext([
  sourceFor("persistSession"), sourceFor("resumeSavedSession"), sourceFor("resumeTimerForCurrentPhase")
].join("\n"), context);
context.persistSession();
context.workout = null;
context.routineSequence = null;
context.runtime = context.createEmptyRuntime();
context.resumeSavedSession();
assert.equal(context.runtime.paused, true);
assert.equal(context.runtime.pendingNextRoutine, true);
assert.equal(context.runtime.sequenceIndex, 0);
context.resumeTimerForCurrentPhase();
context.timerComplete();
assert.equal(context.workout.name, "Cardio");
assert.equal(context.runtime.sequenceIndex, 1);
context.finishCurrentExercise();
assert.equal(context.runtime.phase, "complete", "the final routine must finish without extra rest");
assert.equal(history.length, 1);
assert.equal(history[0].plannedRounds, 3);
assert.equal(history[0].completedRounds, 3);
assert.equal(history[0].routineId, context.circuitRoutineId([one, two]));
assert.deepEqual(Array.from(history[0].exercises, (item) => item.completedSets), [2, 1]);
assert.deepEqual(Array.from(history[0].exercises, (item) => item.circuitName), ["Monday", "Cardio"]);
assert.equal(context.normalizeHistoryExercise(history[0].exercises[1]).circuitName, "Cardio");

context.startWorkout(one.workout, { sequence: [one, two] });
context.finishCurrentExercise();
const partial = context.recordWorkoutSession("partial");
assert.equal(partial.plannedRounds, 3);
assert.equal(partial.completedRounds, 1);
assert.deepEqual(Array.from(partial.exercises, (item) => item.completedSets), [1, 0]);

const noRest = { id: "no-rest", workout: { ...one.workout, rounds: 1, roundRest: 0 } };
context.startWorkout(noRest.workout, { sequence: [noRest, two] });
context.finishCurrentExercise();
assert.equal(context.runtime.sequenceIndex, 1, "zero rest should start the next routine immediately");
assert.equal(context.workout.name, "Cardio");

context.startWorkout(one.workout);
assert.equal(context.routineSequence, null);
assert.equal(savedSettings.length, 1, "standalone Start workout retains its draft behavior");
assert.equal(context.runtime.routineId, null);
assert.equal(JSON.stringify([one, two]), originalRecords);

assert.match(html, /id="configureCircuitButton"[\s\S]*id="configureCircuitDialog"[\s\S]*id="circuitRoutineSelect"/);
assert.doesNotMatch(html, /id="addCircuitButton"|id="circuitsContainer"/, "the routine editor must have no circuit controls");
assert.match(worker, /wellbeing-v45/);
console.log("Wellbeing Version 44 routine circuit tests passed");
