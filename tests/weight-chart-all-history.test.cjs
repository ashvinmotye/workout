"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const wellness = fs.readFileSync(path.join(root, "wellness.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

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

const weightChart = {
  innerHTML: "",
  ariaLabel: "",
  setAttribute(name, value) {
    if (name === "aria-label") this.ariaLabel = value;
  }
};
const context = {
  WEIGHT_CHART_MARKER_LIMIT: 30,
  wellnessDom: {
    weightChart,
    weightChartSummary: { textContent: "", innerHTML: "" }
  },
  escapeHtml: (value) => String(value),
  formatWeight: (value) => `${Number(value).toFixed(1)} kg`,
  formatWellnessDate: (value) => String(value),
  weightTrendLines: () => ["All-history trend"]
};
vm.createContext(context);
vm.runInContext(sourceFor("renderWeightChart"), context);

function records(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `weight-${index}`,
    measurementDate: `date-${String(count - index).padStart(3, "0")}`,
    weightKg: 80 - index * 0.1
  }));
}

context.renderWeightChart(records(31));
const lineOnlyMarkup = weightChart.innerHTML;
const linePoints = lineOnlyMarkup.match(/<polyline points="([^"]+)"/)[1].trim().split(/\s+/);
assert.equal(linePoints.length, 31, "every measurement should remain in the weight curve");
assert.equal((lineOnlyMarkup.match(/<circle /g) || []).length, 0, "crowded histories should render the line without point markers");

context.renderWeightChart(records(30));
assert.equal((weightChart.innerHTML.match(/<circle /g) || []).length, 30, "readable histories should retain every point marker");

const renderSource = sourceFor("renderWeightChart");
assert.doesNotMatch(renderSource, /slice\(0,\s*30\)/, "weight chart must not truncate history");
assert.match(renderSource, /displayed\.length <= WEIGHT_CHART_MARKER_LIMIT/);
assert.match(worker, /wellbeing-v52/);

console.log("Wellbeing Version 52 complete weight-chart tests passed");
