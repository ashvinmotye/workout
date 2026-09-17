"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const fitness = fs.readFileSync(path.join(root, "fitness.js"), "utf8");
const backend = fs.readFileSync(path.join(root, "supabase/functions/wellbeing-push/index.ts"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260917_create_fitness_checks.sql"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

const storage = new Map();
const context = {
  document: { querySelector: () => null },
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key)
  },
  navigator: { onLine: false },
  Date,
  Intl,
  console
};
vm.createContext(context);
vm.runInContext(fitness, context);

const plain = (value) => JSON.parse(JSON.stringify(value));
const empty = plain(context.loadFitnessData());
assert.equal(empty.anchorDate, null);
assert.deepEqual(empty.exercises, [], "no exercises should be preloaded");
assert.deepEqual(empty.results, []);

const annual = "2026-09-17";
const scheduled = plain(context.fitnessCheckpoints(annual, "2026-09-17"));
assert.deepEqual(scheduled.slice(0, 4).map(({ kind, dueDate }) => [kind, dueDate]), [
  ["annual", "2026-09-17"], ["midyear", "2027-03-17"],
  ["annual", "2027-09-17"], ["midyear", "2028-03-17"]
]);
assert.equal(context.fitnessReminder(scheduled[0], "2026-09-09"), null);
assert.match(context.fitnessReminder(scheduled[0], "2026-09-10"), /in 7 days/);
assert.match(context.fitnessReminder(scheduled[0], "2026-09-17"), /due today/);
assert.match(context.fitnessReminder(scheduled[0], "2026-09-18"), /1 day overdue/);

const data = { anchorDate: annual, results: [] };
assert.equal(context.fitnessCurrentCheckpoint(data, "2027-10-01").id, scheduled[0].id,
  "the first overdue check must remain active across later checkpoint dates");
data.results.push({ checkpointId: scheduled[0].id, status: "draft" });
assert.equal(context.fitnessCurrentCheckpoint(data, "2027-10-01").id, scheduled[0].id,
  "saving a draft must not stop overdue reminders");
data.results[0].status = "completed";
assert.equal(context.fitnessCurrentCheckpoint(data, "2027-10-01").id, scheduled[1].id,
  "completing the yearly check should activate the overdue halfway check");
data.results.push({ checkpointId: scheduled[1].id, status: "completed", deletedAt: 100 });
assert.equal(context.fitnessCurrentCheckpoint(data, "2027-10-01").id, scheduled[1].id,
  "deleting a completion must restore that checkpoint");
data.results[1].deletedAt = null;
assert.equal(context.fitnessCurrentCheckpoint(data, "2027-10-01").id, scheduled[2].id);
assert.equal(context.fitnessCurrentCheckpoint({ anchorDate: annual, results: [{ checkpointId: scheduled[0].id, status: "completed" }] }, "2026-09-10").id, scheduled[1].id,
  "early completion should silence that reminder and leave the next check");

const leap = plain(context.fitnessCheckpoints("2024-02-29", "2025-04-01"));
assert.deepEqual(leap.slice(0, 4).map((check) => check.dueDate), ["2024-02-29", "2024-08-29", "2025-02-28", "2025-08-28"]);

const exercise = plain(context.normalizeFitnessExercise({ id: "balance", name: "My balance test", resultType: "number", unit: "seconds", bilateral: true, instructions: "Eyes open near wall" }));
const entry = plain(context.normalizeFitnessEntry({ ...exercise, left: 23, right: 29, effort: 6, notes: "Left side wobbled" }));
assert.equal(entry.left, 23);
assert.equal(entry.right, 29);
assert.equal(entry.instructions, "Eyes open near wall");
const record = plain(context.normalizeFitnessResult({
  id: "record-1", checkpointId: scheduled[0].id, dueDate: scheduled[0].dueDate,
  performedDate: "2026-09-10", kind: "annual", status: "completed", entries: [entry],
  overallNotes: "Slept poorly", createdAt: 1000, updatedAt: 2000, completedAt: 2000
}));
const local = { anchorDate: annual, configUpdatedAt: 2500, exercises: [], results: [record] };
const cloud = { anchorDate: annual, configUpdatedAt: 1500, exercises: [exercise], results: [] };
const merged = plain(context.mergeFitnessData(local, cloud));
assert.deepEqual(merged.exercises, [], "manual configuration removal should sync without changing old result snapshots");
assert.equal(merged.results[0].entries[0].instructions, "Eyes open near wall");
const removed = plain(context.mergeFitnessData({ ...local, results: [{ ...record, deletedAt: 3000, updatedAt: 3000 }] }, cloud));
assert.equal(removed.results[0].deletedAt, 3000, "tombstones must prevent an old cloud copy from returning");
assert.deepEqual(plain(context.mergeFitnessData({ ...local, resetAt: 4000, results: [] }, cloud)).results, [],
  "a restored backup should not revive older remote results");
