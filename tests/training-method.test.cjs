"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

function sourceFor(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist`);
  let depth = 0;
  let opened = false;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === "{") { depth += 1; opened = true; }
    else if (source[index] === "}" && --depth === 0 && opened) return source.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

const context = {};
vm.createContext(context);
vm.runInContext([
  sourceFor(app, "normalizeTrainingMethod"),
  sourceFor(app, "nextTrainingStep")
].join("\n"), context);

function sequence(method, passes, exercises) {
  const visited = [];
  let roundIndex = 0;
  let exerciseIndex = 0;
  while (true) {
    visited.push([exerciseIndex + 1, roundIndex + 1]);
    const next = context.nextTrainingStep(method, roundIndex, exerciseIndex, passes, exercises);
    if (next.complete) return visited;
    roundIndex = next.roundIndex;
    exerciseIndex = next.exerciseIndex;
  }
}

assert.deepEqual(JSON.parse(JSON.stringify(sequence("rounds", 2, 3))), [
  [1, 1], [2, 1], [3, 1], [1, 2], [2, 2], [3, 2]
]);
assert.deepEqual(JSON.parse(JSON.stringify(sequence("straight-sets", 3, 2))), [
  [1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3]
]);

assert.match(html, /id="trainingMethodDialog"[\s\S]*value="rounds" checked[\s\S]*value="straight-sets"/);
assert.match(html, /id="straightSetCount"[^>]*min="1"[^>]*max="99"/);
assert.match(app, /function requestWorkoutStart[\s\S]*roundsOption\.checked = true/,
  "rounds should reset as the default before every individual workout");
assert.match(app, /runtime\.trainingMethod = routineSequence \? "rounds"/,
  "temporary circuits must always remain round-based");
assert.match(app, /function finishCurrentExercise[\s\S]*isStraightSetSession\(\)[\s\S]*startExerciseRest\(exercise\.rest\)/,
  "straight sets should use the current exercise's rest before advancing");
assert.match(app, /function advanceAfterExerciseRest[\s\S]*nextTrainingStep/);
assert.match(app, /trainingMethod: runtime\.trainingMethod[\s\S]*straightSetCount: runtime\.straightSetCount/,
  "offline active-session persistence should retain the selected method");
assert.match(app, /trainingMethod: runtime\.trainingMethod,[\s\S]*completedSets:/,
  "history exercise JSON should carry the method through existing cloud synchronization");
assert.match(app, /training_method: record\.trainingMethod === "straight-sets"/,
  "Copy for AI should identify straight-set sessions");
assert.match(worker, /wellbeing-v52/);

console.log("Wellbeing Version 47 training method tests passed");
