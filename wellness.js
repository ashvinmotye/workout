"use strict";

const RECOVERY_CHECKINS_KEY = "voiceWorkout.recoveryCheckins.v1";
const BODY_WEIGHT_ENTRIES_KEY = "voiceWorkout.bodyWeightEntries.v1";
const WELLNESS_SYNC_QUEUE_KEY = "voiceWorkout.wellnessSyncQueue.v1";
const WELLNESS_LAST_SYNC_KEY_PREFIX = "voiceWorkout.wellnessLastSync.v1";
const WELLNESS_CLOUD_IDS_KEY_PREFIX = "voiceWorkout.wellnessCloudIds.v1";
const WELLNESS_PULL_IDS_KEY_PREFIX = "voiceWorkout.wellnessPullIds.v1";

const WELLNESS_ENTITY = Object.freeze({
  RECOVERY: "recovery",
  WEIGHT: "weight"
});

const wellnessDom = {
  readinessForm: document.querySelector("#readinessForm"),
  readinessResult: document.querySelector("#readinessResult"),
  readinessScore: document.querySelector("#readinessScore"),
  readinessLabel: document.querySelector("#readinessLabel"),
  readinessGuidance: document.querySelector("#readinessGuidance"),
  readinessSavedBadge: document.querySelector("#readinessSavedBadge"),
  saveReadinessButton: document.querySelector("#saveReadinessButton"),
  resetReadinessButton: document.querySelector("#resetReadinessButton"),
  readinessFormStatus: document.querySelector("#readinessFormStatus"),
  readinessHistoryCount: document.querySelector("#readinessHistoryCount"),
  readinessHistory: document.querySelector("#readinessHistory"),
  weightForm: document.querySelector("#weightForm"),
  saveWeightButton: document.querySelector("#saveWeightButton"),
  resetWeightButton: document.querySelector("#resetWeightButton"),
  weightFormStatus: document.querySelector("#weightFormStatus"),
  latestWeight: document.querySelector("#latestWeight"),
  weightChange: document.querySelector("#weightChange"),
  weightSevenDayAverage: document.querySelector("#weightSevenDayAverage"),
  weightChart: document.querySelector("#weightChart"),
  weightChartSummary: document.querySelector("#weightChartSummary"),
  weightHistoryCount: document.querySelector("#weightHistoryCount"),
  weightHistory: document.querySelector("#weightHistory"),
  wellnessSyncStatus: document.querySelector("#wellnessSyncStatus"),
  syncWellnessButton: document.querySelector("#syncWellnessButton"),
  settingsReadinessCount: document.querySelector("#settingsReadinessCount"),
  settingsWeightCount: document.querySelector("#settingsWeightCount"),
  wellnessTrendPanel: document.querySelector("#wellnessTrendPanel"),
  trendLatestReadiness: document.querySelector("#trendLatestReadiness"),
  trendLatestReadinessDate: document.querySelector("#trendLatestReadinessDate"),
  trendAverageReadiness: document.querySelector("#trendAverageReadiness"),
  trendReadinessCoverage: document.querySelector("#trendReadinessCoverage"),
  trendLatestWeight: document.querySelector("#trendLatestWeight"),
  trendLatestWeightDate: document.querySelector("#trendLatestWeightDate"),
  trendWeightChange: document.querySelector("#trendWeightChange"),
  wellnessTrendInsight: document.querySelector("#wellnessTrendInsight")
};

let wellnessSyncInProgress = false;
let wellnessSyncRequested = false;

function wellnessTodayKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function normalizeWellnessDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function wellnessDateToLocalDate(value) {
  const normalized = normalizeWellnessDate(value);
  if (!normalized) return null;
  const [year, month, day] = normalized.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function formatWellnessDate(value, options = {}) {
  const date = wellnessDateToLocalDate(value);
  if (!date) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: options.short ? undefined : "medium",
    month: options.short ? "short" : undefined,
    day: options.short ? "numeric" : undefined
  }).format(date);
}

function wellnessUserId() {
  return authSession?.user?.id || loadCachedAuthUser()?.id || null;
}

function wellnessRecordId(entity, date, userId = wellnessUserId()) {
  const owner = userId || "local";
  return `${entity}-${owner}-${date}`;
}

function normalizeWellnessTimestamp(value, fallback = Date.now()) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function calculateReadinessScore(values) {
  const sleep = clampInteger(values.sleepQuality, 1, 5, 3);
  const energy = clampInteger(values.energyLevel, 1, 5, 3);
  const sorenessRecovery = 6 - clampInteger(values.muscleSoreness, 1, 5, 3);
  const stressRecovery = 6 - clampInteger(values.stressLevel, 1, 5, 3);
  const motivation = clampInteger(values.motivationLevel, 1, 5, 3);
  const total = sleep + energy + sorenessRecovery + stressRecovery + motivation;
  return Math.round((total - 5) / 20 * 100);
}

function getReadinessLevel(score) {
  if (score >= 80) {
    return {
      key: "high",
      label: "High readiness",
      guidance: "Your recovery signals are strong. Train as planned while keeping normal technique checks."
    };
  }
  if (score >= 60) {
    return {
      key: "good",
      label: "Good readiness",
      guidance: "You look ready for the planned session. Let the warm-up confirm how your body feels."
    };
  }
  if (score >= 40) {
    return {
      key: "moderate",
      label: "Moderate readiness",
      guidance: "Use your warm-up as a final check and adjust volume or intensity if needed."
    };
  }
  if (score >= 20) {
    return {
      key: "low",
      label: "Low readiness",
      guidance: "Consider a lighter session, easy walking, mobility, or extra recovery today."
    };
  }
  return {
    key: "very-low",
    label: "Very low readiness",
    guidance: "Prioritise recovery and avoid forcing a demanding session. Reassess later if you feel better."
  };
}