assert.equal(context.validateFitnessBackupData({}).fitnessCheckData.anchorDate, null,
  "older backups without fitness checks should still import");
assert.throws(() => context.validateFitnessBackupData({ fitnessCheckData: { anchorDate: annual, exercises: [{ name: "Missing id" }], results: [] } }), /fitness checks/i);

function sourceFor(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1);
  let depth = 0;
  let opened = false;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === "{") { depth += 1; opened = true; }
    else if (source[index] === "}" && --depth === 0 && opened) return source.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

const serverContext = { Date };
vm.createContext(serverContext);
vm.runInContext([
  sourceFor(backend, "fitnessMonthDate").replace("anchor: string, monthOffset: number", "anchor, monthOffset"),
  sourceFor(backend, "currentFitnessCheckpoint").replace("anchorDate: string, results: any[], today: string", "anchorDate, results, today"),
  `async ${sourceFor(backend, "fitnessReminderForUser").replace("userId: string, today: string", "userId, today")}`
].join("\n"), serverContext);
assert.equal(serverContext.currentFitnessCheckpoint(annual, [], "2027-10-01").id, scheduled[0].id);
assert.equal(serverContext.currentFitnessCheckpoint(annual, data.results, "2027-10-01").id, scheduled[2].id);
let serverRow = { anchor_date: annual, results: [] };
serverContext.db = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: serverRow, error: null }) }) }) }) };

const page = html.slice(html.indexOf('id="fitnessScreen"'), html.indexOf('id="trendsScreen"'));
assert.match(html, /id="openFitnessCheckButton"/);
assert.match(page, /id="fitnessExerciseList"[\s\S]*id="fitnessResultForm"[\s\S]*id="fitnessHistory"/);
assert.doesNotMatch(page, /<option[^>]*>.*(?:push-up|chair stand|walk)/i, "no exercises should be prefilled");
assert.match(app, /fitnessScreen\.hidden = name !== "fitness"/);
assert.match(app, /fitnessData = validateFitnessBackupData/);
assert.match(app, /fitnessStorageKey\(\),\s*fitnessPendingStorageKey\(\)/, "backup rollback must cover account-scoped fitness data");
assert.match(backend, /parts\.hour === 19 && preferences\.fitnessEnabled/);
assert.match(backend, /`fitness:\$\{reminder\.id\}:\$\{today\}`/);
assert.match(migration, /fitness_check_data[\s\S]*enable row level security/);
assert.match(migration, /'workout', 'fitness'/);
assert.match(worker, /\.\/fitness\.js\?v=46/);
assert.match(worker, /payload\.type === "fitness" && await fitnessAlreadyCompleted\(payload\.userId, payload\.checkpointId\)/,
  "the same device should suppress a completed check's push before offline data reaches the server");
assert.match(backend, /userId,\s*checkpointId,\s*title/, "fitness pushes must carry the checkpoint and owner for local suppression");

