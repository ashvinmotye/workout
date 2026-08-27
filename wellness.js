"use strict";

const RECOVERY_CHECKINS_KEY = "voiceWorkout.recoveryCheckins.v1";
const BODY_WEIGHT_ENTRIES_KEY = "voiceWorkout.bodyWeightEntries.v1";
const BODY_WAIST_ENTRIES_KEY = "voiceWorkout.bodyWaistEntries.v1";
const WELLNESS_SYNC_QUEUE_KEY = "voiceWorkout.wellnessSyncQueue.v1";
const WELLNESS_LAST_SYNC_KEY_PREFIX = "voiceWorkout.wellnessLastSync.v1";
const WELLNESS_CLOUD_IDS_KEY_PREFIX = "voiceWorkout.wellnessCloudIds.v1";
const WELLNESS_PULL_IDS_KEY_PREFIX = "voiceWorkout.wellnessPullIds.v1";
const READINESS_HISTORY_PREVIEW_LIMIT = 5;
const WEIGHT_HISTORY_RECENT_LIMIT = 7;
const WELLNESS_HISTORY_PAGE_SIZE = 50;

const WELLNESS_ENTITY = Object.freeze({
  RECOVERY: "recovery",
  WEIGHT: "weight",
  WAIST: "waist"
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
  showAllReadinessButton: document.querySelector("#showAllReadinessButton"),
  todayReadinessCard: document.querySelector("#todayReadinessCard"),
  dashboardReadinessDate: document.querySelector("#dashboardReadinessDate"),
  dashboardReadinessScore: document.querySelector("#dashboardReadinessScore"),
  dashboardReadinessLabel: document.querySelector("#dashboardReadinessLabel"),
  dashboardReadinessMeta: document.querySelector("#dashboardReadinessMeta"),
  weightForm: document.querySelector("#weightForm"),
  saveWeightButton: document.querySelector("#saveWeightButton"),
  resetWeightButton: document.querySelector("#resetWeightButton"),
  weightFormStatus: document.querySelector("#weightFormStatus"),
  latestWeight: document.querySelector("#latestWeight"),
  dashboardWeightDate: document.querySelector("#dashboardWeightDate"),
  weightLastSevenChange: document.querySelector("#weightLastSevenChange"),
  weightLastSevenLabel: document.querySelector("#weightLastSevenLabel"),
  weightSinceFirstChange: document.querySelector("#weightSinceFirstChange"),
  weightChart: document.querySelector("#weightChart"),
  weightChartSummary: document.querySelector("#weightChartSummary"),
  weightHistoryCount: document.querySelector("#weightHistoryCount"),
  weightHistory: document.querySelector("#weightHistory"),
  showAllWeightButton: document.querySelector("#showAllWeightButton"),
  waistForm: document.querySelector("#waistForm"),
  saveWaistButton: document.querySelector("#saveWaistButton"),
  resetWaistButton: document.querySelector("#resetWaistButton"),
  waistFormStatus: document.querySelector("#waistFormStatus"),
  latestWaist: document.querySelector("#latestWaist"),
  dashboardWaistDate: document.querySelector("#dashboardWaistDate"),
  waistFourWeekChange: document.querySelector("#waistFourWeekChange"),
  waistSinceFirstChange: document.querySelector("#waistSinceFirstChange"),
  waistDueBadge: document.querySelector("#waistDueBadge"),
  waistChart: document.querySelector("#waistChart"),
  waistChartSummary: document.querySelector("#waistChartSummary"),
  waistHistoryCount: document.querySelector("#waistHistoryCount"),
  waistHistory: document.querySelector("#waistHistory"),
  showAllWaistButton: document.querySelector("#showAllWaistButton"),
  readinessHistoryDialog: document.querySelector("#readinessHistoryDialog"),
  readinessHistoryDialogList: document.querySelector("#readinessHistoryDialogList"),
  readinessHistoryPagination: document.querySelector("#readinessHistoryPagination"),
  previousReadinessPage: document.querySelector("#previousReadinessPage"),
  nextReadinessPage: document.querySelector("#nextReadinessPage"),
  readinessPageStatus: document.querySelector("#readinessPageStatus"),
  weightHistoryDialog: document.querySelector("#weightHistoryDialog"),
  weightHistoryDialogList: document.querySelector("#weightHistoryDialogList"),
  weightHistoryPagination: document.querySelector("#weightHistoryPagination"),
  previousWeightPage: document.querySelector("#previousWeightPage"),
  nextWeightPage: document.querySelector("#nextWeightPage"),
  weightPageStatus: document.querySelector("#weightPageStatus"),
  waistHistoryDialog: document.querySelector("#waistHistoryDialog"),
  waistHistoryDialogList: document.querySelector("#waistHistoryDialogList"),
  waistHistoryPagination: document.querySelector("#waistHistoryPagination"),
  previousWaistPage: document.querySelector("#previousWaistPage"),
  nextWaistPage: document.querySelector("#nextWaistPage"),
  waistPageStatus: document.querySelector("#waistPageStatus"),
  wellnessSyncStatus: document.querySelector("#wellnessSyncStatus"),
  syncWellnessButton: document.querySelector("#syncWellnessButton"),
  settingsReadinessCount: document.querySelector("#settingsReadinessCount"),
  settingsWeightCount: document.querySelector("#settingsWeightCount"),
  settingsWaistCount: document.querySelector("#settingsWaistCount"),
  progressProfilePanel: document.querySelector("#progressProfilePanel"),
  progressWeightValue: document.querySelector("#progressWeightValue"),
  progressWeightChange: document.querySelector("#progressWeightChange"),
  progressWeightStatus: document.querySelector("#progressWeightStatus"),
  progressWaistValue: document.querySelector("#progressWaistValue"),
  progressWaistChange: document.querySelector("#progressWaistChange"),
  progressWaistStatus: document.querySelector("#progressWaistStatus"),
  progressZ2Value: document.querySelector("#progressZ2Value"),
  progressZ2Change: document.querySelector("#progressZ2Change"),
  progressZ2Status: document.querySelector("#progressZ2Status"),
  progressStrengthValue: document.querySelector("#progressStrengthValue"),
  progressStrengthChange: document.querySelector("#progressStrengthChange"),
  progressStrengthStatus: document.querySelector("#progressStrengthStatus"),
  progressProfileInsight: document.querySelector("#progressProfileInsight")
};

let wellnessSyncInProgress = false;
let wellnessSyncRequested = false;
let readinessHistoryPage = 0;
let weightHistoryPage = 0;
let waistHistoryPage = 0;

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

function normalizeWaistEntry(record) {
  if (!record || typeof record !== "object") return null;
  const measurementDate = normalizeWellnessDate(record.measurementDate ?? record.measurement_date);
  const waistCm = Number(record.waistCm ?? record.waist_cm);
  if (!measurementDate || !Number.isFinite(waistCm) || waistCm < 40 || waistCm > 250) return null;
  const createdAt = normalizeWellnessTimestamp(record.createdAt ?? record.client_created_at);
  const updatedAt = Math.max(createdAt, normalizeWellnessTimestamp(record.updatedAt ?? record.client_updated_at, createdAt));
  const method = record.method === "navel" ? "navel" : "midpoint";
  return {
    id: typeof record.id === "string" && record.id
      ? record.id
      : wellnessRecordId(WELLNESS_ENTITY.WAIST, measurementDate),
    measurementDate,
    waistCm: Math.round(waistCm * 100) / 100,
    method,
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

function loadWaistEntries() {
  const parsed = safeJsonParse(localStorage.getItem(BODY_WAIST_ENTRIES_KEY));
  if (!Array.isArray(parsed)) return [];
  return parsed.map(normalizeWaistEntry).filter(Boolean).sort((a, b) => b.measurementDate.localeCompare(a.measurementDate));
}

function saveWaistEntries(records) {
  const byDate = new Map();
  records.map(normalizeWaistEntry).filter(Boolean).forEach((record) => {
    const existing = byDate.get(record.measurementDate);
    if (!existing || record.updatedAt >= existing.updatedAt) byDate.set(record.measurementDate, record);
  });
  const normalized = [...byDate.values()].sort((a, b) => b.measurementDate.localeCompare(a.measurementDate));
  localStorage.setItem(BODY_WAIST_ENTRIES_KEY, JSON.stringify(normalized));
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
  const normalizer = entity === WELLNESS_ENTITY.RECOVERY
    ? normalizeRecoveryCheckin
    : entity === WELLNESS_ENTITY.WEIGHT
      ? normalizeWeightEntry
      : normalizeWaistEntry;
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

function waistToCloudRow(record) {
  const normalized = normalizeWaistEntry(record);
  return {
    id: normalized.id,
    user_id: authSession.user.id,
    measurement_date: normalized.measurementDate,
    waist_cm: normalized.waistCm,
    method: normalized.method,
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

function cloudRowToWaist(row) {
  return normalizeWaistEntry({
    id: row.id,
    measurementDate: row.measurement_date,
    waistCm: row.waist_cm,
    method: row.method,
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
    [WELLNESS_ENTITY.WEIGHT]: { upsertedIds: new Set(), deletedIds: new Set() },
    [WELLNESS_ENTITY.WAIST]: { upsertedIds: new Set(), deletedIds: new Set() }
  };
  const operations = loadWellnessSyncQueue().filter((operation) => operation.userId === userId);
  for (const operation of operations) {
    const table = operation.entity === WELLNESS_ENTITY.RECOVERY
      ? "recovery_checkins"
      : operation.entity === WELLNESS_ENTITY.WEIGHT
        ? "body_weight_entries"
        : "body_waist_entries";
    let response;
    if (operation.type === "upsert") {
      const row = operation.entity === WELLNESS_ENTITY.RECOVERY
        ? recoveryToCloudRow(operation.record)
        : operation.entity === WELLNESS_ENTITY.WEIGHT
          ? weightToCloudRow(operation.record)
          : waistToCloudRow(operation.record);
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
  const loadLocal = entity === WELLNESS_ENTITY.RECOVERY
    ? loadRecoveryCheckins
    : entity === WELLNESS_ENTITY.WEIGHT
      ? loadWeightEntries
      : loadWaistEntries;
  const saveLocal = entity === WELLNESS_ENTITY.RECOVERY
    ? saveRecoveryCheckins
    : entity === WELLNESS_ENTITY.WEIGHT
      ? saveWeightEntries
      : saveWaistEntries;
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
  const [recoveryResponse, weightResponse, waistResponse] = await Promise.all([
    authClient
      .from("recovery_checkins")
      .select("id, checkin_date, sleep_quality, energy_level, muscle_soreness, stress_level, motivation_level, readiness_score, notes, client_created_at, client_updated_at")
      .order("checkin_date", { ascending: false }),
    authClient
      .from("body_weight_entries")
      .select("id, measurement_date, weight_kg, notes, client_created_at, client_updated_at")
      .order("measurement_date", { ascending: false }),
    authClient
      .from("body_waist_entries")
      .select("id, measurement_date, waist_cm, method, notes, client_created_at, client_updated_at")
      .order("measurement_date", { ascending: false })
  ]);
  if (recoveryResponse.error) throw recoveryResponse.error;
  if (weightResponse.error) throw weightResponse.error;
  if (waistResponse.error) throw waistResponse.error;

  const recoveryDeletes = recent[WELLNESS_ENTITY.RECOVERY].deletedIds;
  const weightDeletes = recent[WELLNESS_ENTITY.WEIGHT].deletedIds;
  const waistDeletes = recent[WELLNESS_ENTITY.WAIST].deletedIds;
  const cloudRecovery = (recoveryResponse.data || [])
    .filter((row) => !recoveryDeletes.has(row.id))
    .map(cloudRowToRecovery)
    .filter(Boolean);
  const cloudWeights = (weightResponse.data || [])
    .filter((row) => !weightDeletes.has(row.id))
    .map(cloudRowToWeight)
    .filter(Boolean);
  const cloudWaists = (waistResponse.data || [])
    .filter((row) => !waistDeletes.has(row.id))
    .map(cloudRowToWaist)
    .filter(Boolean);

  mergeWellnessPull(WELLNESS_ENTITY.RECOVERY, cloudRecovery, recent[WELLNESS_ENTITY.RECOVERY]);
  mergeWellnessPull(WELLNESS_ENTITY.WEIGHT, cloudWeights, recent[WELLNESS_ENTITY.WEIGHT]);
  mergeWellnessPull(WELLNESS_ENTITY.WAIST, cloudWaists, recent[WELLNESS_ENTITY.WAIST]);
  return cloudRecovery.length + cloudWeights.length + cloudWaists.length;
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
      ? `${pending} body ${pending === 1 ? "change" : "changes"} waiting for connection`
      : "Offline — body and recovery data is available", "waiting");
    return;
  }
  if (wellnessSyncInProgress) {
    setWellnessSyncStatus("Syncing recovery and body data…", "waiting");
    return;
  }
  if (pending) {
    setWellnessSyncStatus(`${pending} body ${pending === 1 ? "change" : "changes"} waiting to sync`, "waiting");
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
  if ((normalized.includes("recovery_checkins") || normalized.includes("body_weight_entries") || normalized.includes("body_waist_entries"))
    && (normalized.includes("not find") || normalized.includes("does not exist") || normalized.includes("relation"))) {
    return "Body sync needs the included Supabase migration";
  }
  if (normalized.includes("row-level security")) return "Body sync was blocked by the database security policy";
  return message ? `Body sync failed: ${message}` : "Body data could not be synced";
}

async function syncWellnessData(options = {}) {
  if (wellnessSyncInProgress) {
    wellnessSyncRequested = true;
    return false;
  }
  if (!authClient || !authSession || !navigator.onLine) {
    updateWellnessSyncStatus();
    if (options.manual) showToast("Body data will sync when you are online and signed in.");
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
    if (options.manual) showToast("Body and recovery data synced.");
    return true;
  } catch (error) {
    setWellnessSyncStatus(friendlyWellnessSyncError(error), "error");
    if (options.manual) showToast("Body sync failed.");
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

function submitWaistForm(event) {
  event.preventDefault();
  const form = wellnessDom.waistForm;
  const measurementDate = normalizeWellnessDate(form.elements.measurementDate.value);
  const waistCm = Number(form.elements.waistCm.value);
  if (!measurementDate || measurementDate > wellnessTodayKey()) {
    wellnessDom.waistFormStatus.textContent = "Choose today or an earlier date.";
    return;
  }
  if (!Number.isFinite(waistCm) || waistCm < 40 || waistCm > 250) {
    wellnessDom.waistFormStatus.textContent = "Enter a waist measurement between 40 and 250 cm.";
    return;
  }
  const records = loadWaistEntries();
  const existing = records.find((record) => record.measurementDate === measurementDate);
  const now = Date.now();
  const record = normalizeWaistEntry({
    id: existing?.id || wellnessRecordId(WELLNESS_ENTITY.WAIST, measurementDate),
    measurementDate,
    waistCm,
    method: form.elements.method.value,
    notes: form.elements.notes.value,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  });
  saveWaistEntries([...records.filter((item) => item.measurementDate !== measurementDate), record]);
  queueWellnessOperation(WELLNESS_ENTITY.WAIST, "upsert", record);
  populateWaistForm(measurementDate);
  renderRecoveryScreen({ preserveForms: true });
  renderTrends();
  renderSettingsSummary();
  wellnessDom.waistFormStatus.textContent = navigator.onLine ? "Saved · syncing automatically" : "Saved on this device · sync pending";
  showToast("Waist measurement saved.");
  syncWellnessData().catch(() => {});
}

function populateWaistForm(date = wellnessTodayKey()) {
  const normalizedDate = normalizeWellnessDate(date) || wellnessTodayKey();
  const record = loadWaistEntries().find((item) => item.measurementDate === normalizedDate);
  const latest = loadWaistEntries()[0];
  const form = wellnessDom.waistForm;
  form.elements.measurementDate.value = normalizedDate;
  form.elements.waistCm.value = record ? String(record.waistCm) : "";
  form.elements.method.value = record?.method || latest?.method || "midpoint";
  form.elements.notes.value = record?.notes || "";
  wellnessDom.saveWaistButton.textContent = record ? "Update waist" : "Save waist";
  wellnessDom.waistFormStatus.textContent = "";
}

function formatWeight(value, signed = false) {
  if (!Number.isFinite(value)) return "—";
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)} kg`;
}

function formatWeightTrendChange(value) {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0.00 kg";
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(2)} kg`;
}

function formatWaist(value, signed = false) {
  if (!Number.isFinite(value)) return "—";
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)} cm`;
}

function formatWaistTrendChange(value) {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0.00 cm";
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(2)} cm`;
}

function findMeasurementWindowChange(records, valueKey, days) {
  if (records.length < 2) return null;
  const latest = records[0];
  const latestDate = wellnessDateToLocalDate(latest.measurementDate);
  const cutoff = new Date(latestDate);
  cutoff.setDate(cutoff.getDate() - days);
  const candidates = records.filter((record) => wellnessDateToLocalDate(record.measurementDate) >= cutoff);
  const oldest = candidates[candidates.length - 1];
  if (!oldest || oldest.id === latest.id) return null;
  return Math.round((latest[valueKey] - oldest[valueKey]) * 100) / 100;
}

function getWaistTrendSummary(records) {
  if (!records.length) return null;
  const latest = records[0];
  const first = records[records.length - 1];
  return {
    latest,
    fourWeekChange: findMeasurementWindowChange(records, "waistCm", 28),
    sinceFirstChange: latest.waistCm - first.waistCm
  };
}

function getWaistDueState(records) {
  if (!records.length) return { due: true, label: "Due now" };
  const latestDate = wellnessDateToLocalDate(records[0].measurementDate);
  const today = wellnessDateToLocalDate(wellnessTodayKey());
  const elapsedDays = Math.max(0, Math.floor((today - latestDate) / 86400000));
  if (elapsedDays >= 7) return { due: true, label: elapsedDays === 7 ? "Due today" : `${elapsedDays - 7}d overdue` };
  const daysRemaining = 7 - elapsedDays;
  return { due: false, label: daysRemaining === 1 ? "Due tomorrow" : `Due in ${daysRemaining}d` };
}

function getWeightTrendSummary(records) {
  if (!records.length) return null;
  const latest = records[0];
  const recent = records.slice(0, WEIGHT_HISTORY_RECENT_LIMIT);
  const recentOldest = recent[recent.length - 1];
  const first = records[records.length - 1];
  return {
    latest,
    recentCount: recent.length,
    recentChange: latest.weightKg - recentOldest.weightKg,
    sinceFirstChange: latest.weightKg - first.weightKg
  };
}

function weightTrendLines(records) {
  const trend = getWeightTrendSummary(records);
  if (!trend) return [];
  const measurementLabel = trend.recentCount === 1 ? "measurement" : "measurements";
  return [
    `${formatWeightTrendChange(trend.recentChange)} across last ${trend.recentCount} ${measurementLabel}`,
    `${formatWeightTrendChange(trend.sinceFirstChange)} since first measurement`
  ];
}

function renderRecoveryDashboard(checkins, weights, waists) {
  const todayCheckin = checkins.find((record) => record.checkinDate === wellnessTodayKey());
  if (todayCheckin) {
    const level = getReadinessLevel(todayCheckin.readinessScore);
    wellnessDom.todayReadinessCard.dataset.level = level.key;
    wellnessDom.dashboardReadinessDate.textContent = "Saved today";
    wellnessDom.dashboardReadinessScore.textContent = String(todayCheckin.readinessScore);
    wellnessDom.dashboardReadinessLabel.textContent = level.label;
    wellnessDom.dashboardReadinessMeta.textContent = level.guidance;
  } else {
    wellnessDom.todayReadinessCard.dataset.level = "none";
    wellnessDom.dashboardReadinessDate.textContent = "Not saved";
    wellnessDom.dashboardReadinessScore.textContent = "—";
    wellnessDom.dashboardReadinessLabel.textContent = "No check-in today";
    wellnessDom.dashboardReadinessMeta.textContent = "Complete today’s check-in below.";
  }

  const trend = getWeightTrendSummary(weights);
  wellnessDom.latestWeight.textContent = trend ? formatWeight(trend.latest.weightKg) : "—";
  wellnessDom.dashboardWeightDate.textContent = trend ? formatWellnessDate(trend.latest.measurementDate, { short: true }) : "No data";
  wellnessDom.weightLastSevenChange.textContent = trend ? formatWeightTrendChange(trend.recentChange) : "—";
  wellnessDom.weightLastSevenLabel.textContent = trend
    ? `across last ${trend.recentCount} ${trend.recentCount === 1 ? "measurement" : "measurements"}`
    : "across last 7 measurements";
  wellnessDom.weightSinceFirstChange.textContent = trend ? formatWeightTrendChange(trend.sinceFirstChange) : "—";

  const waistTrend = getWaistTrendSummary(waists);
  const dueState = getWaistDueState(waists);
  wellnessDom.latestWaist.textContent = waistTrend ? formatWaist(waistTrend.latest.waistCm) : "—";
  wellnessDom.dashboardWaistDate.textContent = dueState.label;
  wellnessDom.waistFourWeekChange.textContent = waistTrend ? formatWaistTrendChange(waistTrend.fourWeekChange) : "—";
  wellnessDom.waistSinceFirstChange.textContent = waistTrend ? formatWaistTrendChange(waistTrend.sinceFirstChange) : "—";
  wellnessDom.waistDueBadge.textContent = dueState.due ? "Due" : "Logged";
  wellnessDom.waistDueBadge.hidden = false;
}

function readinessHistoryItemMarkup(record, showActions = false) {
  const level = getReadinessLevel(record.readinessScore);
  return `
    <article class="recovery-history-item" data-level="${level.key}">
      <div class="recovery-history-score"><strong>${record.readinessScore}</strong><small>/100</small></div>
      <div class="recovery-history-main">
        <strong>${escapeHtml(level.label)}</strong>
        <span>${escapeHtml(formatWellnessDate(record.checkinDate))}</span>
        <small>Sleep ${record.sleepQuality} · Energy ${record.energyLevel} · Soreness ${record.muscleSoreness} · Stress ${record.stressLevel} · Motivation ${record.motivationLevel}</small>
        ${record.notes ? `<small>${escapeHtml(record.notes)}</small>` : ""}
      </div>
      ${showActions ? `<div class="recovery-history-actions">
        <button class="mini-icon edit-readiness-entry" type="button" data-date="${record.checkinDate}" aria-label="Edit recovery check-in">✎</button>
        <button class="mini-icon delete-readiness-entry" type="button" data-id="${escapeHtml(record.id)}" aria-label="Delete recovery check-in">×</button>
      </div>` : ""}
    </article>`;
}

function renderReadinessHistory(records) {
  const displayed = records.slice(0, READINESS_HISTORY_PREVIEW_LIMIT);
  wellnessDom.readinessHistoryCount.textContent = records.length
    ? `Showing ${displayed.length} of ${records.length}`
    : "0 entries";
  wellnessDom.showAllReadinessButton.hidden = records.length <= displayed.length;
  if (!records.length) {
    wellnessDom.readinessHistory.innerHTML = '<div class="recovery-empty-state"><strong>No check-ins yet</strong><span>Your readiness history will build here.</span></div>';
    return;
  }
  wellnessDom.readinessHistory.innerHTML = displayed.map((record) => readinessHistoryItemMarkup(record, true)).join("");
}

function renderWeightChart(records) {
  const displayed = records.slice(0, 30).reverse();
  if (!displayed.length) {
    wellnessDom.weightChart.innerHTML = '<div class="weight-chart-empty">No measurements yet</div>';
    wellnessDom.weightChartSummary.textContent = "Add your first measurement to begin the trend.";
    wellnessDom.weightChart.setAttribute("aria-label", "No body-weight measurements yet");
    return;
  }
  if (displayed.length === 1) {
    wellnessDom.weightChart.innerHTML = `<div class="weight-chart-single"><span></span><strong>${formatWeight(displayed[0].weightKg)}</strong></div>`;
  } else {
    const width = 700;
    const height = 400;
    const paddingX = 42;
    const paddingY = 42;
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
    const firstDisplayed = displayed[0];
    const latestDisplayed = displayed[displayed.length - 1];
    wellnessDom.weightChart.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false">
        <line x1="${paddingX}" y1="${paddingY}" x2="${paddingX}" y2="${height - paddingY}"></line>
        <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}"></line>
        <text x="${paddingX}" y="25">${rawMax.toFixed(1)} kg</text>
        <text x="${paddingX}" y="${height - 9}">${escapeHtml(formatWellnessDate(firstDisplayed.measurementDate, { short: true }))}</text>
        <text x="${width - paddingX}" y="${height - 9}" text-anchor="end">${escapeHtml(formatWellnessDate(latestDisplayed.measurementDate, { short: true }))}</text>
        <polyline points="${points}"></polyline>
        ${circles}
      </svg>`;
  }
  const lines = weightTrendLines(records);
  wellnessDom.weightChartSummary.innerHTML = lines.map((line) => `<span>${escapeHtml(line)}</span>`).join("");
  wellnessDom.weightChart.setAttribute("aria-label", `Body-weight trend. ${lines.join(". ")}.`);
}

function renderWaistChart(records) {
  const displayed = records.slice(0, 30).reverse();
  if (!displayed.length) {
    wellnessDom.waistChart.innerHTML = '<div class="weight-chart-empty">No measurements yet</div>';
    wellnessDom.waistChartSummary.textContent = "Add your first weekly measurement to begin the trend.";
    wellnessDom.waistChart.setAttribute("aria-label", "No waist-circumference measurements yet");
    return;
  }
  if (displayed.length === 1) {
    wellnessDom.waistChart.innerHTML = `<div class="weight-chart-single"><span></span><strong>${formatWaist(displayed[0].waistCm)}</strong></div>`;
  } else {
    const width = 700;
    const height = 400;
    const paddingX = 42;
    const paddingY = 42;
    const values = displayed.map((record) => record.waistCm);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const visualPadding = Math.max(0.4, (rawMax - rawMin) * 0.2);
    const min = rawMin - visualPadding;
    const max = rawMax + visualPadding;
    const x = (index) => paddingX + index / (displayed.length - 1) * (width - paddingX * 2);
    const y = (value) => paddingY + (max - value) / Math.max(0.1, max - min) * (height - paddingY * 2);
    const points = displayed.map((record, index) => `${x(index).toFixed(1)},${y(record.waistCm).toFixed(1)}`).join(" ");
    const circles = displayed.map((record, index) => `<circle cx="${x(index).toFixed(1)}" cy="${y(record.waistCm).toFixed(1)}" r="4"><title>${escapeHtml(formatWellnessDate(record.measurementDate))}: ${formatWaist(record.waistCm)}</title></circle>`).join("");
    const firstDisplayed = displayed[0];
    const latestDisplayed = displayed[displayed.length - 1];
    wellnessDom.waistChart.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false">
        <line x1="${paddingX}" y1="${paddingY}" x2="${paddingX}" y2="${height - paddingY}"></line>
        <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}"></line>
        <text x="${paddingX}" y="25">${rawMax.toFixed(1)} cm</text>
        <text x="${paddingX}" y="${height - 9}">${escapeHtml(formatWellnessDate(firstDisplayed.measurementDate, { short: true }))}</text>
        <text x="${width - paddingX}" y="${height - 9}" text-anchor="end">${escapeHtml(formatWellnessDate(latestDisplayed.measurementDate, { short: true }))}</text>
        <polyline points="${points}"></polyline>
        ${circles}
      </svg>`;
  }
  const trend = getWaistTrendSummary(records);
  const lines = [
    `${formatWaistTrendChange(trend.fourWeekChange)} over the latest 4-week window`,
    `${formatWaistTrendChange(trend.sinceFirstChange)} since first measurement`
  ];
  wellnessDom.waistChartSummary.innerHTML = lines.map((line) => `<span>${escapeHtml(line)}</span>`).join("");
  wellnessDom.waistChart.setAttribute("aria-label", `Waist-circumference trend. ${lines.join(". ")}.`);
}

function weightHistoryItemMarkup(record, allRecords, showActions = false) {
  const recordIndex = allRecords.findIndex((item) => item.id === record.id);
  const previous = recordIndex >= 0 ? allRecords[recordIndex + 1] : null;
  const change = previous ? record.weightKg - previous.weightKg : null;
  return `
    <article class="recovery-history-item weight-history-item">
      <div class="weight-history-value"><strong>${record.weightKg.toFixed(1)}</strong><small>kg</small></div>
      <div class="recovery-history-main">
        <strong>${escapeHtml(formatWellnessDate(record.measurementDate))}</strong>
        <span>${change === null ? "First measurement" : `${formatWeightTrendChange(change)} from previous`}</span>
        ${record.notes ? `<small>${escapeHtml(record.notes)}</small>` : ""}
      </div>
      ${showActions ? `<div class="recovery-history-actions">
        <button class="mini-icon edit-weight-entry" type="button" data-date="${record.measurementDate}" aria-label="Edit body-weight measurement">✎</button>
        <button class="mini-icon delete-weight-entry" type="button" data-id="${escapeHtml(record.id)}" aria-label="Delete body-weight measurement">×</button>
      </div>` : ""}
    </article>`;
}

function getWeightHistoryPreview(records) {
  if (!records.length) return [];
  const selected = [];
  const selectedIds = new Set();
  const add = (record) => {
    if (record && !selectedIds.has(record.id)) {
      selected.push(record);
      selectedIds.add(record.id);
    }
  };
  const todayRecord = records.find((record) => record.measurementDate === wellnessTodayKey());
  add(todayRecord);
  records.filter((record) => record.id !== todayRecord?.id).slice(0, WEIGHT_HISTORY_RECENT_LIMIT).forEach(add);
  add(records[records.length - 1]);
  return selected;
}

function renderWeightHistory(records) {
  const displayed = getWeightHistoryPreview(records);
  wellnessDom.weightHistoryCount.textContent = records.length
    ? `Showing ${displayed.length} of ${records.length}`
    : "0 entries";
  wellnessDom.showAllWeightButton.hidden = records.length <= displayed.length;
  if (!records.length) {
    wellnessDom.weightHistory.innerHTML = '<div class="recovery-empty-state"><strong>No measurements yet</strong><span>Your body-weight history will build here.</span></div>';
    return;
  }
  wellnessDom.weightHistory.innerHTML = displayed.map((record) => weightHistoryItemMarkup(record, records, true)).join("");
}

function waistMethodLabel(method) {
  return method === "navel" ? "Navel level" : "Rib–hip midpoint";
}

function waistHistoryItemMarkup(record, allRecords, showActions = false) {
  const recordIndex = allRecords.findIndex((item) => item.id === record.id);
  const previous = recordIndex >= 0 ? allRecords[recordIndex + 1] : null;
  const change = previous ? record.waistCm - previous.waistCm : null;
  return `
    <article class="recovery-history-item waist-history-item">
      <div class="waist-history-value"><strong>${record.waistCm.toFixed(1)}</strong><small>cm</small></div>
      <div class="recovery-history-main">
        <strong>${escapeHtml(formatWellnessDate(record.measurementDate))}</strong>
        <span>${change === null ? "First measurement" : `${formatWaistTrendChange(change)} from previous`} · ${escapeHtml(waistMethodLabel(record.method))}</span>
        ${record.notes ? `<small>${escapeHtml(record.notes)}</small>` : ""}
      </div>
      ${showActions ? `<div class="recovery-history-actions">
        <button class="mini-icon edit-waist-entry" type="button" data-date="${record.measurementDate}" aria-label="Edit waist measurement">✎</button>
        <button class="mini-icon delete-waist-entry" type="button" data-id="${escapeHtml(record.id)}" aria-label="Delete waist measurement">×</button>
      </div>` : ""}
    </article>`;
}

function renderWaistHistory(records) {
  const displayed = getWeightHistoryPreview(records);
  wellnessDom.waistHistoryCount.textContent = records.length
    ? `Showing ${displayed.length} of ${records.length}`
    : "0 entries";
  wellnessDom.showAllWaistButton.hidden = records.length <= displayed.length;
  if (!records.length) {
    wellnessDom.waistHistory.innerHTML = '<div class="recovery-empty-state"><strong>No measurements yet</strong><span>Your weekly waist history will build here.</span></div>';
    return;
  }
  wellnessDom.waistHistory.innerHTML = displayed.map((record) => waistHistoryItemMarkup(record, records, true)).join("");
}

function renderHistoryPagination(records, page, pagination, status, previousButton, nextButton) {
  const pageCount = Math.max(1, Math.ceil(records.length / WELLNESS_HISTORY_PAGE_SIZE));
  const safePage = Math.min(Math.max(0, page), pageCount - 1);
  const start = safePage * WELLNESS_HISTORY_PAGE_SIZE;
  const end = Math.min(start + WELLNESS_HISTORY_PAGE_SIZE, records.length);
  pagination.hidden = records.length <= WELLNESS_HISTORY_PAGE_SIZE;
  status.textContent = `${start + 1}–${end} of ${records.length}`;
  previousButton.disabled = safePage === 0;
  nextButton.disabled = safePage >= pageCount - 1;
  return { safePage, start, end };
}

function renderReadinessHistoryDialog() {
  const records = loadRecoveryCheckins();
  const range = renderHistoryPagination(
    records,
    readinessHistoryPage,
    wellnessDom.readinessHistoryPagination,
    wellnessDom.readinessPageStatus,
    wellnessDom.previousReadinessPage,
    wellnessDom.nextReadinessPage
  );
  readinessHistoryPage = range.safePage;
  wellnessDom.readinessHistoryDialogList.innerHTML = records
    .slice(range.start, range.end)
    .map((record) => readinessHistoryItemMarkup(record))
    .join("");
  wellnessDom.readinessHistoryDialogList.scrollTop = 0;
}

function renderWeightHistoryDialog() {
  const records = loadWeightEntries();
  const range = renderHistoryPagination(
    records,
    weightHistoryPage,
    wellnessDom.weightHistoryPagination,
    wellnessDom.weightPageStatus,
    wellnessDom.previousWeightPage,
    wellnessDom.nextWeightPage
  );
  weightHistoryPage = range.safePage;
  wellnessDom.weightHistoryDialogList.innerHTML = records
    .slice(range.start, range.end)
    .map((record) => weightHistoryItemMarkup(record, records))
    .join("");
  wellnessDom.weightHistoryDialogList.scrollTop = 0;
}

function renderWaistHistoryDialog() {
  const records = loadWaistEntries();
  const range = renderHistoryPagination(
    records,
    waistHistoryPage,
    wellnessDom.waistHistoryPagination,
    wellnessDom.waistPageStatus,
    wellnessDom.previousWaistPage,
    wellnessDom.nextWaistPage
  );
  waistHistoryPage = range.safePage;
  wellnessDom.waistHistoryDialogList.innerHTML = records
    .slice(range.start, range.end)
    .map((record) => waistHistoryItemMarkup(record, records))
    .join("");
  wellnessDom.waistHistoryDialogList.scrollTop = 0;
}

function showHistoryDialog(dialog) {
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeHistoryDialog(dialog) {
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

function renderRecoveryScreen(options = {}) {
  if (!wellnessDom.readinessForm) return;
  const checkins = loadRecoveryCheckins();
  const weights = loadWeightEntries();
  const waists = loadWaistEntries();
  renderRecoveryDashboard(checkins, weights, waists);
  renderReadinessHistory(checkins);
  renderWeightChart(weights);
  renderWeightHistory(weights);
  renderWaistChart(waists);
  renderWaistHistory(waists);
  if (wellnessDom.readinessHistoryDialog.open) renderReadinessHistoryDialog();
  if (wellnessDom.weightHistoryDialog.open) renderWeightHistoryDialog();
  if (wellnessDom.waistHistoryDialog.open) renderWaistHistoryDialog();
  if (!options.preserveForms) {
    const selectedReadinessDate = normalizeWellnessDate(wellnessDom.readinessForm.elements.checkinDate.value) || wellnessTodayKey();
    const selectedWeightDate = normalizeWellnessDate(wellnessDom.weightForm.elements.measurementDate.value) || wellnessTodayKey();
    const selectedWaistDate = normalizeWellnessDate(wellnessDom.waistForm.elements.measurementDate.value) || wellnessTodayKey();
    populateReadinessForm(selectedReadinessDate);
    populateWeightForm(selectedWeightDate);
    populateWaistForm(selectedWaistDate);
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

function setProgressSignal(valueNode, changeNode, statusNode, value, change, status, direction = "") {
  valueNode.textContent = value;
  changeNode.textContent = change;
  statusNode.textContent = status;
  const card = valueNode.closest(".progress-signal-card");
  if (card) card.dataset.direction = direction;
}

function workoutWindowMetrics(records, startTime, endTime) {
  const selected = records.filter((record) => record.endedAt >= startTime && record.endedAt < endTime);
  const zone2Seconds = selected.reduce((sum, record) => sum + Math.max(0, Number(record.zone2Seconds) || 0), 0);
  const weightedSets = selected.reduce((total, record) => total + record.exercises.reduce((sum, exercise) => {
    const hasWeight = typeof exercise.weight === "string" && /\d/.test(exercise.weight);
    return sum + (hasWeight ? Math.max(0, Number(exercise.completedSets) || 0) : 0);
  }, 0), 0);
  return { sessions: selected.length, zone2Seconds, weightedSets };
}

function formatProgressComparison(current, previous, unit) {
  const difference = current - previous;
  if (!previous && current) return `${current} ${unit} recorded · baseline period`;
  if (!current && !previous) return `No ${unit} recorded in either 30-day period`;
  if (difference === 0) return `No change from the previous 30 days`;
  return `${difference > 0 ? "+" : "−"}${Math.abs(difference)} ${unit} vs previous 30 days`;
}

function renderWellnessTrendSummary(workoutRecords = null) {
  if (!wellnessDom.progressProfilePanel) return;
  const records = Array.isArray(workoutRecords)
    ? workoutRecords
    : (typeof loadWorkoutHistory === "function" ? loadWorkoutHistory() : []);
  const weights = loadWeightEntries();
  const waists = loadWaistEntries();
  const latestWeight = weights[0];
  const latestWaist = waists[0];
  const weightChange = findThirtyDayWeightChange(weights);
  const waistChange = findMeasurementWindowChange(waists, "waistCm", 28);

  setProgressSignal(
    wellnessDom.progressWeightValue,
    wellnessDom.progressWeightChange,
    wellnessDom.progressWeightStatus,
    latestWeight ? formatWeight(latestWeight.weightKg) : "—",
    weightChange === null ? "Add repeated measurements for a 30-day trend" : `${formatWeight(weightChange, true)} over the latest 30-day window`,
    latestWeight ? "Tracked" : "No data"
  );

  setProgressSignal(
    wellnessDom.progressWaistValue,
    wellnessDom.progressWaistChange,
    wellnessDom.progressWaistStatus,
    latestWaist ? formatWaist(latestWaist.waistCm) : "—",
    waistChange === null ? "Measure weekly to build a 4-week trend" : `${formatWaist(waistChange, true)} over the latest 4-week window`,
    latestWaist ? (waistChange < 0 ? "Improving" : "Tracked") : "No data",
    waistChange < 0 ? "improving" : ""
  );

  const now = Date.now();
  const currentStart = now - 30 * 86400000;
  const previousStart = now - 60 * 86400000;
  const current = workoutWindowMetrics(records, currentStart, now + 1);
  const previous = workoutWindowMetrics(records, previousStart, currentStart);
  const currentZ2Minutes = Math.round(current.zone2Seconds / 60);
  const previousZ2Minutes = Math.round(previous.zone2Seconds / 60);
  setProgressSignal(
    wellnessDom.progressZ2Value,
    wellnessDom.progressZ2Change,
    wellnessDom.progressZ2Status,
    currentZ2Minutes ? `${currentZ2Minutes} min` : "—",
    formatProgressComparison(currentZ2Minutes, previousZ2Minutes, "min"),
    currentZ2Minutes ? (currentZ2Minutes > previousZ2Minutes ? "Building" : "Tracked") : "No data",
    currentZ2Minutes > previousZ2Minutes ? "improving" : ""
  );

  setProgressSignal(
    wellnessDom.progressStrengthValue,
    wellnessDom.progressStrengthChange,
    wellnessDom.progressStrengthStatus,
    current.weightedSets ? `${current.weightedSets} sets` : "—",
    formatProgressComparison(current.weightedSets, previous.weightedSets, "weighted sets"),
    current.weightedSets ? (current.weightedSets > previous.weightedSets ? "Building" : "Tracked") : "No data",
    current.weightedSets > previous.weightedSets ? "improving" : ""
  );

  const insights = [];
  if (weightChange !== null && waistChange !== null) {
    if (weightChange < 0 && waistChange < 0) insights.push("Weight and waist are moving down together.");
    else if (Math.abs(weightChange) < 0.5 && waistChange < 0) insights.push("Waist is reducing while weight is broadly steady, a pattern that can be consistent with body recomposition.");
    else insights.push("Weight and waist are giving different signals, so keep judging the repeated trend rather than one reading.");
  } else if (latestWeight || latestWaist) {
    insights.push("Add repeated weight and weekly waist measurements to reveal body-composition direction.");
  }
  if (currentZ2Minutes || current.weightedSets) {
    const z2Direction = currentZ2Minutes > previousZ2Minutes ? "higher" : currentZ2Minutes < previousZ2Minutes ? "lower" : "steady";
    const strengthDirection = current.weightedSets > previous.weightedSets ? "higher" : current.weightedSets < previous.weightedSets ? "lower" : "steady";
    insights.push(`Zone 2 exposure is ${z2Direction} and weighted work is ${strengthDirection} versus the previous 30 days.`);
  }
  if (!insights.length) insights.push("Log each signal over time to reveal progress that body weight alone can miss.");
  wellnessDom.progressProfileInsight.textContent = insights.join(" ");
}

function editWellnessRecord(entity, date) {
  if (entity === WELLNESS_ENTITY.RECOVERY) populateReadinessForm(date);
  else if (entity === WELLNESS_ENTITY.WEIGHT) populateWeightForm(date);
  else populateWaistForm(date);
  const target = entity === WELLNESS_ENTITY.RECOVERY
    ? wellnessDom.readinessForm
    : entity === WELLNESS_ENTITY.WEIGHT
      ? wellnessDom.weightForm
      : wellnessDom.waistForm;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteWellnessRecord(entity, id) {
  const isRecovery = entity === WELLNESS_ENTITY.RECOVERY;
  const isWeight = entity === WELLNESS_ENTITY.WEIGHT;
  const records = isRecovery ? loadRecoveryCheckins() : isWeight ? loadWeightEntries() : loadWaistEntries();
  const record = records.find((item) => item.id === id);
  if (!record) return;
  const label = isRecovery ? "recovery check-in" : isWeight ? "body-weight measurement" : "waist measurement";
  if (!window.confirm(`Delete this ${label}?`)) return;
  if (isRecovery) saveRecoveryCheckins(records.filter((item) => item.id !== id));
  else if (isWeight) saveWeightEntries(records.filter((item) => item.id !== id));
  else saveWaistEntries(records.filter((item) => item.id !== id));
  queueWellnessOperation(entity, "delete", id);
  renderRecoveryScreen();
  renderTrends();
  renderSettingsSummary();
  showToast(`${isRecovery ? "Recovery check-in" : isWeight ? "Body-weight measurement" : "Waist measurement"} deleted.`);
  syncWellnessData().catch(() => {});
}

function getWellnessBackupData() {
  return {
    recoveryCheckins: loadRecoveryCheckins(),
    bodyWeightEntries: loadWeightEntries(),
    bodyWaistEntries: loadWaistEntries()
  };
}

function validateWellnessBackupData(data) {
  const recoverySource = data.recoveryCheckins === undefined ? [] : data.recoveryCheckins;
  const weightSource = data.bodyWeightEntries === undefined ? [] : data.bodyWeightEntries;
  const waistSource = data.bodyWaistEntries === undefined ? [] : data.bodyWaistEntries;
  if (!Array.isArray(recoverySource)) throw new Error("The recovery check-ins in this backup are invalid.");
  if (!Array.isArray(weightSource)) throw new Error("The body-weight entries in this backup are invalid.");
  if (!Array.isArray(waistSource)) throw new Error("The waist entries in this backup are invalid.");
  const recoveryCheckins = recoverySource.map(normalizeRecoveryCheckin);
  const bodyWeightEntries = weightSource.map(normalizeWeightEntry);
  const bodyWaistEntries = waistSource.map(normalizeWaistEntry);
  if (recoveryCheckins.some((record) => !record)) throw new Error("One or more recovery check-ins in this backup are invalid.");
  if (bodyWeightEntries.some((record) => !record)) throw new Error("One or more body-weight entries in this backup are invalid.");
  if (bodyWaistEntries.some((record) => !record)) throw new Error("One or more waist entries in this backup are invalid.");
  return { recoveryCheckins, bodyWeightEntries, bodyWaistEntries };
}

function applyWellnessBackupData(data) {
  saveRecoveryCheckins(data.recoveryCheckins || []);
  saveWeightEntries(data.bodyWeightEntries || []);
  saveWaistEntries(data.bodyWaistEntries || []);
  (data.recoveryCheckins || []).forEach((record) => queueWellnessOperation(WELLNESS_ENTITY.RECOVERY, "upsert", record));
  (data.bodyWeightEntries || []).forEach((record) => queueWellnessOperation(WELLNESS_ENTITY.WEIGHT, "upsert", record));
  (data.bodyWaistEntries || []).forEach((record) => queueWellnessOperation(WELLNESS_ENTITY.WAIST, "upsert", record));
  renderRecoveryScreen();
  updateWellnessSyncStatus();
}

function getWellnessCounts() {
  return {
    readiness: loadRecoveryCheckins().length,
    weight: loadWeightEntries().length,
    waist: loadWaistEntries().length
  };
}

function renderWellnessSettingsSummary() {
  const counts = getWellnessCounts();
  if (wellnessDom.settingsReadinessCount) wellnessDom.settingsReadinessCount.textContent = String(counts.readiness);
  if (wellnessDom.settingsWeightCount) wellnessDom.settingsWeightCount.textContent = String(counts.weight);
  if (wellnessDom.settingsWaistCount) wellnessDom.settingsWaistCount.textContent = String(counts.waist);
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
  wellnessDom.waistForm.elements.measurementDate.addEventListener("change", (event) => populateWaistForm(event.target.value));
  wellnessDom.waistForm.addEventListener("submit", submitWaistForm);
  wellnessDom.resetWaistButton.addEventListener("click", () => populateWaistForm(wellnessTodayKey()));
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
  wellnessDom.waistHistory.addEventListener("click", (event) => {
    const editButton = event.target.closest(".edit-waist-entry");
    const deleteButton = event.target.closest(".delete-waist-entry");
    if (editButton) editWellnessRecord(WELLNESS_ENTITY.WAIST, editButton.dataset.date);
    if (deleteButton) deleteWellnessRecord(WELLNESS_ENTITY.WAIST, deleteButton.dataset.id);
  });
  wellnessDom.showAllReadinessButton.addEventListener("click", () => {
    readinessHistoryPage = 0;
    renderReadinessHistoryDialog();
    showHistoryDialog(wellnessDom.readinessHistoryDialog);
  });
  wellnessDom.showAllWeightButton.addEventListener("click", () => {
    weightHistoryPage = 0;
    renderWeightHistoryDialog();
    showHistoryDialog(wellnessDom.weightHistoryDialog);
  });
  wellnessDom.showAllWaistButton.addEventListener("click", () => {
    waistHistoryPage = 0;
    renderWaistHistoryDialog();
    showHistoryDialog(wellnessDom.waistHistoryDialog);
  });
  wellnessDom.previousReadinessPage.addEventListener("click", () => {
    readinessHistoryPage -= 1;
    renderReadinessHistoryDialog();
  });
  wellnessDom.nextReadinessPage.addEventListener("click", () => {
    readinessHistoryPage += 1;
    renderReadinessHistoryDialog();
  });
  wellnessDom.previousWeightPage.addEventListener("click", () => {
    weightHistoryPage -= 1;
    renderWeightHistoryDialog();
  });
  wellnessDom.nextWeightPage.addEventListener("click", () => {
    weightHistoryPage += 1;
    renderWeightHistoryDialog();
  });
  wellnessDom.previousWaistPage.addEventListener("click", () => {
    waistHistoryPage -= 1;
    renderWaistHistoryDialog();
  });
  wellnessDom.nextWaistPage.addEventListener("click", () => {
    waistHistoryPage += 1;
    renderWaistHistoryDialog();
  });
  document.querySelectorAll(".close-history-dialog").forEach((button) => {
    button.addEventListener("click", () => closeHistoryDialog(button.closest("dialog")));
  });
  [wellnessDom.readinessHistoryDialog, wellnessDom.weightHistoryDialog, wellnessDom.waistHistoryDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeHistoryDialog(dialog);
    });
  });
}

function initializeWellness() {
  if (!wellnessDom.readinessForm) return;
  const today = wellnessTodayKey();
  wellnessDom.readinessForm.elements.checkinDate.max = today;
  wellnessDom.weightForm.elements.measurementDate.max = today;
  wellnessDom.waistForm.elements.measurementDate.max = today;
  populateReadinessForm(today);
  populateWeightForm(today);
  populateWaistForm(today);
  renderRecoveryScreen({ preserveForms: true });
  renderWellnessSettingsSummary();
}
