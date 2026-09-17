"use strict";

// Fitness checks are intentionally separate from workouts, readiness and body analytics.
const FITNESS_DATA_KEY = "voiceWorkout.fitnessChecks.v1";
const FITNESS_SYNC_PENDING_KEY = "voiceWorkout.fitnessChecksPending.v1";
const FITNESS_PUSH_DB = "wellbeing-fitness-push-v1";
const FITNESS_RESULT_TYPES = ["number", "boolean", "text"];
const fitnessDom = {
  entryStatus: document.querySelector("#fitnessEntryStatus"),
  openButton: document.querySelector("#openFitnessCheckButton"),
  backButton: document.querySelector("#backFromFitnessButton"),
  scheduleForm: document.querySelector("#fitnessScheduleForm"),
  scheduleStatus: document.querySelector("#fitnessScheduleStatus"),
  nextCheck: document.querySelector("#fitnessNextCheck"),
  exerciseForm: document.querySelector("#fitnessExerciseForm"),
  exerciseFormTitle: document.querySelector("#fitnessExerciseFormTitle"),
  exerciseStatus: document.querySelector("#fitnessExerciseStatus"),
  exerciseList: document.querySelector("#fitnessExerciseList"),
  cancelExerciseEdit: document.querySelector("#fitnessCancelExerciseEditButton"),
  unitField: document.querySelector("#fitnessUnitField"),
  bilateralField: document.querySelector("#fitnessBilateralField"),
  currentStatus: document.querySelector("#fitnessCurrentStatus"),
  startButton: document.querySelector("#fitnessStartCheckButton"),
  resultForm: document.querySelector("#fitnessResultForm"),
  resultTitle: document.querySelector("#fitnessResultTitle"),
  resultFields: document.querySelector("#fitnessResultFields"),
  resultStatus: document.querySelector("#fitnessResultStatus"),
  saveDraftButton: document.querySelector("#fitnessSaveDraftButton"),
  cancelResultButton: document.querySelector("#fitnessCancelResultButton"),
  history: document.querySelector("#fitnessHistory"),
  copyButton: document.querySelector("#fitnessCopyForAiButton"),
  copyStatus: document.querySelector("#fitnessCopyStatus"),
  syncStatus: document.querySelector("#fitnessSyncStatus")
};

let fitnessEditingExerciseId = null;
let fitnessEditingResultId = null;
let fitnessOpenResult = null;
let fitnessSyncBusy = false;
let fitnessSyncRequested = false;

function fitnessToday(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function fitnessValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const actual = new Date(Date.UTC(year, month - 1, day));
  return year >= 2000 && year <= 2100 && actual.getUTCFullYear() === year
    && actual.getUTCMonth() === month - 1 && actual.getUTCDate() === day;
}

function fitnessDayDifference(later, earlier) {
  return (Date.parse(`${later}T00:00:00Z`) - Date.parse(`${earlier}T00:00:00Z`)) / 86400000;
}