// Exercise the new page's save/complete/copy flow using the same handlers as its buttons.
const uiStorage = new Map();
const elements = new Map();
function element(selector) {
  if (!elements.has(selector)) elements.set(selector, {
    textContent: "", innerHTML: "", value: "", hidden: false,
    addEventListener() {}, scrollIntoView() {}, querySelectorAll: () => []
  });
  return elements.get(selector);
}
element("#fitnessScheduleForm").elements = { annualDate: { value: "" } };
element("#fitnessExerciseForm").elements = {
  name: { value: "" }, resultType: { value: "number", addEventListener() {} },
  unit: { value: "" }, bilateral: { checked: false }, instructions: { value: "" }
};
element("#fitnessExerciseForm").reset = () => {
  const fields = element("#fitnessExerciseForm").elements;
  fields.name.value = ""; fields.resultType.value = "number";
  fields.unit.value = ""; fields.bilateral.checked = false; fields.instructions.value = "";
};
element("#fitnessResultForm").elements = {
  performedDate: { value: "", max: "" }, overallNotes: { value: "" }
};
let clipboard = "";
const ui = {
  document: { querySelector: element },
  localStorage: {
    getItem: (key) => uiStorage.get(key) ?? null,
    setItem: (key, value) => uiStorage.set(key, value),
    removeItem: (key) => uiStorage.delete(key)
  },
  navigator: { onLine: false }, authSession: null,
  loadCachedAuthUser: () => ({ id: "person-1" }),
  showToast() {}, showScreen() {}, window: { confirm: () => true },
  writeClipboardText: async (value) => { clipboard = value; },
  Date, Intl, console
};
vm.createContext(ui);
vm.runInContext(fitness, ui);
ui.initializeFitness();
assert.match(element("#fitnessExerciseList").innerHTML, /No exercises saved yet/);
element("#fitnessScheduleForm").elements.annualDate.value = "2026-09-17";
ui.submitFitnessSchedule({ preventDefault() {} });
assert.equal(ui.loadFitnessData().anchorDate, "2026-09-17");
const fields = element("#fitnessExerciseForm").elements;
fields.name.value = "My own chair test";
fields.unit.value = "reps";
fields.instructions.value = "Use the same chair each time";
ui.submitFitnessExercise({ preventDefault() {} });
assert.equal(ui.loadFitnessData().exercises.length, 1);
assert.match(element("#fitnessExerciseList").innerHTML, /My own chair test/);
ui.openFitnessResult();
assert.equal(element("#fitnessResultForm").hidden, false);
const entryId = ui.loadFitnessData().exercises[0].id;
const recordedValues = {
  '[name="value"]': { value: "12" },
  '[name="effort"]': { value: "6" },
  '[name="notes"]': { value: "Slept poorly" }
};
element("#fitnessResultFields").querySelectorAll = () => [{
  dataset: { fitnessEntry: entryId }, querySelector: (selector) => recordedValues[selector]
}];
ui.saveFitnessResult(false, { preventDefault() {} });
assert.equal(ui.loadFitnessData().results[0].status, "draft");
assert.equal(ui.fitnessCurrentCheckpoint(ui.loadFitnessData(), "2026-09-17").kind, "annual");
ui.openFitnessResult();
ui.saveFitnessResult(true, { preventDefault() {} });
assert.equal(ui.loadFitnessData().results[0].status, "completed");
assert.equal(ui.fitnessCurrentCheckpoint(ui.loadFitnessData(), "2026-09-17").kind, "midyear");
(async () => {
  assert.equal(await serverContext.fitnessReminderForUser("user", "2026-09-09"), null);
  assert.match((await serverContext.fitnessReminderForUser("user", "2026-09-10")).title, /in 7 days/);
  assert.match((await serverContext.fitnessReminderForUser("user", "2026-09-20")).title, /overdue/);
  serverRow = { anchor_date: annual, results: [{ checkpointId: scheduled[0].id, status: "draft" }] };
  assert.match((await serverContext.fitnessReminderForUser("user", "2026-09-20")).title, /overdue/);
  serverRow.results[0].status = "completed";
  assert.equal(await serverContext.fitnessReminderForUser("user", "2026-09-20"), null,
    "server push must stop for an early or completed checkpoint");
  await ui.copyFitnessForAi();
  assert.match(clipboard, /Slept poorly/);
  assert.match(clipboard, /Use the same chair each time/);
  assert.match(clipboard, /"completed_checks"/);
  let uploaded = null;
  ui.navigator.onLine = true;
  ui.authSession = { user: { id: "person-1" } };
  ui.authClient = { from: (table) => {
    assert.equal(table, "fitness_check_data", "fitness results must never enter workout or measurement tables");
    return {
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      upsert: async (row) => { uploaded = row; return { error: null }; }
    };
  } };
  assert.equal(uiStorage.get("voiceWorkout.fitnessChecksPending.v1.person-1"), "1");
  await ui.syncFitnessData();
  assert.equal(uploaded.results[0].status, "completed", "the offline completed check should upload after reconnect");
  assert.equal(uiStorage.has("voiceWorkout.fitnessChecksPending.v1.person-1"), false);
  ui.authSession = { user: { id: "person-2" } };
  assert.equal(ui.loadFitnessData().results.length, 0, "fitness records must stay with their account on a shared device");
  console.log("Wellbeing fitness-check schedule, storage, reminder and isolation tests passed");
})().catch((error) => { console.error(error); process.exitCode = 1; });