function getRecoveryCheckinForTimestamp(timestamp) {
  const date = new Date(Number(timestamp));
  if (Number.isNaN(date.getTime())) return null;
  const dateKey = wellnessTodayKey(date);
  return loadRecoveryCheckins().find((record) => record.checkinDate === dateKey) || null;
}

function normalizeRecoveryCheckin(record) {
  if (!record || typeof record !== "object") return null;
  const checkinDate = normalizeWellnessDate(record.checkinDate ?? record.checkin_date);
  if (!checkinDate) return null;
  const createdAt = normalizeWellnessTimestamp(record.createdAt ?? record.client_created_at);
  const updatedAt = Math.max(createdAt, normalizeWellnessTimestamp(record.updatedAt ?? record.client_updated_at, createdAt));
  const normalized = {
    id: typeof record.id === "string" && record.id
      ? record.id
      : wellnessRecordId(WELLNESS_ENTITY.RECOVERY, checkinDate),
    checkinDate,
    sleepQuality: clampInteger(record.sleepQuality ?? record.sleep_quality, 1, 5, 3),
    energyLevel: clampInteger(record.energyLevel ?? record.energy_level, 1, 5, 3),
    muscleSoreness: clampInteger(record.muscleSoreness ?? record.muscle_soreness, 1, 5, 3),
    stressLevel: clampInteger(record.stressLevel ?? record.stress_level, 1, 5, 3),
    motivationLevel: clampInteger(record.motivationLevel ?? record.motivation_level, 1, 5, 3),
    notes: typeof record.notes === "string" ? record.notes.trim().slice(0, 500) : "",
    createdAt,
    updatedAt
  };
  normalized.readinessScore = calculateReadinessScore(normalized);
  return normalized;
}

function normalizeWeightEntry(record) {
  if (!record || typeof record !== "object") return null;
  const measurementDate = normalizeWellnessDate(record.measurementDate ?? record.measurement_date);
  const weightKg = Number(record.weightKg ?? record.weight_kg);
  if (!measurementDate || !Number.isFinite(weightKg) || weightKg < 30 || weightKg > 300) return null;
  const createdAt = normalizeWellnessTimestamp(record.createdAt ?? record.client_created_at);
  const updatedAt = Math.max(createdAt, normalizeWellnessTimestamp(record.updatedAt ?? record.client_updated_at, createdAt));
  return {
    id: typeof record.id === "string" && record.id
      ? record.id
      : wellnessRecordId(WELLNESS_ENTITY.WEIGHT, measurementDate),
    measurementDate,
    weightKg: Math.round(weightKg * 100) / 100,
    notes: typeof record.notes === "string" ? record.notes.trim().slice(0, 200) : "",
    createdAt,
    updatedAt
  };
}

function loadRecoveryCheckins() {
  const parsed = safeJsonParse(localStorage.getItem(RECOVERY_CHECKINS_KEY));
  if (!Array.isArray(parsed)) return [];
  return parsed.map(normalizeRecoveryCheckin).filter(Boolean).sort((a, b) => b.checkinDate.localeCompare(a.checkinDate));
}

function saveRecoveryCheckins(records) {
  const byDate = new Map();
  records.map(normalizeRecoveryCheckin).filter(Boolean).forEach((record) => {
    const existing = byDate.get(record.checkinDate);
    if (!existing || record.updatedAt >= existing.updatedAt) byDate.set(record.checkinDate, record);
  });
  const normalized = [...byDate.values()].sort((a, b) => b.checkinDate.localeCompare(a.checkinDate));
  localStorage.setItem(RECOVERY_CHECKINS_KEY, JSON.stringify(normalized));
}

function loadWeightEntries() {
  const parsed = safeJsonParse(localStorage.getItem(BODY_WEIGHT_ENTRIES_KEY));
  if (!Array.isArray(parsed)) return [];
  return parsed.map(normalizeWeightEntry).filter(Boolean).sort((a, b) => b.measurementDate.localeCompare(a.measurementDate));
}

function saveWeightEntries(records) {
  const byDate = new Map();
  records.map(normalizeWeightEntry).filter(Boolean).forEach((record) => {
    const existing = byDate.get(record.measurementDate);
    if (!existing || record.updatedAt >= existing.updatedAt) byDate.set(record.measurementDate, record);
  });
  const normalized = [...byDate.values()].sort((a, b) => b.measurementDate.localeCompare(a.measurementDate));
  localStorage.setItem(BODY_WEIGHT_ENTRIES_KEY, JSON.stringify(normalized));
}

function wellnessLastSyncKey(userId = wellnessUserId()) {
  return userId ? `${WELLNESS_LAST_SYNC_KEY_PREFIX}.${userId}` : null;
}

function wellnessCloudIdsKey(entity, userId = wellnessUserId()) {
  return userId ? `${WELLNESS_CLOUD_IDS_KEY_PREFIX}.${entity}.${userId}` : null;
}

function wellnessPullIdsKey(entity, userId = wellnessUserId()) {
  return userId ? `${WELLNESS_PULL_IDS_KEY_PREFIX}.${entity}.${userId}` : null;
}

function loadWellnessIdSet(prefixFunction, entity, userId = wellnessUserId()) {
  const key = prefixFunction(entity, userId);
  if (!key) return new Set();
  const parsed = safeJsonParse(localStorage.getItem(key));
  return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string" && id) : []);
}

function saveWellnessIdSet(prefixFunction, entity, ids, userId = wellnessUserId()) {
  const key = prefixFunction(entity, userId);
  if (!key) return;
  localStorage.setItem(key, JSON.stringify([...new Set(ids)].sort()));
}