function fitnessMonthDate(anchor, monthOffset) {
  const [year, month, day] = anchor.split("-").map(Number);
  const index = year * 12 + month - 1 + monthOffset;
  const targetYear = Math.floor(index / 12);
  const targetMonth = index % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

function fitnessCheckpoints(anchorDate, today = fitnessToday()) {
  if (!fitnessValidDate(anchorDate)) return [];
  const firstYear = Number(anchorDate.slice(0, 4));
  const lastYear = Math.max(firstYear + 1, Number(today.slice(0, 4)) + 2);
  const checks = [];
  for (let year = firstYear; year <= lastYear; year += 1) {
    const offset = (year - firstYear) * 12;
    const annualDate = fitnessMonthDate(anchorDate, offset);
    checks.push({ id: `${anchorDate}:${year}:annual`, kind: "annual", dueDate: annualDate });
    checks.push({ id: `${anchorDate}:${year}:midyear`, kind: "midyear", dueDate: fitnessMonthDate(annualDate, 6) });
  }
  return checks;
}

function fitnessCurrentCheckpoint(data, today = fitnessToday()) {
  const checks = fitnessCheckpoints(data.anchorDate, today);
  if (!checks.length) return null;
  const completed = new Set(data.results.filter((record) => record.status === "completed" && !record.deletedAt).map((record) => record.checkpointId));
  const overdueOrDue = checks.find((check) => check.dueDate <= today && !completed.has(check.id));
  if (overdueOrDue) return overdueOrDue;
  return checks.find((check) => check.dueDate > today && !completed.has(check.id)) || null;
}

function fitnessReminder(check, today = fitnessToday()) {
  if (!check) return null;
  const days = fitnessDayDifference(check.dueDate, today);
  if (days > 7) return null;
  const label = check.kind === "annual" ? "Yearly" : "Midyear";
  if (days < 0) return `${label} fitness check is ${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} overdue.`;
  if (days === 0) return `${label} fitness check is due today.`;
  return `${label} fitness check in ${days} ${days === 1 ? "day" : "days"}.`;
}

function fitnessNewId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `fitness-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function fitnessEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function normalizeFitnessExercise(item) {
  if (!item || typeof item !== "object" || typeof item.id !== "string" || !item.id
      || typeof item.name !== "string" || !item.name.trim()
      || !FITNESS_RESULT_TYPES.includes(item.resultType)) return null;
  return {
    id: item.id.slice(0, 100),
    name: item.name.trim().slice(0, 80),
    resultType: item.resultType,
    unit: item.resultType === "number" ? String(item.unit || "").trim().slice(0, 20) : "",
    bilateral: item.resultType === "number" && item.bilateral === true,
    instructions: String(item.instructions || "").trim().slice(0, 500)
  };
}

function normalizeFitnessEntry(item) {
  const exercise = normalizeFitnessExercise(item);
  if (!exercise) return null;
  const toNumber = (value) => value === null || value === undefined || value === ""
    ? null : (Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 999999 ? Number(value) : null);
  const effort = Number(item.effort);
  return {
    ...exercise,
    value: exercise.resultType === "number" ? toNumber(item.value)
      : exercise.resultType === "boolean" ? (["yes", "no"].includes(item.value) ? item.value : "")
        : String(item.value || "").slice(0, 500),
    left: exercise.bilateral ? toNumber(item.left) : null,
    right: exercise.bilateral ? toNumber(item.right) : null,
    effort: Number.isInteger(effort) && effort >= 1 && effort <= 10 ? effort : null,
    notes: String(item.notes || "").trim().slice(0, 500)
  };
}

function normalizeFitnessResult(item) {
  if (!item || typeof item !== "object" || typeof item.id !== "string" || !item.id
      || typeof item.checkpointId !== "string" || !item.checkpointId
      || !fitnessValidDate(item.dueDate) || !fitnessValidDate(item.performedDate)
      || !Array.isArray(item.entries) || !["draft", "completed"].includes(item.status)) return null;
  const entries = item.entries.map(normalizeFitnessEntry);
  if (entries.some((entry) => !entry)) return null;
  const createdAt = Number(item.createdAt) || Date.now();
  return {
    id: item.id.slice(0, 100),
    checkpointId: item.checkpointId.slice(0, 100),
    dueDate: item.dueDate,
    kind: item.kind === "midyear" ? "midyear" : "annual",
    performedDate: item.performedDate,
    status: item.status,
    entries,
    overallNotes: String(item.overallNotes || "").trim().slice(0, 1000),
    createdAt,
    updatedAt: Math.max(createdAt, Number(item.updatedAt) || createdAt),
    completedAt: item.status === "completed" ? (Number(item.completedAt) || createdAt) : null,
    deletedAt: Number(item.deletedAt) || null
  };
}

function normalizeFitnessData(candidate) {
  const value = candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate : {};
  return {
    anchorDate: fitnessValidDate(value.anchorDate) ? value.anchorDate : null,
    configUpdatedAt: Number(value.configUpdatedAt) || 0,
    resetAt: Number(value.resetAt) || 0,
    exercises: Array.isArray(value.exercises) ? value.exercises.map(normalizeFitnessExercise).filter(Boolean) : [],
    results: Array.isArray(value.results) ? value.results.map(normalizeFitnessResult).filter(Boolean) : []
  };
}

function fitnessOwnerId() {
  const signedIn = typeof authSession !== "undefined" ? authSession?.user?.id : null;
  const cached = typeof loadCachedAuthUser === "function" ? loadCachedAuthUser()?.id : null;
  return signedIn || cached || "local";
}

function fitnessStorageKey() { return `${FITNESS_DATA_KEY}.${fitnessOwnerId()}`; }
function fitnessPendingStorageKey() { return `${FITNESS_SYNC_PENDING_KEY}.${fitnessOwnerId()}`; }

function loadFitnessData() {
  try { return normalizeFitnessData(JSON.parse(localStorage.getItem(fitnessStorageKey()) || "null")); }
  catch { return normalizeFitnessData(null); }
}

function updateFitnessPushState() {
  const owner = fitnessOwnerId();
  if (owner === "local" || !window.indexedDB) return;
  const completedIds = loadFitnessData().results
    .filter((record) => record.status === "completed" && !record.deletedAt)
    .map((record) => record.checkpointId);
  try {
    const request = window.indexedDB.open(FITNESS_PUSH_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("completed")) request.result.createObjectStore("completed", { keyPath: "userId" });
    };
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("completed", "readwrite");
      transaction.objectStore("completed").put({ userId: owner, completedIds });
      transaction.oncomplete = () => database.close();
      transaction.onerror = () => database.close();
    };
  } catch {
    // The cloud completion state still suppresses reminders after sync.
  }
}

function saveFitnessData(value) {
  localStorage.setItem(fitnessStorageKey(), JSON.stringify(normalizeFitnessData(value)));
  localStorage.setItem(fitnessPendingStorageKey(), "1");
  updateFitnessPushState();
  renderFitnessView();
  if (typeof renderNotificationCentre === "function") renderNotificationCentre();
  if (typeof authSession !== "undefined" && authSession && navigator.onLine) syncFitnessData().catch(() => {});
}

function fitnessDateLabel(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(`${value}T12:00:00`));
}

function fitnessCheckLabel(check) {
  return `${check.kind === "annual" ? "Yearly" : "Midyear"} check · ${fitnessDateLabel(check.dueDate)}`;
}

function fitnessResultValue(entry) {
  if (entry.resultType === "number") {
    const unit = entry.unit ? ` ${entry.unit}` : "";
    return entry.bilateral ? `Left ${entry.left ?? "—"}${unit} · Right ${entry.right ?? "—"}${unit}` : `${entry.value ?? "—"}${unit}`;
  }
  if (entry.resultType === "boolean") return entry.value === "yes" ? "Yes" : entry.value === "no" ? "No" : "—";
  return entry.value || "—";
}

function fitnessPreviousChange(entry, current, records) {
  if (current.status !== "completed" || entry.resultType !== "number") return "";
  const previous = records.filter((record) => record.status === "completed" && !record.deletedAt && record.dueDate < current.dueDate)
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
    .map((record) => record.entries.find((item) => item.id === entry.id))
    .find(Boolean);
  if (!previous) return "";
  if (entry.resultType !== previous.resultType || entry.unit !== previous.unit || entry.bilateral !== previous.bilateral || entry.instructions !== previous.instructions) {
    return " · Method changed since last result";
  }
  const change = (currentValue, previousValue) => currentValue === null || previousValue === null ? "—"
    : `${currentValue - previousValue >= 0 ? "+" : "−"}${Math.abs(Math.round((currentValue - previousValue) * 100) / 100)}${entry.unit ? ` ${entry.unit}` : ""}`;
  return entry.bilateral
    ? ` · Change: left ${change(entry.left, previous.left)}, right ${change(entry.right, previous.right)}`
    : ` · Change: ${change(entry.value, previous.value)} vs last result`;
}

function renderFitnessEntry(data = loadFitnessData()) {
  if (!fitnessDom.entryStatus) return;
  const check = fitnessCurrentCheckpoint(data);
  fitnessDom.entryStatus.textContent = !data.anchorDate
    ? "Set your first yearly check date and add your own test exercises."
    : check ? fitnessReminder(check) || `Next: ${fitnessCheckLabel(check)}.` : "All scheduled checks are complete.";
}

function renderFitnessExercises(data) {
  fitnessDom.exerciseList.innerHTML = data.exercises.length
    ? data.exercises.map((item) => `<article class="fitness-exercise-row" data-id="${fitnessEscape(item.id)}">
        <strong>${fitnessEscape(item.name)}</strong>
        <p>${fitnessEscape(item.resultType === "number" ? `Number${item.unit ? ` · ${item.unit}` : ""}${item.bilateral ? " · left/right" : ""}` : item.resultType === "boolean" ? "Yes / No" : "Written result")}</p>
        ${item.instructions ? `<p>${fitnessEscape(item.instructions)}</p>` : ""}
        <div class="fitness-actions"><button class="button button-ghost button-small fitness-edit-exercise" type="button">Edit</button><button class="button button-ghost button-small fitness-remove-exercise" type="button">Remove</button></div>
      </article>`).join("")
    : '<p class="fitness-history-empty">No exercises saved yet. Add the first one below.</p>';
}

function fitnessEntryFields(entry) {
  let input;
  if (entry.resultType === "number" && entry.bilateral) {
    input = `<div class="fitness-form-grid"><label class="field"><span>Left${entry.unit ? ` · ${fitnessEscape(entry.unit)}` : ""}</span><input name="left" type="number" min="0" max="999999" step="any" inputmode="decimal" value="${fitnessEscape(entry.left ?? "")}" /></label>
      <label class="field"><span>Right${entry.unit ? ` · ${fitnessEscape(entry.unit)}` : ""}</span><input name="right" type="number" min="0" max="999999" step="any" inputmode="decimal" value="${fitnessEscape(entry.right ?? "")}" /></label></div>`;
  } else if (entry.resultType === "number") {
    input = `<label class="field"><span>Result${entry.unit ? ` · ${fitnessEscape(entry.unit)}` : ""}</span><input name="value" type="number" min="0" max="999999" step="any" inputmode="decimal" value="${fitnessEscape(entry.value ?? "")}" /></label>`;
  } else if (entry.resultType === "boolean") {
    input = `<label class="field"><span>Result</span><select name="value"><option value="">Choose</option><option value="yes" ${entry.value === "yes" ? "selected" : ""}>Yes</option><option value="no" ${entry.value === "no" ? "selected" : ""}>No</option></select></label>`;
  } else {
    input = `<label class="field"><span>Result</span><textarea name="value" rows="2" maxlength="500">${fitnessEscape(entry.value)}</textarea></label>`;
  }
  return `<div class="fitness-result-field" data-fitness-entry="${fitnessEscape(entry.id)}">
    <strong>${fitnessEscape(entry.name)}</strong>${entry.instructions ? `<p>${fitnessEscape(entry.instructions)}</p>` : ""}
    ${input}<label class="field"><span>Effort · 1–10 <small>optional</small></span><input name="effort" type="number" min="1" max="10" step="1" inputmode="numeric" value="${entry.effort ?? ""}" /></label>
    <label class="field"><span>Notes <small>optional</small></span><textarea name="notes" rows="2" maxlength="500">${fitnessEscape(entry.notes)}</textarea></label>
  </div>`;
}

function renderFitnessHistory(data) {
  const records = data.results.filter((record) => !record.deletedAt)
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate) || b.updatedAt - a.updatedAt);
  fitnessDom.copyButton.disabled = !records.some((record) => record.status === "completed");
  fitnessDom.history.innerHTML = records.length ? records.map((record) => `<article class="fitness-record" data-id="${fitnessEscape(record.id)}">
      <strong>${fitnessEscape(fitnessCheckLabel(record))} · ${record.status === "completed" ? "Completed" : "Draft"}</strong>
      <p>Performed ${fitnessEscape(fitnessDateLabel(record.performedDate))}</p>
      ${record.entries.map((entry) => `<p><strong>${fitnessEscape(entry.name)}:</strong> ${fitnessEscape(fitnessResultValue(entry))}${fitnessEscape(fitnessPreviousChange(entry, record, records))}${entry.effort ? ` · effort ${entry.effort}/10` : ""}${entry.notes ? ` · ${fitnessEscape(entry.notes)}` : ""}</p>`).join("")}
      ${record.overallNotes ? `<p>${fitnessEscape(record.overallNotes)}</p>` : ""}
      <div class="fitness-actions"><button class="button button-ghost button-small fitness-edit-result" type="button">${record.status === "draft" ? "Resume" : "Edit"}</button><button class="button button-ghost button-small fitness-delete-result" type="button">Delete</button></div>
    </article>`).join("") : '<p class="fitness-history-empty">No checks recorded yet.</p>';
}

function renderFitnessView() {
  if (!fitnessDom.entryStatus) return;
  const data = loadFitnessData();
  const check = fitnessCurrentCheckpoint(data);
  renderFitnessEntry(data);
  fitnessDom.scheduleForm.elements.annualDate.value = data.anchorDate || "";
  fitnessDom.nextCheck.textContent = check ? `Next: ${fitnessCheckLabel(check)}` : "Set a date to schedule checks.";
  renderFitnessExercises(data);
  fitnessDom.currentStatus.textContent = !check ? "Save a yearly check date first."
    : !data.exercises.length ? "Add at least one test exercise before recording a check."
      : fitnessReminder(check) || `${fitnessCheckLabel(check)} is coming up.`;
  fitnessDom.startButton.hidden = !check || !data.exercises.length || Boolean(fitnessOpenResult);
  fitnessDom.startButton.textContent = data.results.some((record) => record.checkpointId === check?.id && record.status === "draft" && !record.deletedAt)
    ? "Resume draft" : "Start check";
  renderFitnessHistory(data);
  updateFitnessSyncStatus();
}

function resetFitnessExerciseForm() {
  fitnessEditingExerciseId = null;
  fitnessDom.exerciseForm.reset();
  fitnessDom.exerciseFormTitle.textContent = "Add an exercise";
  fitnessDom.cancelExerciseEdit.hidden = true;
  fitnessDom.exerciseStatus.textContent = "";
  updateFitnessExerciseOptions();
}

function updateFitnessExerciseOptions() {
  const isNumber = fitnessDom.exerciseForm.elements.resultType.value === "number";
  fitnessDom.unitField.hidden = !isNumber;
  fitnessDom.bilateralField.hidden = !isNumber;
  if (!isNumber) fitnessDom.exerciseForm.elements.bilateral.checked = false;
}

function submitFitnessSchedule(event) {
  event.preventDefault();
  const date = fitnessDom.scheduleForm.elements.annualDate.value;
  if (!fitnessValidDate(date)) {
    fitnessDom.scheduleStatus.textContent = "Choose a valid date for your first yearly check.";
    return;
  }
  const data = loadFitnessData();
  data.anchorDate = date;
  data.configUpdatedAt = Date.now();
  saveFitnessData(data);
  fitnessDom.scheduleStatus.textContent = "Yearly and halfway checks scheduled.";
}

function submitFitnessExercise(event) {
  event.preventDefault();
  const form = fitnessDom.exerciseForm;
  const name = form.elements.name.value.trim();
  const data = loadFitnessData();
  if (data.exercises.some((item) => item.id !== fitnessEditingExerciseId && item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    fitnessDom.exerciseStatus.textContent = "An exercise with this name is already saved.";
    return;
  }
  const candidate = normalizeFitnessExercise({
    id: fitnessEditingExerciseId || fitnessNewId(), name,
    resultType: form.elements.resultType.value,
    unit: form.elements.unit.value,
    bilateral: form.elements.bilateral.checked,
    instructions: form.elements.instructions.value
  });
  if (!candidate) {
    fitnessDom.exerciseStatus.textContent = "Give the exercise a name and a result format.";
    return;
  }
  const replacing = Boolean(fitnessEditingExerciseId);
  data.exercises = replacing
    ? data.exercises.map((item) => item.id === fitnessEditingExerciseId ? candidate : item)
    : [...data.exercises, candidate];
  data.configUpdatedAt = Date.now();
  resetFitnessExerciseForm();
  saveFitnessData(data);
  fitnessDom.exerciseStatus.textContent = replacing ? "Exercise updated. Previous test results retain their original setup." : "Exercise saved.";
}

function handleFitnessExerciseList(event) {
  const row = event.target.closest("[data-id]");
  if (!row) return;
  const data = loadFitnessData();
  const item = data.exercises.find((exercise) => exercise.id === row.dataset.id);
  if (!item) return;
  if (event.target.closest(".fitness-edit-exercise")) {
    fitnessEditingExerciseId = item.id;
    const form = fitnessDom.exerciseForm;
    form.elements.name.value = item.name;
    form.elements.resultType.value = item.resultType;
    form.elements.unit.value = item.unit;
    form.elements.bilateral.checked = item.bilateral;
    form.elements.instructions.value = item.instructions;
    fitnessDom.exerciseFormTitle.textContent = "Edit exercise";
    fitnessDom.cancelExerciseEdit.hidden = false;
    fitnessDom.exerciseStatus.textContent = "";
    updateFitnessExerciseOptions();
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  if (event.target.closest(".fitness-remove-exercise") && window.confirm(`Remove ${item.name} from future checks? Previous results will be kept.`)) {
    data.exercises = data.exercises.filter((exercise) => exercise.id !== item.id);
    data.configUpdatedAt = Date.now();
    if (fitnessEditingExerciseId === item.id) resetFitnessExerciseForm();
    saveFitnessData(data);
    fitnessDom.exerciseStatus.textContent = "Exercise removed from future checks.";
  }
}

function openFitnessResult(record = null) {
  const data = loadFitnessData();
  const check = fitnessCurrentCheckpoint(data);
  if (!record && (!check || !data.exercises.length)) return;
  const draft = !record && data.results.find((item) => item.checkpointId === check.id && item.status === "draft" && !item.deletedAt);
  const now = Date.now();
  fitnessOpenResult = record || draft || {
    id: fitnessNewId(), checkpointId: check.id, kind: check.kind, dueDate: check.dueDate,
    performedDate: fitnessToday(), status: "draft",
    entries: data.exercises.map((item) => normalizeFitnessEntry({ ...item, value: null, effort: null, notes: "" })),
    overallNotes: "", createdAt: now, updatedAt: now, completedAt: null, deletedAt: null
  };
  fitnessEditingResultId = fitnessOpenResult.id;
  fitnessDom.resultTitle.textContent = fitnessCheckLabel(fitnessOpenResult);
  fitnessDom.resultForm.elements.performedDate.value = fitnessOpenResult.performedDate;
  fitnessDom.resultForm.elements.performedDate.max = fitnessToday();
  fitnessDom.resultForm.elements.overallNotes.value = fitnessOpenResult.overallNotes;
  fitnessDom.resultFields.innerHTML = fitnessOpenResult.entries.map(fitnessEntryFields).join("");
  fitnessDom.resultStatus.textContent = "";
  fitnessDom.saveDraftButton.hidden = fitnessOpenResult.status === "completed";
  fitnessDom.resultForm.hidden = false;
  fitnessDom.startButton.hidden = true;
  fitnessDom.resultForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeFitnessResult() {
  fitnessOpenResult = null;
  fitnessEditingResultId = null;
  fitnessDom.resultForm.hidden = true;
  fitnessDom.resultStatus.textContent = "";
  renderFitnessView();
}

function collectFitnessResult(complete) {
  const form = fitnessDom.resultForm;
  const performedDate = form.elements.performedDate.value;
  if (!fitnessValidDate(performedDate) || performedDate > fitnessToday()) throw new Error("Choose today or an earlier performed date.");
  if (!fitnessOpenResult.entries.length) throw new Error("Add a test exercise before completing this check.");

  const entries = fitnessOpenResult.entries.map((entry) => {
    const row = [...fitnessDom.resultFields.querySelectorAll("[data-fitness-entry]")].find((item) => item.dataset.fitnessEntry === entry.id);
    if (!row) throw new Error("A test result field could not be found.");
    const readNumber = (name) => {
      const raw = row.querySelector(`[name="${name}"]`)?.value.trim() ?? "";
      if (!raw) return null;
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0 || value > 999999) throw new Error(`Enter a valid result for ${entry.name}.`);
      return value;
    };
    const effortRaw = row.querySelector('[name="effort"]').value.trim();
    const effort = effortRaw ? Number(effortRaw) : null;
    if (effort !== null && (!Number.isInteger(effort) || effort < 1 || effort > 10)) throw new Error(`Effort for ${entry.name} must be 1–10.`);
    const update = { ...entry, effort, notes: row.querySelector('[name="notes"]').value.trim() };
    if (entry.resultType === "number") {
      if (entry.bilateral) {
        update.left = readNumber("left");
        update.right = readNumber("right");
        if (complete && (update.left === null || update.right === null)) throw new Error(`Enter both sides for ${entry.name}.`);
      } else {
        update.value = readNumber("value");
        if (complete && update.value === null) throw new Error(`Enter a result for ${entry.name}.`);
      }
    } else {
      update.value = row.querySelector('[name="value"]').value.trim();
      if (complete && !update.value) throw new Error(`Enter a result for ${entry.name}.`);
    }
    return normalizeFitnessEntry(update);
  });
  const now = Date.now();
  return normalizeFitnessResult({
    ...fitnessOpenResult,
    performedDate,
    entries,
    overallNotes: form.elements.overallNotes.value,
    status: complete ? "completed" : "draft",
    updatedAt: now,
    completedAt: complete ? (fitnessOpenResult.completedAt || now) : null
  });
}

function saveFitnessResult(complete, event) {
  event?.preventDefault();
  if (!fitnessOpenResult) return;
  try {
    const record = collectFitnessResult(complete);
    const data = loadFitnessData();
    if (complete && data.results.some((item) => item.checkpointId === record.checkpointId && item.status === "completed" && !item.deletedAt && item.id !== record.id)) {
      throw new Error("This check already has a completed result. Edit that result instead.");
    }
    data.results = [...data.results.filter((item) => item.id !== record.id), record];
    fitnessOpenResult = null;
    fitnessEditingResultId = null;
    fitnessDom.resultForm.hidden = true;
    saveFitnessData(data);
    fitnessDom.currentStatus.textContent = complete ? "Fitness check completed. The next scheduled check is now active." : "Draft saved. Reminders continue until the check is completed.";
    showToast(complete ? "Fitness check completed." : "Fitness check draft saved.");
  } catch (error) {
    fitnessDom.resultStatus.textContent = error?.message || "The fitness check could not be saved.";
  }
}

function handleFitnessHistory(event) {
  const row = event.target.closest("[data-id]");
  if (!row) return;
  const data = loadFitnessData();
  const record = data.results.find((item) => item.id === row.dataset.id && !item.deletedAt);
  if (!record) return;
  if (event.target.closest(".fitness-edit-result")) openFitnessResult(record);
  if (event.target.closest(".fitness-delete-result") && window.confirm(`Delete this ${record.kind} fitness check result?`)) {
    const now = Date.now();
    data.results = data.results.map((item) => item.id === record.id ? { ...item, deletedAt: now, updatedAt: now } : item);
    if (fitnessEditingResultId === record.id) closeFitnessResult();
    saveFitnessData(data);
    showToast("Fitness check result deleted.");
  }
}

async function copyFitnessForAi() {
  const data = loadFitnessData();
  const completed = data.results.filter((item) => item.status === "completed" && !item.deletedAt)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  if (!completed.length) return;
  const payload = {
    export_type: "Wellbeing fitness checks — all completed",
    generated_at: new Date().toISOString(),
    analysis_request: "Compare my annual and midyear fitness checks over time. Consider my recorded exercise methods, effort, notes and conditions as well as raw results. Highlight changes that may warrant retesting; do not treat different test methods as directly comparable.",
    first_yearly_check_date: data.anchorDate,
    completed_checks: completed.map((record) => ({
      checkpoint: record.kind, scheduled_date: record.dueDate, performed_date: record.performedDate,
      exercises: record.entries.map((entry) => ({
        name: entry.name, result_format: entry.resultType, unit: entry.unit || null,
        left: entry.bilateral ? entry.left : null, right: entry.bilateral ? entry.right : null,
        result: entry.bilateral ? null : entry.value, method: entry.instructions || null,
        effort_1_to_10: entry.effort, notes: entry.notes || null
      })),
      overall_notes: record.overallNotes || null
    }))
  };
  try {
    await writeClipboardText(`WELLBEING — FITNESS CHECK HISTORY\n\n${JSON.stringify(payload, null, 2)}`);
    fitnessDom.copyStatus.textContent = `${completed.length} completed ${completed.length === 1 ? "check" : "checks"} copied for AI.`;
    showToast("Fitness checks copied for AI.");
  } catch {
    fitnessDom.copyStatus.textContent = "Copy failed. Allow clipboard access and try again.";
  }
}

function mergeFitnessData(localValue, cloudValue, preferLocal = false) {
  const local = normalizeFitnessData(localValue);
  const cloud = normalizeFitnessData(cloudValue);
  const resetAt = Math.max(local.resetAt, cloud.resetAt);
  const localConfig = local.resetAt > cloud.resetAt || (
    local.resetAt === cloud.resetAt && (local.configUpdatedAt > cloud.configUpdatedAt
      || (preferLocal && local.configUpdatedAt === cloud.configUpdatedAt))
  );
  const config = localConfig ? local : cloud;
  const results = new Map();
  for (const record of [...cloud.results, ...local.results]) {
    if (record.updatedAt < resetAt) continue;
    const previous = results.get(record.id);
    if (!previous || record.updatedAt >= previous.updatedAt) results.set(record.id, record);
  }
  return normalizeFitnessData({
    anchorDate: config.anchorDate,
    exercises: config.exercises,
    configUpdatedAt: config.configUpdatedAt,
    resetAt,
    results: [...results.values()].sort((a, b) => a.id.localeCompare(b.id))
  });
}

function updateFitnessSyncStatus(message = "") {
  if (!fitnessDom.syncStatus) return;
  const pending = localStorage.getItem(fitnessPendingStorageKey()) === "1";
  fitnessDom.syncStatus.textContent = message || (fitnessSyncBusy ? "Syncing fitness checks…"
    : !navigator.onLine || !authSession ? (pending ? "Saved on this device · sync pending" : "Available offline")
      : pending ? "Fitness-check changes waiting to sync" : "Fitness checks up to date");
}

async function syncFitnessData() {
  if (fitnessSyncBusy) { fitnessSyncRequested = true; return false; }
  if (!authClient || !authSession || !navigator.onLine) { updateFitnessSyncStatus(); return false; }
  fitnessSyncBusy = true;
  let syncError = false;
  updateFitnessSyncStatus();
  try {
    const userId = authSession.user.id;
    const storageKey = fitnessStorageKey();
    const pendingKey = fitnessPendingStorageKey();
    const original = localStorage.getItem(storageKey);
    const pending = localStorage.getItem(pendingKey) === "1";
    const local = loadFitnessData();
    const response = await authClient.from("fitness_check_data")
      .select("anchor_date, exercises, results, config_updated_at, reset_at")
      .eq("user_id", userId).maybeSingle();
    if (response.error) throw response.error;
    if (authSession?.user?.id !== userId) return false;
    const cloud = response.data ? normalizeFitnessData({
      anchorDate: response.data.anchor_date,
      exercises: response.data.exercises,
      results: response.data.results,
      configUpdatedAt: response.data.config_updated_at,
      resetAt: response.data.reset_at
    }) : normalizeFitnessData(null);
    const merged = mergeFitnessData(local, cloud, pending);
    if (response.data && JSON.stringify(merged) === JSON.stringify(cloud)) {
      // Nothing to send; still refresh this device with changes from another device.
    } else if (response.data || merged.anchorDate || merged.exercises.length || merged.results.length || merged.resetAt) {
      const saved = await authClient.from("fitness_check_data").upsert({
        user_id: userId, anchor_date: merged.anchorDate, exercises: merged.exercises,
        results: merged.results, config_updated_at: merged.configUpdatedAt, reset_at: merged.resetAt
      }, { onConflict: "user_id" });
      if (saved.error) throw saved.error;
    }
    if (authSession?.user?.id !== userId) return false;
    if (original === localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, JSON.stringify(merged));
      localStorage.removeItem(pendingKey);
    } else {
      const latest = loadFitnessData();
      localStorage.setItem(storageKey, JSON.stringify(mergeFitnessData(latest, merged, true)));
      fitnessSyncRequested = true;
    }
    updateFitnessPushState();
    if (fitnessDom.resultForm.hidden) renderFitnessView();
    updateFitnessSyncStatus();
    return true;
  } catch (error) {
    syncError = true;
    const message = String(error?.message || "");
    updateFitnessSyncStatus(/fitness_check_data|relation.*exist|schema cache/i.test(message)
      ? "Fitness sync needs the included database migration"
      : `Fitness sync pending: ${message || "try again when connected"}`);
    return false;
  } finally {
    fitnessSyncBusy = false;
    if (!syncError) updateFitnessSyncStatus();
    if (fitnessSyncRequested && authSession && navigator.onLine) {
      fitnessSyncRequested = false;
      window.setTimeout(() => syncFitnessData().catch(() => {}), 0);
    }
  }
}

function getFitnessBackupData() {
  return { fitnessCheckData: loadFitnessData() };
}

function validateFitnessBackupData(data) {
  if (data.fitnessCheckData === undefined) return { fitnessCheckData: normalizeFitnessData(null) };
  const source = data.fitnessCheckData;
  if (!source || typeof source !== "object" || Array.isArray(source)
      || (source.anchorDate !== null && !fitnessValidDate(source.anchorDate))
      || !Array.isArray(source.exercises) || source.exercises.some((item) => !normalizeFitnessExercise(item))
      || !Array.isArray(source.results) || source.results.some((item) => !normalizeFitnessResult(item))) {
    throw new Error("The fitness checks in this backup are invalid.");
  }
  return { fitnessCheckData: normalizeFitnessData(source) };
}

function applyFitnessBackupData(data) {
  const imported = normalizeFitnessData(data.fitnessCheckData);
  const resetAt = Date.now();
  imported.resetAt = resetAt;
  imported.configUpdatedAt = resetAt;
  imported.results = imported.results.map((record) => ({ ...record, updatedAt: resetAt }));
  localStorage.setItem(fitnessStorageKey(), JSON.stringify(imported));
  localStorage.setItem(fitnessPendingStorageKey(), "1");
  updateFitnessPushState();
  closeFitnessResult();
  renderFitnessView();
}

function bindFitnessEvents() {
  if (!fitnessDom.openButton) return;
  fitnessDom.openButton.addEventListener("click", () => showScreen("fitness"));
  fitnessDom.backButton.addEventListener("click", () => { closeFitnessResult(); showScreen("recovery"); });
  fitnessDom.scheduleForm.addEventListener("submit", submitFitnessSchedule);
  fitnessDom.exerciseForm.addEventListener("submit", submitFitnessExercise);
  fitnessDom.exerciseForm.elements.resultType.addEventListener("change", updateFitnessExerciseOptions);
  fitnessDom.cancelExerciseEdit.addEventListener("click", resetFitnessExerciseForm);
  fitnessDom.exerciseList.addEventListener("click", handleFitnessExerciseList);
  fitnessDom.startButton.addEventListener("click", () => openFitnessResult());
  fitnessDom.resultForm.addEventListener("submit", (event) => saveFitnessResult(true, event));
  fitnessDom.saveDraftButton.addEventListener("click", (event) => saveFitnessResult(false, event));
  fitnessDom.cancelResultButton.addEventListener("click", closeFitnessResult);
  fitnessDom.history.addEventListener("click", handleFitnessHistory);
  fitnessDom.copyButton.addEventListener("click", copyFitnessForAi);
}

function initializeFitness() {
  if (!fitnessDom.openButton) return;
  bindFitnessEvents();
  updateFitnessExerciseOptions();
  renderFitnessView();
  updateFitnessPushState();
}
