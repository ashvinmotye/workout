"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const wellness = fs.readFileSync(path.join(root, "wellness.js"), "utf8");
const migration = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20260827_create_body_waist_entries.sql"),
  "utf8"
);

function sourceFor(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist`);
  let depth = 0;
  let opened = false;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === "{") {
      depth += 1;
      opened = true;
    } else if (source[index] === "}") {
      depth -= 1;
      if (opened && depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`Could not extract ${name}`);
}

const context = {};
vm.createContext(context);
vm.runInContext([
  sourceFor(wellness, "formatWaistTrendChange"),
  sourceFor(wellness, "workoutWindowMetrics")
].join("\n"), context);

assert.equal(context.formatWaistTrendChange(-2.15), "−2.15 cm");
assert.equal(context.formatWaistTrendChange(1.2), "+1.20 cm");

const metrics = context.workoutWindowMetrics([
  {
    endedAt: 150,
    zone2Seconds: 900,
    exercises: [
      { weight: "6 kg", completedSets: 3 },
      { weight: "bodyweight", completedSets: 4 }
    ]
  },
  { endedAt: 50, zone2Seconds: 600, exercises: [{ weight: "5 kg", completedSets: 2 }] }
], 100, 200);
assert.deepEqual({ ...metrics }, { sessions: 1, zone2Seconds: 900, weightedSets: 3 });

assert.match(html, /id="waistForm"/, "Body should include the waist form");
assert.match(html, /id="progressProfilePanel"/, "Progress should include the four-signal profile");
assert.match(html, /data-signal="weight"[\s\S]*data-signal="waist"[\s\S]*data-signal="z2"[\s\S]*data-signal="strength"/, "all four official signals should be present");
assert.match(wellness, /WAIST:\s*"waist"/, "waist should be an offline-sync entity");
assert.match(wellness, /from\("body_waist_entries"\)/, "waist should pull from Supabase");
assert.match(migration, /create table if not exists public\.body_waist_entries/, "migration should create the waist table");
assert.match(migration, /enable row level security/, "waist table should enable RLS");
assert.match(migration, /auth\.uid\(\)\) = user_id/, "waist policies should isolate users");

console.log("Wellbeing waist and progress tests passed");
