"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const wellness = fs.readFileSync(path.join(root, "wellness.js"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

function sourceFor(name) {
  const start = wellness.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist`);
  let depth = 0;
  let opened = false;
  for (let index = start; index < wellness.length; index += 1) {
    if (wellness[index] === "{") { depth += 1; opened = true; }
    else if (wellness[index] === "}" && --depth === 0 && opened) return wellness.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

const weights = [
  { measurementDate: "2026-09-01", weightKg: 80 },
  { measurementDate: "2026-09-02", weightKg: 90 },
  { measurementDate: "2026-09-11", weightKg: 78 }
];
const storage = new Map();
const context = {
  Date,
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key)
  },
  wellnessTodayKey: () => "2026-09-12",
  formatWellnessDate: (date) => date,
  loadWeightEntries: () => weights,
  loadRecoveryCheckins: () => [],
  loadWaistEntries: () => [],
  normalizeRecoveryCheckin: (record) => record,
  normalizeWeightEntry: (record) => record,
  normalizeWaistEntry: (record) => record,
  wellnessDom: {
    targetWeightEstimate: { textContent: "" },
    targetWeightTrend: { textContent: "" }
  }
};
vm.createContext(context);
vm.runInContext([
  'const TARGET_WEIGHT_KEY = "voiceWorkout.targetWeightKg.v1";',
  ...[
    "normalizeTargetWeight", "loadTargetWeight", "saveTargetWeight", "wellnessUtcDay",
    "calculateWeightTargetProjection", "renderTargetWeightForecast",
    "getWellnessBackupData", "validateWellnessBackupData"
  ].map(sourceFor)
].join("\n"), context);

const forecast = context.calculateWeightTargetProjection(weights, 76, "2026-09-12");
assert.equal(forecast.status, "estimate");
assert.equal(forecast.projectedDate, "2026-09-15", "the middle measurement and actual date spacing must affect the least-squares slope");
assert.ok(Math.abs(forecast.slopeKgPerWeek - (-0.6483516483516484 * 7)) < 1e-6);
assert.equal(context.calculateWeightTargetProjection(weights, 80, "2026-09-12").status, "away");
assert.equal(context.calculateWeightTargetProjection(weights, 78, "2026-09-12").status, "reached");
assert.equal(context.calculateWeightTargetProjection(weights, 76, "2026-09-16").status, "outdated");
assert.equal(context.calculateWeightTargetProjection(weights.slice(0, 1), 76, "2026-09-12").status, "need-more-data");
assert.equal(context.calculateWeightTargetProjection(weights.map((entry) => ({ ...entry, weightKg: 80 })), 76, "2026-09-12").status, "flat");
assert.equal(context.calculateWeightTargetProjection([], 76, "2026-09-12").status, "no-measurements");

context.saveTargetWeight(76);
assert.equal(context.loadTargetWeight(), 76);
context.renderTargetWeightForecast(weights);
assert.match(context.wellnessDom.targetWeightEstimate.textContent, /2026-09-15/);
assert.match(context.wellnessDom.targetWeightTrend.textContent, /all 3 measurements/);
assert.equal(context.getWellnessBackupData().targetWeightKg, 76);
assert.equal(context.validateWellnessBackupData({}).targetWeightKg, null, "older backups should import without a target");
assert.equal(context.validateWellnessBackupData({ targetWeightKg: 76 }).targetWeightKg, 76);
assert.throws(() => context.validateWellnessBackupData({ targetWeightKg: 301 }), /target weight/i);
context.saveTargetWeight(null);
assert.equal(context.loadTargetWeight(), null);

const weightPanel = html.slice(html.indexOf('class="panel weight-panel"'), html.indexOf('class="panel waist-panel"'));
assert.match(weightPanel, /id="targetWeightForm"[\s\S]*id="weightHistory"/, "target card should precede weight history");
assert.match(app, /BODY_WEIGHT_ENTRIES_KEY,\s*TARGET_WEIGHT_KEY,\s*BODY_WAIST_ENTRIES_KEY/, "backup rollback should include target storage");

console.log("Wellbeing target-weight projection and backup tests passed");