function wellnessSyncOperationId() {
  return `wellness-sync-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeWellnessSyncOperation(operation) {
  if (!operation || typeof operation !== "object") return null;
  const entity = operation.entity;
  const type = operation.type;
  const userId = typeof operation.userId === "string" && operation.userId ? operation.userId : wellnessUserId();
  if (!userId || !Object.values(WELLNESS_ENTITY).includes(entity) || (type !== "upsert" && type !== "delete")) return null;
  if (typeof operation.id !== "string" || !operation.id) return null;
  const normalizer = entity === WELLNESS_ENTITY.RECOVERY ? normalizeRecoveryCheckin : normalizeWeightEntry;
  const record = type === "upsert" ? normalizer(operation.record) : null;
  if (type === "upsert" && !record) return null;
  return {
    queueId: typeof operation.queueId === "string" ? operation.queueId : wellnessSyncOperationId(),
    entity,
    type,
    id: operation.id,
    userId,
    record,
    queuedAt: normalizeWellnessTimestamp(operation.queuedAt)
  };
}

function loadWellnessSyncQueue() {
  const parsed = safeJsonParse(localStorage.getItem(WELLNESS_SYNC_QUEUE_KEY));
  if (!Array.isArray(parsed)) return [];
  return parsed.map(normalizeWellnessSyncOperation).filter(Boolean).sort((a, b) => a.queuedAt - b.queuedAt);
}

function saveWellnessSyncQueue(operations) {
  const normalized = operations.map(normalizeWellnessSyncOperation).filter(Boolean).sort((a, b) => a.queuedAt - b.queuedAt);
  if (normalized.length) localStorage.setItem(WELLNESS_SYNC_QUEUE_KEY, JSON.stringify(normalized));
  else localStorage.removeItem(WELLNESS_SYNC_QUEUE_KEY);
  updateWellnessSyncStatus();
}

function queueWellnessOperation(entity, type, recordOrId) {
  const userId = wellnessUserId();
  if (!userId) return;
  const id = type === "upsert" ? recordOrId.id : recordOrId;
  const operations = loadWellnessSyncQueue().filter((operation) => (
    operation.userId !== userId || operation.entity !== entity || operation.id !== id
  ));
  operations.push({
    queueId: wellnessSyncOperationId(),
    entity,
    type,
    id,
    userId,
    record: type === "upsert" ? recordOrId : null,
    queuedAt: Date.now()
  });
  saveWellnessSyncQueue(operations);
}

function recoveryToCloudRow(record) {
  const normalized = normalizeRecoveryCheckin(record);
  return {
    id: normalized.id,
    user_id: authSession.user.id,
    checkin_date: normalized.checkinDate,
    sleep_quality: normalized.sleepQuality,
    energy_level: normalized.energyLevel,
    muscle_soreness: normalized.muscleSoreness,
    stress_level: normalized.stressLevel,
    motivation_level: normalized.motivationLevel,
    readiness_score: normalized.readinessScore,
    notes: normalized.notes,
    client_created_at: new Date(normalized.createdAt).toISOString(),
    client_updated_at: new Date(normalized.updatedAt).toISOString()
  };
}

function weightToCloudRow(record) {
  const normalized = normalizeWeightEntry(record);
  return {
    id: normalized.id,
    user_id: authSession.user.id,
    measurement_date: normalized.measurementDate,
    weight_kg: normalized.weightKg,
    notes: normalized.notes,
    client_created_at: new Date(normalized.createdAt).toISOString(),
    client_updated_at: new Date(normalized.updatedAt).toISOString()
  };
}

function cloudRowToRecovery(row) {
  return normalizeRecoveryCheckin({
    id: row.id,
    checkinDate: row.checkin_date,
    sleepQuality: row.sleep_quality,
    energyLevel: row.energy_level,
    muscleSoreness: row.muscle_soreness,
    stressLevel: row.stress_level,
    motivationLevel: row.motivation_level,
    notes: row.notes,
    createdAt: Date.parse(row.client_created_at),
    updatedAt: Date.parse(row.client_updated_at)
  });
}

function cloudRowToWeight(row) {
  return normalizeWeightEntry({
    id: row.id,
    measurementDate: row.measurement_date,
    weightKg: row.weight_kg,
    notes: row.notes,
    createdAt: Date.parse(row.client_created_at),
    updatedAt: Date.parse(row.client_updated_at)
  });
}

function recordSuccessfulWellnessOperation(operation, userId) {
  const ids = loadWellnessIdSet(wellnessCloudIdsKey, operation.entity, userId);
  if (operation.type === "upsert") ids.add(operation.id);
  else ids.delete(operation.id);
  saveWellnessIdSet(wellnessCloudIdsKey, operation.entity, ids, userId);
}

async function processWellnessSyncQueue() {
  const userId = authSession.user.id;
  const recent = {
    [WELLNESS_ENTITY.RECOVERY]: { upsertedIds: new Set(), deletedIds: new Set() },
    [WELLNESS_ENTITY.WEIGHT]: { upsertedIds: new Set(), deletedIds: new Set() }
  };
  const operations = loadWellnessSyncQueue().filter((operation) => operation.userId === userId);
  for (const operation of operations) {
    const table = operation.entity === WELLNESS_ENTITY.RECOVERY ? "recovery_checkins" : "body_weight_entries";
    let response;
    if (operation.type === "upsert") {
      const row = operation.entity === WELLNESS_ENTITY.RECOVERY
        ? recoveryToCloudRow(operation.record)
        : weightToCloudRow(operation.record);
      response = await authClient.from(table).upsert(row, { onConflict: "id" });
    } else {
      response = await authClient.from(table).delete().eq("id", operation.id);
    }
    if (response.error) throw response.error;
    recordSuccessfulWellnessOperation(operation, userId);
    recent[operation.entity][operation.type === "upsert" ? "upsertedIds" : "deletedIds"].add(operation.id);
    const latest = loadWellnessSyncQueue();
    saveWellnessSyncQueue(latest.filter((item) => item.queueId !== operation.queueId));
  }
  return recent;
}

function mergeWellnessPull(entity, cloudRecords, recentChanges) {
  const userId = authSession.user.id;
  const loadLocal = entity === WELLNESS_ENTITY.RECOVERY ? loadRecoveryCheckins : loadWeightEntries;
  const saveLocal = entity === WELLNESS_ENTITY.RECOVERY ? saveRecoveryCheckins : saveWeightEntries;
  const previousCloudIds = loadWellnessIdSet(wellnessCloudIdsKey, entity, userId);
  const previousPullIds = loadWellnessIdSet(wellnessPullIdsKey, entity, userId);
  const currentCloudIds = new Set(cloudRecords.map((record) => record.id));
  const recentUpserts = recentChanges?.upsertedIds instanceof Set ? recentChanges.upsertedIds : new Set();
  const merged = new Map();

  loadLocal().forEach((record) => {
    if (previousPullIds.has(record.id) && !currentCloudIds.has(record.id) && !recentUpserts.has(record.id)) return;
    merged.set(record.id, record);
  });
  cloudRecords.forEach((record) => {
    const existing = merged.get(record.id);
    if (!existing || record.updatedAt >= existing.updatedAt) merged.set(record.id, record);
  });
  saveLocal([...merged.values()]);

  const knownCloudIds = new Set(currentCloudIds);
  previousCloudIds.forEach((id) => {
    if (!previousPullIds.has(id) || recentUpserts.has(id)) knownCloudIds.add(id);
  });
  saveWellnessIdSet(wellnessCloudIdsKey, entity, knownCloudIds, userId);
  saveWellnessIdSet(wellnessPullIdsKey, entity, currentCloudIds, userId);
}

async function pullWellnessFromCloud(recent) {
  const [recoveryResponse, weightResponse] = await Promise.all([
    authClient
      .from("recovery_checkins")
      .select("id, checkin_date, sleep_quality, energy_level, muscle_soreness, stress_level, motivation_level, readiness_score, notes, client_created_at, client_updated_at")
      .order("checkin_date", { ascending: false }),
    authClient
      .from("body_weight_entries")
      .select("id, measurement_date, weight_kg, notes, client_created_at, client_updated_at")
      .order("measurement_date", { ascending: false })
  ]);
  if (recoveryResponse.error) throw recoveryResponse.error;
  if (weightResponse.error) throw weightResponse.error;

  const recoveryDeletes = recent[WELLNESS_ENTITY.RECOVERY].deletedIds;
  const weightDeletes = recent[WELLNESS_ENTITY.WEIGHT].deletedIds;
  const cloudRecovery = (recoveryResponse.data || [])
    .filter((row) => !recoveryDeletes.has(row.id))
    .map(cloudRowToRecovery)
    .filter(Boolean);
  const cloudWeights = (weightResponse.data || [])
    .filter((row) => !weightDeletes.has(row.id))
    .map(cloudRowToWeight)
    .filter(Boolean);

  mergeWellnessPull(WELLNESS_ENTITY.RECOVERY, cloudRecovery, recent[WELLNESS_ENTITY.RECOVERY]);
  mergeWellnessPull(WELLNESS_ENTITY.WEIGHT, cloudWeights, recent[WELLNESS_ENTITY.WEIGHT]);
  return cloudRecovery.length + cloudWeights.length;
}

function setWellnessSyncStatus(message, state = "") {
  if (!wellnessDom.wellnessSyncStatus) return;
  wellnessDom.wellnessSyncStatus.textContent = message;
  wellnessDom.wellnessSyncStatus.classList.toggle("is-error", state === "error");
  wellnessDom.wellnessSyncStatus.classList.toggle("is-waiting", state === "waiting");
  wellnessDom.wellnessSyncStatus.classList.toggle("is-success", state === "success");
  wellnessDom.syncWellnessButton.disabled = wellnessSyncInProgress || !authSession || !navigator.onLine;
}

function updateWellnessSyncStatus() {
  if (!wellnessDom.wellnessSyncStatus) return;
  const userId = wellnessUserId();
  const pending = loadWellnessSyncQueue().filter((operation) => operation.userId === userId).length;
  if (!navigator.onLine || !authSession) {
    setWellnessSyncStatus(pending
      ? `${pending} recovery ${pending === 1 ? "change" : "changes"} waiting for connection`
      : "Offline — recovery data is available", "waiting");
    return;
  }
  if (wellnessSyncInProgress) {
    setWellnessSyncStatus("Syncing recovery and body data…", "waiting");
    return;
  }
  if (pending) {
    setWellnessSyncStatus(`${pending} recovery ${pending === 1 ? "change" : "changes"} waiting to sync`, "waiting");
    return;
  }
  const key = wellnessLastSyncKey(userId);
  const lastSync = key ? Number(localStorage.getItem(key)) : 0;
  setWellnessSyncStatus(lastSync ? formatLastHistorySync(lastSync) : "Ready to sync", lastSync ? "success" : "");
}

function friendlyWellnessSyncError(error) {
  const message = String(error?.message || "").trim();
  const normalized = message.toLocaleLowerCase();
  if (!navigator.onLine || normalized.includes("failed to fetch") || normalized.includes("network")) {
    return "Waiting for an internet connection";
  }
  if ((normalized.includes("recovery_checkins") || normalized.includes("body_weight_entries"))
    && (normalized.includes("not find") || normalized.includes("does not exist") || normalized.includes("relation"))) {
    return "Recovery sync needs the included Supabase migration";
  }
  if (normalized.includes("row-level security")) return "Recovery sync was blocked by the database security policy";
  return message ? `Recovery sync failed: ${message}` : "Recovery data could not be synced";
}

async function syncWellnessData(options = {}) {
  if (wellnessSyncInProgress) {
    wellnessSyncRequested = true;
    return false;
  }
  if (!authClient || !authSession || !navigator.onLine) {
    updateWellnessSyncStatus();
    if (options.manual) showToast("Recovery data will sync when you are online and signed in.");
    return false;
  }

  wellnessSyncInProgress = true;
  wellnessSyncRequested = false;
  updateWellnessSyncStatus();
  try {
    const recent = await processWellnessSyncQueue();
    const cloudCount = await pullWellnessFromCloud(recent);
    const syncedAt = Date.now();
    localStorage.setItem(wellnessLastSyncKey(authSession.user.id), String(syncedAt));
    renderRecoveryScreen();
    renderTrends();
    renderSettingsSummary();
    setWellnessSyncStatus(cloudCount
      ? `${formatLastHistorySync(syncedAt)} • ${cloudCount} cloud ${cloudCount === 1 ? "entry" : "entries"}`
      : formatLastHistorySync(syncedAt), "success");
    if (options.manual) showToast("Recovery and body data synced.");
    return true;
  } catch (error) {
    setWellnessSyncStatus(friendlyWellnessSyncError(error), "error");
    if (options.manual) showToast("Recovery sync failed.");
    return false;
  } finally {
    wellnessSyncInProgress = false;
    wellnessDom.syncWellnessButton.disabled = !authSession || !navigator.onLine;
    if (wellnessSyncRequested && authSession && navigator.onLine) {
      window.setTimeout(() => syncWellnessData(), 0);
    }
  }
}

function currentReadinessFormValues() {
  const form = wellnessDom.readinessForm;
  return {
    sleepQuality: Number(form.elements.sleepQuality.value),
    energyLevel: Number(form.elements.energyLevel.value),
    muscleSoreness: Number(form.elements.muscleSoreness.value),
    stressLevel: Number(form.elements.stressLevel.value),
    motivationLevel: Number(form.elements.motivationLevel.value)
  };
}

function renderLiveReadinessScore() {
  if (!wellnessDom.readinessForm) return;
  wellnessDom.readinessForm.querySelectorAll("input[type='range']").forEach((input) => {
    const output = wellnessDom.readinessForm.querySelector(`output[data-for="${input.name}"]`);
    if (output) output.value = input.value;
  });
  const score = calculateReadinessScore(currentReadinessFormValues());
  const level = getReadinessLevel(score);
  wellnessDom.readinessScore.textContent = String(score);
  wellnessDom.readinessLabel.textContent = level.label;
  wellnessDom.readinessGuidance.textContent = level.guidance;
  wellnessDom.readinessResult.dataset.level = level.key;
}

function populateReadinessForm(date = wellnessTodayKey()) {
  const normalizedDate = normalizeWellnessDate(date) || wellnessTodayKey();
  const record = loadRecoveryCheckins().find((item) => item.checkinDate === normalizedDate);
  const form = wellnessDom.readinessForm;
  form.elements.checkinDate.value = normalizedDate;
  form.elements.sleepQuality.value = String(record?.sleepQuality ?? 3);
  form.elements.energyLevel.value = String(record?.energyLevel ?? 3);
  form.elements.muscleSoreness.value = String(record?.muscleSoreness ?? 3);
  form.elements.stressLevel.value = String(record?.stressLevel ?? 3);
  form.elements.motivationLevel.value = String(record?.motivationLevel ?? 3);
  form.elements.notes.value = record?.notes || "";
  wellnessDom.saveReadinessButton.textContent = record ? "Update check-in" : "Save check-in";
  wellnessDom.readinessSavedBadge.hidden = !record;
  wellnessDom.readinessFormStatus.textContent = "";
  renderLiveReadinessScore();
}

function submitReadinessForm(event) {
  event.preventDefault();
  const form = wellnessDom.readinessForm;
  const checkinDate = normalizeWellnessDate(form.elements.checkinDate.value);
  if (!checkinDate || checkinDate > wellnessTodayKey()) {
    wellnessDom.readinessFormStatus.textContent = "Choose today or an earlier date.";
    return;
  }
  const records = loadRecoveryCheckins();
  const existing = records.find((record) => record.checkinDate === checkinDate);
  const now = Date.now();
  const record = normalizeRecoveryCheckin({
    id: existing?.id || wellnessRecordId(WELLNESS_ENTITY.RECOVERY, checkinDate),
    checkinDate,
    ...currentReadinessFormValues(),
    notes: form.elements.notes.value,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  });
  saveRecoveryCheckins([...records.filter((item) => item.checkinDate !== checkinDate), record]);
  queueWellnessOperation(WELLNESS_ENTITY.RECOVERY, "upsert", record);
  populateReadinessForm(checkinDate);
  renderRecoveryScreen({ preserveForms: true });
  renderTrends();
  renderSettingsSummary();
  wellnessDom.readinessFormStatus.textContent = navigator.onLine ? "Saved · syncing automatically" : "Saved on this device · sync pending";
  showToast("Recovery check-in saved.");
  syncWellnessData().catch(() => {});
}

function submitWeightForm(event) {
  event.preventDefault();
  const form = wellnessDom.weightForm;
  const measurementDate = normalizeWellnessDate(form.elements.measurementDate.value);
  const weightKg = Number(form.elements.weightKg.value);
  if (!measurementDate || measurementDate > wellnessTodayKey()) {
    wellnessDom.weightFormStatus.textContent = "Choose today or an earlier date.";
    return;
  }
  if (!Number.isFinite(weightKg) || weightKg < 30 || weightKg > 300) {
    wellnessDom.weightFormStatus.textContent = "Enter a weight between 30 and 300 kg.";
    return;
  }
  const records = loadWeightEntries();
  const existing = records.find((record) => record.measurementDate === measurementDate);
  const now = Date.now();
  const record = normalizeWeightEntry({
    id: existing?.id || wellnessRecordId(WELLNESS_ENTITY.WEIGHT, measurementDate),
    measurementDate,
    weightKg,
    notes: form.elements.notes.value,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  });
  saveWeightEntries([...records.filter((item) => item.measurementDate !== measurementDate), record]);
  queueWellnessOperation(WELLNESS_ENTITY.WEIGHT, "upsert", record);
  populateWeightForm(measurementDate);
  renderRecoveryScreen({ preserveForms: true });
  renderTrends();
  renderSettingsSummary();
  wellnessDom.weightFormStatus.textContent = navigator.onLine ? "Saved · syncing automatically" : "Saved on this device · sync pending";
  showToast("Body weight saved.");
  syncWellnessData().catch(() => {});
}

function populateWeightForm(date = wellnessTodayKey()) {
  const normalizedDate = normalizeWellnessDate(date) || wellnessTodayKey();
  const record = loadWeightEntries().find((item) => item.measurementDate === normalizedDate);
  const form = wellnessDom.weightForm;
  form.elements.measurementDate.value = normalizedDate;
  form.elements.weightKg.value = record ? String(record.weightKg) : "";
  form.elements.notes.value = record?.notes || "";
  wellnessDom.saveWeightButton.textContent = record ? "Update weight" : "Save weight";
  wellnessDom.weightFormStatus.textContent = "";
}

function formatWeight(value, signed = false) {
  if (!Number.isFinite(value)) return "—";
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)} kg`;
}

