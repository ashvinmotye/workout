"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function sourceFor(name) {
  const start = app.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist`);

  let depth = 0;
  let opened = false;
  for (let index = start; index < app.length; index += 1) {
    if (app[index] === "{") {
      depth += 1;
      opened = true;
    } else if (app[index] === "}") {
      depth -= 1;
      if (opened && depth === 0) return app.slice(start, index + 1);
    }
  }
  throw new Error(`Could not extract ${name}`);
}

const context = {};
vm.createContext(context);
vm.runInContext([
  sourceFor("formatRoutineWeight"),
  sourceFor("getRoutineWeightLabels"),
  sourceFor("formatRoutineWeightSummary")
].join("\n"), context);

const workout = {
  exercises: [
    { weight: "6" },
    { weight: "2 × 5 kg" },
    { weight: "6kg" },
    { weight: "" },
    { weight: "3kg" }
  ]
};

assert.equal(context.formatRoutineWeightSummary(workout), "Weights · 6kg, 2 x 5kg, 3kg");
assert.equal(context.formatRoutineWeightSummary({ exercises: [{ weight: "" }] }), "");
assert.match(html, /class="saved-workout-weights" hidden/, "routine cards should include a hidden weight row");
assert.match(app, /weights\.hidden = !weightSummary;/, "unweighted routines should hide the weight row");
assert.match(styles, /\.saved-workout-weights\s*\{[^}]*color:\s*var\(--primary-dark\);[^}]*font-size:\s*0\.78rem;[^}]*font-weight:\s*850;/s, "routine weights should match the Suggested today emphasis");

console.log("Forge routine weight tests passed");