function renderReadinessHistory(records) {
  wellnessDom.readinessHistoryCount.textContent = `${records.length} ${records.length === 1 ? "entry" : "entries"}`;
  if (!records.length) {
    wellnessDom.readinessHistory.innerHTML = '<div class="recovery-empty-state"><strong>No check-ins yet</strong><span>Your readiness history will build here.</span></div>';
    return;
  }
  wellnessDom.readinessHistory.innerHTML = records.slice(0, 14).map((record) => {
    const level = getReadinessLevel(record.readinessScore);
    return `
      <article class="recovery-history-item" data-level="${level.key}">
        <div class="recovery-history-score"><strong>${record.readinessScore}</strong><small>/100</small></div>
        <div class="recovery-history-main">
          <strong>${escapeHtml(level.label)}</strong>
          <span>${escapeHtml(formatWellnessDate(record.checkinDate))}</span>
          <small>Sleep ${record.sleepQuality} · Energy ${record.energyLevel} · Soreness ${record.muscleSoreness} · Stress ${record.stressLevel}</small>
        </div>
        <div class="recovery-history-actions">
          <button class="mini-icon edit-readiness-entry" type="button" data-date="${record.checkinDate}" aria-label="Edit recovery check-in">✎</button>
          <button class="mini-icon delete-readiness-entry" type="button" data-id="${escapeHtml(record.id)}" aria-label="Delete recovery check-in">×</button>
        </div>
      </article>`;
  }).join("");
}

function calculateSevenDayWeightAverage(records) {
  if (!records.length) return null;
  const latestDate = wellnessDateToLocalDate(records[0].measurementDate);
  const cutoff = new Date(latestDate);
  cutoff.setDate(cutoff.getDate() - 6);
  const recent = records.filter((record) => wellnessDateToLocalDate(record.measurementDate) >= cutoff);
  return recent.length ? recent.reduce((sum, record) => sum + record.weightKg, 0) / recent.length : null;
}

function renderWeightChart(records) {
  const displayed = records.slice(0, 30).reverse();
  if (!displayed.length) {
    wellnessDom.weightChart.innerHTML = '<div class="weight-chart-empty">No measurements yet</div>';
    wellnessDom.weightChartSummary.textContent = "Add your first measurement to begin the trend.";
    return;
  }
  if (displayed.length === 1) {
    wellnessDom.weightChart.innerHTML = `<div class="weight-chart-single"><span></span><strong>${formatWeight(displayed[0].weightKg)}</strong></div>`;
    wellnessDom.weightChartSummary.textContent = `First measurement recorded ${formatWellnessDate(displayed[0].measurementDate)}.`;
    return;
  }

  const width = 640;
  const height = 220;
  const paddingX = 34;
  const paddingY = 28;
  const weights = displayed.map((record) => record.weightKg);
  const rawMin = Math.min(...weights);
  const rawMax = Math.max(...weights);
  const visualPadding = Math.max(0.4, (rawMax - rawMin) * 0.2);
  const min = rawMin - visualPadding;
  const max = rawMax + visualPadding;
  const x = (index) => paddingX + index / (displayed.length - 1) * (width - paddingX * 2);
  const y = (value) => paddingY + (max - value) / Math.max(0.1, max - min) * (height - paddingY * 2);
  const points = displayed.map((record, index) => `${x(index).toFixed(1)},${y(record.weightKg).toFixed(1)}`).join(" ");
  const circles = displayed.map((record, index) => `<circle cx="${x(index).toFixed(1)}" cy="${y(record.weightKg).toFixed(1)}" r="4"><title>${escapeHtml(formatWellnessDate(record.measurementDate))}: ${formatWeight(record.weightKg)}</title></circle>`).join("");
  const first = displayed[0];
  const latest = displayed[displayed.length - 1];
  wellnessDom.weightChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false">
      <line x1="${paddingX}" y1="${paddingY}" x2="${paddingX}" y2="${height - paddingY}"></line>
      <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}"></line>
      <text x="${paddingX}" y="18">${rawMax.toFixed(1)} kg</text>
      <text x="${paddingX}" y="${height - 7}">${escapeHtml(formatWellnessDate(first.measurementDate, { short: true }))}</text>
      <text x="${width - paddingX}" y="${height - 7}" text-anchor="end">${escapeHtml(formatWellnessDate(latest.measurementDate, { short: true }))}</text>
      <polyline points="${points}"></polyline>
      ${circles}
    </svg>`;
  const difference = Math.round((latest.weightKg - first.weightKg) * 10) / 10;
  wellnessDom.weightChartSummary.textContent = `${formatWeight(difference, true)} across ${displayed.length} recorded measurements.`;
}

function renderWeightHistory(records) {
  wellnessDom.weightHistoryCount.textContent = `${records.length} ${records.length === 1 ? "entry" : "entries"}`;
  if (!records.length) {
    wellnessDom.weightHistory.innerHTML = '<div class="recovery-empty-state"><strong>No measurements yet</strong><span>Your body-weight history will build here.</span></div>';
    return;
  }
  wellnessDom.weightHistory.innerHTML = records.slice(0, 14).map((record, index) => {
    const previous = records[index + 1];
    const change = previous ? Math.round((record.weightKg - previous.weightKg) * 10) / 10 : null;
    return `
      <article class="recovery-history-item weight-history-item">
        <div class="weight-history-value"><strong>${record.weightKg.toFixed(1)}</strong><small>kg</small></div>
        <div class="recovery-history-main">
          <strong>${escapeHtml(formatWellnessDate(record.measurementDate))}</strong>
          <span>${change === null ? "First measurement" : `${formatWeight(change, true)} from previous`}</span>
          ${record.notes ? `<small>${escapeHtml(record.notes)}</small>` : ""}
        </div>
        <div class="recovery-history-actions">
          <button class="mini-icon edit-weight-entry" type="button" data-date="${record.measurementDate}" aria-label="Edit body-weight measurement">✎</button>
          <button class="mini-icon delete-weight-entry" type="button" data-id="${escapeHtml(record.id)}" aria-label="Delete body-weight measurement">×</button>
        </div>
      </article>`;
  }).join("");
}

function renderWeightSummary(records) {
  const latest = records[0];
  const previous = records[1];
  wellnessDom.latestWeight.textContent = latest ? formatWeight(latest.weightKg) : "—";
  wellnessDom.weightChange.textContent = latest && previous
    ? formatWeight(Math.round((latest.weightKg - previous.weightKg) * 10) / 10, true)
    : "—";
  const average = calculateSevenDayWeightAverage(records);
  wellnessDom.weightSevenDayAverage.textContent = average === null ? "—" : formatWeight(average);
  renderWeightChart(records);
}

function renderRecoveryScreen(options = {}) {
  if (!wellnessDom.readinessForm) return;
  const checkins = loadRecoveryCheckins();
  const weights = loadWeightEntries();
  renderReadinessHistory(checkins);
  renderWeightSummary(weights);
  renderWeightHistory(weights);
  if (!options.preserveForms) {
    const selectedReadinessDate = normalizeWellnessDate(wellnessDom.readinessForm.elements.checkinDate.value) || wellnessTodayKey();
    const selectedWeightDate = normalizeWellnessDate(wellnessDom.weightForm.elements.measurementDate.value) || wellnessTodayKey();
    populateReadinessForm(selectedReadinessDate);
    populateWeightForm(selectedWeightDate);
  }
}

function findThirtyDayWeightChange(records) {
  if (records.length < 2) return null;
  const latest = records[0];
  const latestDate = wellnessDateToLocalDate(latest.measurementDate);
  const cutoff = new Date(latestDate);
  cutoff.setDate(cutoff.getDate() - 30);
  const candidates = records.filter((record) => wellnessDateToLocalDate(record.measurementDate) >= cutoff);
  const oldest = candidates[candidates.length - 1];
  if (!oldest || oldest.id === latest.id) return null;
  return Math.round((latest.weightKg - oldest.weightKg) * 10) / 10;
}

function renderWellnessTrendSummary() {
  if (!wellnessDom.wellnessTrendPanel) return;
  const checkins = loadRecoveryCheckins();
  const weights = loadWeightEntries();
  const hasData = checkins.length > 0 || weights.length > 0;
  wellnessDom.wellnessTrendPanel.hidden = !hasData;
  if (!hasData) return;

  const latestCheckin = checkins[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const recentCheckins = checkins.filter((record) => wellnessDateToLocalDate(record.checkinDate) >= sevenDaysAgo);
  const averageReadiness = recentCheckins.length
    ? Math.round(recentCheckins.reduce((sum, record) => sum + record.readinessScore, 0) / recentCheckins.length)
    : null;
  const latestWeight = weights[0];
  const weightChange = findThirtyDayWeightChange(weights);

  wellnessDom.trendLatestReadiness.textContent = latestCheckin ? `${latestCheckin.readinessScore}/100` : "—";
  wellnessDom.trendLatestReadinessDate.textContent = latestCheckin ? formatWellnessDate(latestCheckin.checkinDate) : "No check-in";
  wellnessDom.trendAverageReadiness.textContent = averageReadiness === null ? "—" : `${averageReadiness}/100`;
  wellnessDom.trendReadinessCoverage.textContent = `${recentCheckins.length} ${recentCheckins.length === 1 ? "check-in" : "check-ins"}`;
  wellnessDom.trendLatestWeight.textContent = latestWeight ? formatWeight(latestWeight.weightKg) : "—";
  wellnessDom.trendLatestWeightDate.textContent = latestWeight ? formatWellnessDate(latestWeight.measurementDate) : "No measurement";
  wellnessDom.trendWeightChange.textContent = weightChange === null ? "—" : formatWeight(weightChange, true);

  const insights = [];
  if (latestCheckin && averageReadiness !== null) {
    const difference = latestCheckin.readinessScore - averageReadiness;
    if (Math.abs(difference) >= 5) insights.push(`Latest readiness is ${Math.abs(difference)} points ${difference > 0 ? "above" : "below"} your 7-day average.`);
    else insights.push("Latest readiness is close to your 7-day average.");
  }
  if (weightChange !== null) insights.push(`Recorded body weight changed ${formatWeight(weightChange, true)} within the latest 30-day window.`);
  insights.push("Use repeated measurements to judge the direction; a single day can fluctuate normally.");
  wellnessDom.wellnessTrendInsight.textContent = insights.join(" ");
}

function editWellnessRecord(entity, date) {
  if (entity === WELLNESS_ENTITY.RECOVERY) populateReadinessForm(date);
  else populateWeightForm(date);
  const target = entity === WELLNESS_ENTITY.RECOVERY ? wellnessDom.readinessForm : wellnessDom.weightForm;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteWellnessRecord(entity, id) {
  const isRecovery = entity === WELLNESS_ENTITY.RECOVERY;
  const records = isRecovery ? loadRecoveryCheckins() : loadWeightEntries();
  const record = records.find((item) => item.id === id);
  if (!record) return;
  const label = isRecovery ? "recovery check-in" : "body-weight measurement";
  if (!window.confirm(`Delete this ${label}?`)) return;
  if (isRecovery) saveRecoveryCheckins(records.filter((item) => item.id !== id));
  else saveWeightEntries(records.filter((item) => item.id !== id));
  queueWellnessOperation(entity, "delete", id);
  renderRecoveryScreen();
  renderTrends();
  renderSettingsSummary();
  showToast(`${isRecovery ? "Recovery check-in" : "Body-weight measurement"} deleted.`);
  syncWellnessData().catch(() => {});
}

function getWellnessBackupData() {
  return {
    recoveryCheckins: loadRecoveryCheckins(),
    bodyWeightEntries: loadWeightEntries()
  };
}

function validateWellnessBackupData(data) {
  const recoverySource = data.recoveryCheckins === undefined ? [] : data.recoveryCheckins;
  const weightSource = data.bodyWeightEntries === undefined ? [] : data.bodyWeightEntries;
  if (!Array.isArray(recoverySource)) throw new Error("The recovery check-ins in this backup are invalid.");
  if (!Array.isArray(weightSource)) throw new Error("The body-weight entries in this backup are invalid.");
  const recoveryCheckins = recoverySource.map(normalizeRecoveryCheckin);
  const bodyWeightEntries = weightSource.map(normalizeWeightEntry);
  if (recoveryCheckins.some((record) => !record)) throw new Error("One or more recovery check-ins in this backup are invalid.");
  if (bodyWeightEntries.some((record) => !record)) throw new Error("One or more body-weight entries in this backup are invalid.");
  return { recoveryCheckins, bodyWeightEntries };
}

function applyWellnessBackupData(data) {
  saveRecoveryCheckins(data.recoveryCheckins || []);
  saveWeightEntries(data.bodyWeightEntries || []);
  (data.recoveryCheckins || []).forEach((record) => queueWellnessOperation(WELLNESS_ENTITY.RECOVERY, "upsert", record));
  (data.bodyWeightEntries || []).forEach((record) => queueWellnessOperation(WELLNESS_ENTITY.WEIGHT, "upsert", record));
  renderRecoveryScreen();
  updateWellnessSyncStatus();
}

function getWellnessCounts() {
  return {
    readiness: loadRecoveryCheckins().length,
    weight: loadWeightEntries().length
  };
}

function renderWellnessSettingsSummary() {
  const counts = getWellnessCounts();
  if (wellnessDom.settingsReadinessCount) wellnessDom.settingsReadinessCount.textContent = String(counts.readiness);
  if (wellnessDom.settingsWeightCount) wellnessDom.settingsWeightCount.textContent = String(counts.weight);
  updateWellnessSyncStatus();
}

function bindWellnessEvents() {
  if (!wellnessDom.readinessForm) return;
  wellnessDom.readinessForm.addEventListener("input", (event) => {
    if (event.target.matches("input[type='range']")) renderLiveReadinessScore();
  });
  wellnessDom.readinessForm.elements.checkinDate.addEventListener("change", (event) => populateReadinessForm(event.target.value));
  wellnessDom.readinessForm.addEventListener("submit", submitReadinessForm);
  wellnessDom.resetReadinessButton.addEventListener("click", () => populateReadinessForm(wellnessTodayKey()));
  wellnessDom.weightForm.elements.measurementDate.addEventListener("change", (event) => populateWeightForm(event.target.value));
  wellnessDom.weightForm.addEventListener("submit", submitWeightForm);
  wellnessDom.resetWeightButton.addEventListener("click", () => populateWeightForm(wellnessTodayKey()));
  wellnessDom.syncWellnessButton.addEventListener("click", () => syncWellnessData({ manual: true }));
  wellnessDom.readinessHistory.addEventListener("click", (event) => {
    const editButton = event.target.closest(".edit-readiness-entry");
    const deleteButton = event.target.closest(".delete-readiness-entry");
    if (editButton) editWellnessRecord(WELLNESS_ENTITY.RECOVERY, editButton.dataset.date);
    if (deleteButton) deleteWellnessRecord(WELLNESS_ENTITY.RECOVERY, deleteButton.dataset.id);
  });
  wellnessDom.weightHistory.addEventListener("click", (event) => {
    const editButton = event.target.closest(".edit-weight-entry");
    const deleteButton = event.target.closest(".delete-weight-entry");
    if (editButton) editWellnessRecord(WELLNESS_ENTITY.WEIGHT, editButton.dataset.date);
    if (deleteButton) deleteWellnessRecord(WELLNESS_ENTITY.WEIGHT, deleteButton.dataset.id);
  });
}

function initializeWellness() {
  if (!wellnessDom.readinessForm) return;
  const today = wellnessTodayKey();
  wellnessDom.readinessForm.elements.checkinDate.max = today;
  wellnessDom.weightForm.elements.measurementDate.max = today;
  populateReadinessForm(today);
  populateWeightForm(today);
  renderRecoveryScreen({ preserveForms: true });
  renderWellnessSettingsSummary();
}
