"use strict";

const STORAGE_KEY = "voiceWorkout.settings.v1";
const SESSION_KEY = "voiceWorkout.session.v1";
const THEME_KEY = "voiceWorkout.theme.v1";
const SAVED_WORKOUTS_KEY = "voiceWorkout.savedWorkouts.v1";
const ACTIVE_SAVED_WORKOUT_KEY = "voiceWorkout.activeSavedWorkout.v1";
const HISTORY_KEY = "voiceWorkout.history.v1";
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const BACKUP_APP_ID = "voice-workout";
const BACKUP_SCHEMA_VERSION = 1;
const MAX_BACKUP_FILE_SIZE = 5 * 1024 * 1024;
const AUTH_USER_CACHE_KEY = "voiceWorkout.authUser.v1";
const HISTORY_SYNC_QUEUE_KEY = "voiceWorkout.historySyncQueue.v1";
const HISTORY_LAST_SYNC_KEY_PREFIX = "voiceWorkout.historyLastSync.v1";
const HISTORY_CLOUD_IDS_KEY_PREFIX = "voiceWorkout.historyCloudIds.v1";
const SAVED_WORKOUT_SYNC_QUEUE_KEY = "voiceWorkout.savedWorkoutSyncQueue.v1";
const SAVED_WORKOUT_LAST_SYNC_KEY_PREFIX = "voiceWorkout.savedWorkoutLastSync.v1";
const SAVED_WORKOUT_CLOUD_IDS_KEY_PREFIX = "voiceWorkout.savedWorkoutCloudIds.v1";
const SAVED_WORKOUT_PULL_IDS_KEY_PREFIX = "voiceWorkout.savedWorkoutPullIds.v1";
const SUPABASE_URL = "https://xacwgipxqujbqvhzogbd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_-_rGsscYv3ipNd7hW23-RQ_bUCB9hTf";

const PHASE = Object.freeze({
  PREP: "prep",
  ACTIVE_REPS: "active-reps",
  ACTIVE_TIME: "active-time",
  EXERCISE_REST: "exercise-rest",
  ROUND_REST: "round-rest",
  COMPLETE: "complete"
});

const dom = {
  authScreen: document.querySelector("#authScreen"),
  authLoading: document.querySelector("#authLoading"),
  authFormContent: document.querySelector("#authFormContent"),
  authForm: document.querySelector("#authForm"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  authPasswordHelp: document.querySelector("#authPasswordHelp"),
  authSubmitButton: document.querySelector("#authSubmitButton"),
  authMessage: document.querySelector("#authMessage"),
  signInModeButton: document.querySelector("#signInModeButton"),
  signUpModeButton: document.querySelector("#signUpModeButton"),
  setupScreen: document.querySelector("#setupScreen"),
  savedWorkoutsScreen: document.querySelector("#savedWorkoutsScreen"),
  trendsScreen: document.querySelector("#trendsScreen"),
  settingsScreen: document.querySelector("#settingsScreen"),
  mainNavigation: document.querySelector("#mainNavigation"),
  setupNavButton: document.querySelector("#setupNavButton"),
  savedWorkoutsNavButton: document.querySelector("#savedWorkoutsNavButton"),
  trendsNavButton: document.querySelector("#trendsNavButton"),
  settingsNavButton: document.querySelector("#settingsNavButton"),
  savedWorkoutNavCount: document.querySelector("#savedWorkoutNavCount"),
  workoutScreen: document.querySelector("#workoutScreen"),
  completeScreen: document.querySelector("#completeScreen"),
  workoutForm: document.querySelector("#workoutForm"),
  workoutName: document.querySelector("#workoutName"),
  rounds: document.querySelector("#rounds"),
  roundRest: document.querySelector("#roundRest"),
  prepTime: document.querySelector("#prepTime"),
  defaultRest: document.querySelector("#defaultRest"),
  voiceEnabled: document.querySelector("#voiceEnabled"),
  countdownVoice: document.querySelector("#countdownVoice"),
  soundEffects: document.querySelector("#soundEffects"),
  voiceSelect: document.querySelector("#voiceSelect"),
  voiceAvailability: document.querySelector("#voiceAvailability"),
  voiceDetail: document.querySelector("#voiceDetail"),
  exerciseList: document.querySelector("#exerciseList"),
  exerciseTemplate: document.querySelector("#exerciseTemplate"),
  exerciseCount: document.querySelector("#exerciseCount"),
  addExerciseButton: document.querySelector("#addExerciseButton"),
  testVoiceButton: document.querySelector("#testVoiceButton"),
  formError: document.querySelector("#formError"),
  saveWorkoutButton: document.querySelector("#saveWorkoutButton"),
  saveWorkoutAsButton: document.querySelector("#saveWorkoutAsButton"),
  savedWorkoutStatusTitle: document.querySelector("#savedWorkoutStatusTitle"),
  savedWorkoutStatusText: document.querySelector("#savedWorkoutStatusText"),
  savedWorkoutList: document.querySelector("#savedWorkoutList"),
  savedWorkoutTemplate: document.querySelector("#savedWorkoutTemplate"),
  savedWorkoutEmptyState: document.querySelector("#savedWorkoutEmptyState"),
  savedWorkoutCount: document.querySelector("#savedWorkoutCount"),
  newWorkoutButton: document.querySelector("#newWorkoutButton"),
  emptyStateSetupButton: document.querySelector("#emptyStateSetupButton"),
  toast: document.querySelector("#toast"),
  workoutNameDisplay: document.querySelector("#workoutNameDisplay"),
  progressText: document.querySelector("#progressText"),
  phaseLabel: document.querySelector("#phaseLabel"),
  timerValue: document.querySelector("#timerValue"),
  timerUnit: document.querySelector("#timerUnit"),
  timerRing: document.querySelector("#timerRing"),
  exercisePosition: document.querySelector("#exercisePosition"),
  currentExerciseName: document.querySelector("#currentExerciseName"),
  currentTarget: document.querySelector("#currentTarget"),
  currentMeta: document.querySelector("#currentMeta"),
  doneButton: document.querySelector("#doneButton"),
  nextExerciseCard: document.querySelector("#nextExerciseCard"),
  nextExerciseName: document.querySelector("#nextExerciseName"),
  nextExerciseTarget: document.querySelector("#nextExerciseTarget"),
  previousButton: document.querySelector("#previousButton"),
  pauseButton: document.querySelector("#pauseButton"),
  pauseIcon: document.querySelector("#pauseIcon"),
  pauseText: document.querySelector("#pauseText"),
  skipButton: document.querySelector("#skipButton"),
  backToSetupButton: document.querySelector("#backToSetupButton"),
  voiceToggleButton: document.querySelector("#voiceToggleButton"),
  completeWorkoutName: document.querySelector("#completeWorkoutName"),
  completeSummary: document.querySelector("#completeSummary"),
  repeatWorkoutButton: document.querySelector("#repeatWorkoutButton"),
  editWorkoutButton: document.querySelector("#editWorkoutButton"),
  confirmDialog: document.querySelector("#confirmDialog"),
  resumeBanner: document.querySelector("#resumeBanner"),
  resumeSavedSession: document.querySelector("#resumeSavedSession"),
  discardSavedSession: document.querySelector("#discardSavedSession"),
  installButton: document.querySelector("#installButton"),
  themeToggleButton: document.querySelector("#themeToggleButton"),
  themeColorMeta: document.querySelector("#themeColorMeta"),
  trendsEmptyState: document.querySelector("#trendsEmptyState"),
  trendsContent: document.querySelector("#trendsContent"),
  trendsStartWorkoutButton: document.querySelector("#trendsStartWorkoutButton"),
  weekDateRange: document.querySelector("#weekDateRange"),
  weekWorkouts: document.querySelector("#weekWorkouts"),
  weekMinutes: document.querySelector("#weekMinutes"),
  weekRounds: document.querySelector("#weekRounds"),
  weekExercises: document.querySelector("#weekExercises"),
  monthDateRange: document.querySelector("#monthDateRange"),
  monthWorkouts: document.querySelector("#monthWorkouts"),
  monthMinutes: document.querySelector("#monthMinutes"),
  monthRounds: document.querySelector("#monthRounds"),
  monthExercises: document.querySelector("#monthExercises"),
  trendRangeButtons: document.querySelector("#trendRangeButtons"),
  activityChartSummary: document.querySelector("#activityChartSummary"),
  activityChart: document.querySelector("#activityChart"),
  currentStreak: document.querySelector("#currentStreak"),
  longestStreak: document.querySelector("#longestStreak"),
  mostActiveDay: document.querySelector("#mostActiveDay"),
  exerciseTrendSelect: document.querySelector("#exerciseTrendSelect"),
  exerciseTrendStats: document.querySelector("#exerciseTrendStats"),
  exerciseTrendHistory: document.querySelector("#exerciseTrendHistory"),
  historyCount: document.querySelector("#historyCount"),
  historyList: document.querySelector("#historyList"),
  clearHistoryButton: document.querySelector("#clearHistoryButton"),
  settingsSavedWorkoutCount: document.querySelector("#settingsSavedWorkoutCount"),
  settingsHistoryCount: document.querySelector("#settingsHistoryCount"),
  settingsActiveSession: document.querySelector("#settingsActiveSession"),
  exportBackupButton: document.querySelector("#exportBackupButton"),
  importBackupButton: document.querySelector("#importBackupButton"),
  importBackupInput: document.querySelector("#importBackupInput"),
  backupStatus: document.querySelector("#backupStatus"),
  accountEmail: document.querySelector("#accountEmail"),
  accountConnectionStatus: document.querySelector("#accountConnectionStatus"),
  signOutButton: document.querySelector("#signOutButton"),
  historySyncStatus: document.querySelector("#historySyncStatus"),
  syncHistoryButton: document.querySelector("#syncHistoryButton"),
  historyMigrationRow: document.querySelector("#historyMigrationRow"),
  historyMigrationStatus: document.querySelector("#historyMigrationStatus"),
  uploadExistingHistoryButton: document.querySelector("#uploadExistingHistoryButton"),
  savedWorkoutSyncStatus: document.querySelector("#savedWorkoutSyncStatus"),
  syncSavedWorkoutsButton: document.querySelector("#syncSavedWorkoutsButton"),
  savedWorkoutMigrationRow: document.querySelector("#savedWorkoutMigrationRow"),
  savedWorkoutMigrationStatus: document.querySelector("#savedWorkoutMigrationStatus"),
  uploadExistingSavedWorkoutsButton: document.querySelector("#uploadExistingSavedWorkoutsButton"),
  accountMessage: document.querySelector("#accountMessage"),
  confirmDialogTitle: document.querySelector("#confirmDialogTitle"),
  confirmDialogMessage: document.querySelector("#confirmDialogMessage")
};

let workout = null;
let runtime = createEmptyRuntime();
let deferredInstallPrompt = null;
let wakeLock = null;
let audioContext = null;
let availableVoices = [];
let activeSavedWorkoutId = null;
let toastTimer = null;
let activeTrendRange = "7";
let authMode = "signin";
let authClient = null;
let authSession = null;
let authSubscription = null;
let authBusy = false;
let historySyncInProgress = false;
let historySyncRequested = false;
let historyMigrationInProgress = false;
let savedWorkoutSyncInProgress = false;
let savedWorkoutSyncRequested = false;
let savedWorkoutMigrationInProgress = false;

function createEmptyRuntime() {
  return {
    phase: null,
    roundIndex: 0,
    exerciseIndex: 0,
    remainingSeconds: 0,
    totalSeconds: 0,
    timerId: null,
    paused: false,
    voiceEnabled: true,
    completedRounds: 0,
    announcedCountdown: new Set(),
    startedAt: null,
    pausedDurationMs: 0,
    pauseStartedAt: null,
    exerciseCompletionCounts: [],
    historyRecorded: false
  };
}

function uid() {
  return `ex-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function workoutUid() {
  return `workout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sessionUid() {
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultWorkout() {
  return {
    name: "Full-body circuit",
    rounds: 3,
    roundRest: 60,
    prepTime: 5,
    defaultRest: 20,
    voiceEnabled: true,
    countdownVoice: true,
    soundEffects: true,
    voiceURI: "",
    voiceName: "",
    voiceDetail: "full",
    exercises: [
      {
        id: uid(),
        name: "Squats",
        mode: "reps",
        value: 10,
        rest: 20,
        weight: "",
        perSide: false,
        note: ""
      },
      {
        id: uid(),
        name: "Push-ups",
        mode: "reps",
        value: 10,
        rest: 20,
        weight: "",
        perSide: false,
        note: ""
      }
    ]
  };
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getAuthRedirectUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  return url.toString();
}

function loadCachedAuthUser() {
  try {
    const cached = safeJsonParse(localStorage.getItem(AUTH_USER_CACHE_KEY));
    if (!cached || typeof cached.id !== "string" || typeof cached.email !== "string") return null;
    return cached;
  } catch {
    return null;
  }
}

function cacheAuthUser(user) {
  if (!user?.id || !user?.email) return;
  try {
    localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify({
      id: user.id,
      email: user.email,
      confirmedAt: user.email_confirmed_at || null,
      cachedAt: Date.now()
    }));
  } catch {
    // Authentication continues for the current page even if this fallback cannot be stored.
  }
}

function clearCachedAuthUser() {
  try {
    localStorage.removeItem(AUTH_USER_CACHE_KEY);
  } catch {
    // The current page can still be signed out even if storage is unavailable.
  }
}

function setAuthMessage(message = "", type = "") {
  dom.authMessage.textContent = message;
  dom.authMessage.classList.toggle("is-error", type === "error");
  dom.authMessage.classList.toggle("is-success", type === "success");
}

function setAccountMessage(message = "", isError = false) {
  dom.accountMessage.textContent = message;
  dom.accountMessage.classList.toggle("is-error", isError);
}

function setAuthMode(mode, clearMessage = true) {
  authMode = mode === "signup" ? "signup" : "signin";
  const isSignUp = authMode === "signup";
  dom.signInModeButton.classList.toggle("is-active", !isSignUp);
  dom.signUpModeButton.classList.toggle("is-active", isSignUp);
  dom.signInModeButton.setAttribute("aria-pressed", String(!isSignUp));
  dom.signUpModeButton.setAttribute("aria-pressed", String(isSignUp));
  dom.authSubmitButton.textContent = isSignUp ? "Create account" : "Sign in";
  dom.authPassword.autocomplete = isSignUp ? "new-password" : "current-password";
  dom.authPasswordHelp.textContent = isSignUp
    ? "Use at least 6 characters. You may need to confirm your email."
    : "Enter the password for your Workout account.";
  if (clearMessage) setAuthMessage();
}

function setAuthBusy(isBusy) {
  authBusy = isBusy;
  dom.authEmail.disabled = isBusy;
  dom.authPassword.disabled = isBusy;
  dom.signInModeButton.disabled = isBusy;
  dom.signUpModeButton.disabled = isBusy;
  dom.authSubmitButton.disabled = isBusy;
  dom.authSubmitButton.textContent = isBusy
    ? (authMode === "signup" ? "Creating account…" : "Signing in…")
    : (authMode === "signup" ? "Create account" : "Sign in");
}

function friendlyAuthError(error) {
  const message = String(error?.message || "").trim();
  const normalized = message.toLocaleLowerCase();
  if (!navigator.onLine || normalized.includes("failed to fetch") || normalized.includes("network")) {
    return "You appear to be offline. Connect to the internet and try again.";
  }
  if (normalized.includes("invalid login credentials")) return "The email or password is incorrect.";
  if (normalized.includes("email not confirmed")) return "Confirm your email using the message from Supabase, then sign in.";
  if (normalized.includes("not authorized") || normalized.includes("email_address_not_authorized")) {
    return "Supabase’s test email service can only send to members of this project. Use your Supabase account email for this first test.";
  }
  if (normalized.includes("user already registered")) return "An account already exists for this email. Try signing in instead.";
  if (normalized.includes("password")) return message || "The password does not meet the account requirements.";
  if (normalized.includes("rate limit") || normalized.includes("too many")) return "Too many attempts. Wait a little, then try again.";
  return message || "Authentication could not be completed. Please try again.";
}

function updateAccountPanel(user, offline = false) {
  dom.accountEmail.textContent = user?.email || "—";
  const isOffline = offline || !navigator.onLine;
  dom.accountConnectionStatus.textContent = isOffline ? "Offline access" : "Connected";
  dom.accountConnectionStatus.classList.toggle("is-offline", isOffline);
}

function showAuthenticatedApp(session, options = {}) {
  const user = session?.user || options.user;
  if (!user) return;
  authSession = session?.user ? session : null;
  cacheAuthUser(user);
  updateAccountPanel(user, Boolean(options.offline));
  setAccountMessage(options.offline ? "Using the last account saved on this device. Cloud access will resume when you reconnect." : "");
  dom.authPassword.value = "";
  if (!dom.authScreen.hidden) showScreen("setup");
  updateHistorySyncStatus();
  updateSavedWorkoutSyncStatus();
  if (authSession && navigator.onLine) {
    window.setTimeout(() => {
      syncWorkoutHistory();
      syncSavedWorkouts();
    }, 0);
  }
}

function showAuthForm(message = "", type = "") {
  dom.authLoading.hidden = true;
  dom.authFormContent.hidden = false;
  showScreen("auth");
  setAuthMessage(message, type);
}

function showAuthLoading() {
  showScreen("auth");
  dom.authLoading.hidden = false;
  dom.authFormContent.hidden = true;
}

function handleAuthStateChange(event, session) {
  if (session?.user) {
    showAuthenticatedApp(session);
    return;
  }
  if (event === "SIGNED_OUT" || event === "USER_DELETED") {
    authSession = null;
    clearCachedAuthUser();
    updateHistorySyncStatus();
    updateSavedWorkoutSyncStatus();
    setAuthMode("signin", false);
    showAuthForm("You have been signed out.", "success");
  }
}

async function initializeAuthentication() {
  showAuthLoading();

  if (!window.supabase?.createClient) {
    const cachedUser = loadCachedAuthUser();
    if (!navigator.onLine && cachedUser) {
      showAuthenticatedApp(null, { user: cachedUser, offline: true });
      return;
    }
    showAuthForm("The account service could not be loaded. Check your connection and reload the app.", "error");
    return;
  }

  authClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });

  const listener = authClient.auth.onAuthStateChange((event, session) => {
    window.setTimeout(() => handleAuthStateChange(event, session), 0);
  });
  authSubscription = listener.data.subscription;

  try {
    const { data, error } = await authClient.auth.getSession();
    if (error) throw error;
    if (data.session?.user) {
      showAuthenticatedApp(data.session);
      return;
    }

    const cachedUser = loadCachedAuthUser();
    if (!navigator.onLine && cachedUser) {
      showAuthenticatedApp(null, { user: cachedUser, offline: true });
      return;
    }
    showAuthForm();
  } catch (error) {
    const cachedUser = loadCachedAuthUser();
    if (!navigator.onLine && cachedUser) {
      showAuthenticatedApp(null, { user: cachedUser, offline: true });
      return;
    }
    showAuthForm(friendlyAuthError(error), "error");
  }
}

async function submitAuthForm(event) {
  event.preventDefault();
  if (authBusy || !authClient) return;

  const email = dom.authEmail.value.trim().toLocaleLowerCase();
  const password = dom.authPassword.value;
  if (!email || !dom.authEmail.validity.valid) {
    setAuthMessage("Enter a valid email address.", "error");
    dom.authEmail.focus();
    return;
  }
  if (password.length < 6) {
    setAuthMessage("Your password must contain at least 6 characters.", "error");
    dom.authPassword.focus();
    return;
  }
  if (!navigator.onLine) {
    setAuthMessage("Connect to the internet to sign in or create an account.", "error");
    return;
  }

  setAuthBusy(true);
  setAuthMessage();
  try {
    if (authMode === "signup") {
      const { data, error } = await authClient.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: getAuthRedirectUrl() }
      });
      if (error) throw error;
      if (data.session?.user) {
        showAuthenticatedApp(data.session);
      } else {
        dom.authPassword.value = "";
        setAuthMessage("Account created. Check your email, confirm the account, then return here to sign in.", "success");
      }
    } else {
      const { data, error } = await authClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session?.user) throw new Error("The account session could not be started.");
      showAuthenticatedApp(data.session);
    }
  } catch (error) {
    setAuthMessage(friendlyAuthError(error), "error");
  } finally {
    setAuthBusy(false);
  }
}

async function signOutCurrentDevice() {
  if (authBusy) return;
  dom.signOutButton.disabled = true;
  setAccountMessage("Signing out…");
  try {
    if (authClient && authSession) {
      const { error } = await authClient.auth.signOut({ scope: "local" });
      if (error) throw error;
    }
    authSession = null;
    clearCachedAuthUser();
    updateHistorySyncStatus();
    updateSavedWorkoutSyncStatus();
    setAuthMode("signin", false);
    showAuthForm("You have been signed out. Your workout data remains on this device.", "success");
  } catch (error) {
    setAccountMessage(friendlyAuthError(error), true);
  } finally {
    dom.signOutButton.disabled = false;
  }
}

async function refreshAuthenticationAfterReconnect() {
  if (!authClient) return;
  if (authSession) {
    updateAccountPanel(authSession.user);
    updateHistorySyncStatus();
    updateSavedWorkoutSyncStatus();
    syncWorkoutHistory().catch(() => {});
    syncSavedWorkouts().catch(() => {});
    return;
  }
  try {
    const { data, error } = await authClient.auth.getSession();
    if (error) throw error;
    if (data.session?.user) showAuthenticatedApp(data.session);
  } catch {
    // The app remains usable with local data and will retry on a future reconnect.
  }
}

function normalizeWorkout(candidate) {
  const fallback = defaultWorkout();
  if (!candidate || typeof candidate !== "object") return fallback;

  const exercises = Array.isArray(candidate.exercises)
    ? candidate.exercises.map((exercise) => ({
        id: typeof exercise.id === "string" ? exercise.id : uid(),
        name: typeof exercise.name === "string" ? exercise.name : "",
        mode: exercise.mode === "time" ? "time" : "reps",
        value: clampInteger(exercise.value, 1, 9999, 10),
        rest: clampInteger(exercise.rest, 0, 600, 20),
        weight: typeof exercise.weight === "string" ? exercise.weight : "",
        perSide: Boolean(exercise.perSide),
        note: typeof exercise.note === "string" ? exercise.note : ""
      }))
    : fallback.exercises;

  return {
    name: typeof candidate.name === "string" && candidate.name.trim() ? candidate.name.trim() : fallback.name,
    rounds: clampInteger(candidate.rounds, 1, 99, fallback.rounds),
    roundRest: clampInteger(candidate.roundRest, 0, 3600, fallback.roundRest),
    prepTime: clampInteger(candidate.prepTime, 0, 60, fallback.prepTime),
    defaultRest: clampInteger(candidate.defaultRest, 0, 600, fallback.defaultRest),
    voiceEnabled: candidate.voiceEnabled !== false,
    countdownVoice: candidate.countdownVoice !== false,
    soundEffects: candidate.soundEffects !== false,
    voiceURI: typeof candidate.voiceURI === "string" ? candidate.voiceURI : "",
    voiceName: typeof candidate.voiceName === "string" ? candidate.voiceName : "",
    voiceDetail: candidate.voiceDetail === "minimal" ? "minimal" : "full",
    exercises: exercises.length ? exercises : fallback.exercises
  };
}

function clampInteger(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function loadSettings() {
  const saved = safeJsonParse(localStorage.getItem(STORAGE_KEY));
  return normalizeWorkout(saved);
}

function saveSettings(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}


function normalizeHistoryExercise(exercise) {
  if (!exercise || typeof exercise !== "object") return null;
  const mode = exercise.mode === "time" ? "time" : "reps";
  return {
    name: typeof exercise.name === "string" && exercise.name.trim() ? exercise.name.trim() : "Exercise",
    mode,
    value: clampInteger(exercise.value, 1, mode === "time" ? 3600 : 9999, 1),
    weight: typeof exercise.weight === "string" ? exercise.weight : "",
    perSide: Boolean(exercise.perSide),
    note: typeof exercise.note === "string" ? exercise.note : "",
    completedSets: clampInteger(exercise.completedSets, 0, 9999, 0)
  };
}

function normalizeHistoryRecord(record) {
  if (!record || typeof record !== "object") return null;
  const endedAt = Number.isFinite(Number(record.endedAt ?? record.completedAt))
    ? Number(record.endedAt ?? record.completedAt)
    : Date.now();
  const durationSeconds = clampInteger(record.durationSeconds, 0, 60 * 60 * 48, 0);
  const exercises = Array.isArray(record.exercises)
    ? record.exercises.map(normalizeHistoryExercise).filter(Boolean)
    : [];
  const rpe = Number.parseInt(record.rpe, 10);
  const normalizeOptionalSeconds = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
  };

  return {
    id: typeof record.id === "string" && record.id ? record.id : sessionUid(),
    startedAt: Number.isFinite(Number(record.startedAt)) ? Number(record.startedAt) : endedAt - durationSeconds * 1000,
    endedAt,
    status: record.status === "partial" ? "partial" : "completed",
    workoutName: typeof record.workoutName === "string" && record.workoutName.trim() ? record.workoutName.trim() : "Workout",
    durationSeconds,
    plannedRounds: clampInteger(record.plannedRounds, 1, 99, 1),
    completedRounds: clampInteger(record.completedRounds, 0, 99, 0),
    exercises,
    rpe: Number.isFinite(rpe) && rpe >= 1 && rpe <= 10 ? rpe : null,
    zone1Seconds: normalizeOptionalSeconds(record.zone1Seconds),
    zone2Seconds: normalizeOptionalSeconds(record.zone2Seconds),
    zone3Seconds: normalizeOptionalSeconds(record.zone3Seconds),
    zone4Seconds: normalizeOptionalSeconds(record.zone4Seconds),
    zone5Seconds: normalizeOptionalSeconds(record.zone5Seconds),
    notes: typeof record.notes === "string" ? record.notes : ""
  };
}

function loadWorkoutHistory() {
  const parsed = safeJsonParse(localStorage.getItem(HISTORY_KEY));
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map(normalizeHistoryRecord)
    .filter(Boolean)
    .sort((a, b) => b.endedAt - a.endedAt);
}

function saveWorkoutHistory(records) {
  const normalized = records
    .map(normalizeHistoryRecord)
    .filter(Boolean)
    .sort((a, b) => b.endedAt - a.endedAt);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(normalized));
}

function syncOperationUid() {
  return `sync-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getHistorySyncUserId() {
  return authSession?.user?.id || loadCachedAuthUser()?.id || null;
}

function historyCloudIdsKey(userId = getHistorySyncUserId()) {
  return userId ? `${HISTORY_CLOUD_IDS_KEY_PREFIX}.${userId}` : null;
}

function historyLastSyncKey(userId = getHistorySyncUserId()) {
  return userId ? `${HISTORY_LAST_SYNC_KEY_PREFIX}.${userId}` : null;
}

function loadHistoryCloudIds(userId = getHistorySyncUserId()) {
  const key = historyCloudIdsKey(userId);
  if (!key) return new Set();
  const parsed = safeJsonParse(localStorage.getItem(key));
  return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string" && id) : []);
}

function saveHistoryCloudIds(ids, userId = getHistorySyncUserId()) {
  const key = historyCloudIdsKey(userId);
  if (!key) return;
  localStorage.setItem(key, JSON.stringify([...new Set(ids)].sort()));
}

function normalizeHistorySyncOperation(operation) {
  if (!operation || typeof operation !== "object") return null;
  const type = operation.type;
  const userId = typeof operation.userId === "string" && operation.userId
    ? operation.userId
    : getHistorySyncUserId();
  if (!userId) return null;
  if (type === "delete-all") {
    return {
      queueId: typeof operation.queueId === "string" ? operation.queueId : syncOperationUid(),
      type,
      id: "*",
      userId,
      queuedAt: Number.isFinite(Number(operation.queuedAt)) ? Number(operation.queuedAt) : Date.now()
    };
  }
  if ((type !== "upsert" && type !== "delete") || typeof operation.id !== "string" || !operation.id) return null;
  if (type === "upsert" && (!operation.record || typeof operation.record !== "object")) return null;
  return {
    queueId: typeof operation.queueId === "string" ? operation.queueId : syncOperationUid(),
    type,
    id: operation.id,
    userId,
    record: type === "upsert" ? normalizeHistoryRecord(operation.record) : null,
    queuedAt: Number.isFinite(Number(operation.queuedAt)) ? Number(operation.queuedAt) : Date.now()
  };
}

function loadHistorySyncQueue() {
  const parsed = safeJsonParse(localStorage.getItem(HISTORY_SYNC_QUEUE_KEY));
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map(normalizeHistorySyncOperation)
    .filter(Boolean)
    .sort((a, b) => a.queuedAt - b.queuedAt);
}

function saveHistorySyncQueue(operations) {
  const normalized = operations
    .map(normalizeHistorySyncOperation)
    .filter(Boolean)
    .sort((a, b) => a.queuedAt - b.queuedAt);
  if (normalized.length) localStorage.setItem(HISTORY_SYNC_QUEUE_KEY, JSON.stringify(normalized));
  else localStorage.removeItem(HISTORY_SYNC_QUEUE_KEY);
  updateHistorySyncStatus();
}

function queueHistoryUpsert(record) {
  queueHistoryUpserts([record]);
}

function queueHistoryUpserts(records) {
  const userId = getHistorySyncUserId();
  if (!userId) return;
  const normalizedRecords = records.map(normalizeHistoryRecord).filter(Boolean);
  const recordIds = new Set(normalizedRecords.map((record) => record.id));
  const operations = loadHistorySyncQueue().filter((operation) => operation.userId !== userId || !recordIds.has(operation.id));
  normalizedRecords.forEach((record, index) => {
    operations.push({
      queueId: syncOperationUid(),
      type: "upsert",
      id: record.id,
      userId,
      record,
      queuedAt: Date.now() + index
    });
  });
  saveHistorySyncQueue(operations);
}

function queueHistoryDelete(id) {
  const userId = getHistorySyncUserId();
  if (!userId) return;
  const operations = loadHistorySyncQueue().filter((operation) => operation.userId !== userId || operation.id !== id);
  operations.push({
    queueId: syncOperationUid(),
    type: "delete",
    id,
    userId,
    queuedAt: Date.now()
  });
  saveHistorySyncQueue(operations);
}

function queueHistoryDeleteAll() {
  const userId = getHistorySyncUserId();
  if (!userId) return;
  const otherUsersOperations = loadHistorySyncQueue().filter((operation) => operation.userId !== userId);
  otherUsersOperations.push({
    queueId: syncOperationUid(),
    type: "delete-all",
    id: "*",
    userId,
    queuedAt: Date.now()
  });
  saveHistorySyncQueue(otherUsersOperations);
}

function recordSuccessfulHistorySyncOperation(operation, userId) {
  const cloudIds = loadHistoryCloudIds(userId);
  if (operation.type === "upsert") cloudIds.add(operation.id);
  else if (operation.type === "delete") cloudIds.delete(operation.id);
  else cloudIds.clear();
  saveHistoryCloudIds(cloudIds, userId);
}

function sessionToCloudRow(record) {
  const normalized = normalizeHistoryRecord(record);
  return {
    id: normalized.id,
    user_id: authSession.user.id,
    workout_name: normalized.workoutName,
    started_at: new Date(normalized.startedAt).toISOString(),
    ended_at: new Date(normalized.endedAt).toISOString(),
    status: normalized.status,
    duration_seconds: normalized.durationSeconds,
    planned_rounds: normalized.plannedRounds,
    completed_rounds: normalized.completedRounds,
    exercises: normalized.exercises,
    rpe: normalized.rpe,
    zone_1_seconds: normalized.zone1Seconds,
    zone_2_seconds: normalized.zone2Seconds,
    zone_3_seconds: normalized.zone3Seconds,
    zone_4_seconds: normalized.zone4Seconds,
    zone_5_seconds: normalized.zone5Seconds,
    notes: normalized.notes
  };
}

function cloudRowToSession(row) {
  return normalizeHistoryRecord({
    id: row.id,
    startedAt: Date.parse(row.started_at),
    endedAt: Date.parse(row.ended_at),
    status: row.status,
    workoutName: row.workout_name,
    durationSeconds: row.duration_seconds,
    plannedRounds: row.planned_rounds,
    completedRounds: row.completed_rounds,
    exercises: row.exercises,
    rpe: row.rpe,
    zone1Seconds: row.zone_1_seconds,
    zone2Seconds: row.zone_2_seconds,
    zone3Seconds: row.zone_3_seconds,
    zone4Seconds: row.zone_4_seconds,
    zone5Seconds: row.zone_5_seconds,
    notes: row.notes
  });
}

function formatLastHistorySync(timestamp) {
  if (!timestamp) return "";
  const elapsedSeconds = Math.max(0, Math.round((Date.now() - Number(timestamp)) / 1000));
  if (elapsedSeconds < 60) return "Synced just now";
  const elapsedMinutes = Math.round(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `Synced ${elapsedMinutes}m ago`;
  return `Last synced ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(Number(timestamp)))}`;
}

function setHistorySyncStatus(message, state = "") {
  if (!dom.historySyncStatus) return;
  dom.historySyncStatus.textContent = message;
  dom.historySyncStatus.classList.toggle("is-error", state === "error");
  dom.historySyncStatus.classList.toggle("is-waiting", state === "waiting");
  dom.historySyncStatus.classList.toggle("is-success", state === "success");
  dom.syncHistoryButton.disabled = historySyncInProgress || !authSession || !navigator.onLine;
}

function getExistingHistoryMigrationRecords(userId = getHistorySyncUserId()) {
  if (!userId) return [];
  const cloudIds = loadHistoryCloudIds(userId);
  const queuedUpsertIds = new Set(loadHistorySyncQueue()
    .filter((operation) => operation.userId === userId && operation.type === "upsert")
    .map((operation) => operation.id));
  const seen = new Set();
  return loadWorkoutHistory().filter((record) => {
    if (seen.has(record.id) || cloudIds.has(record.id) || queuedUpsertIds.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
}

function updateHistoryMigrationUI() {
  if (!dom.historyMigrationRow) return;
  const records = getExistingHistoryMigrationRecords();
  const count = records.length;
  dom.historyMigrationRow.hidden = count === 0;
  if (!count) return;
  dom.historyMigrationStatus.textContent = `${count} existing ${count === 1 ? "session" : "sessions"} ready to upload`;
  dom.uploadExistingHistoryButton.textContent = historyMigrationInProgress
    ? "Preparing upload…"
    : `Upload ${count} ${count === 1 ? "session" : "sessions"}`;
  dom.uploadExistingHistoryButton.disabled = historyMigrationInProgress || historySyncInProgress || !authSession || !navigator.onLine;
}

function updateHistorySyncStatus() {
  if (!dom.historySyncStatus) return;
  updateHistoryMigrationUI();
  const userId = getHistorySyncUserId();
  const pending = loadHistorySyncQueue().filter((operation) => operation.userId === userId).length;
  if (!navigator.onLine || !authSession) {
    setHistorySyncStatus(pending ? `${pending} ${pending === 1 ? "change" : "changes"} waiting for connection` : "Offline — local history is available", "waiting");
    return;
  }
  if (historySyncInProgress) {
    setHistorySyncStatus("Syncing workout history…", "waiting");
    return;
  }
  if (pending) {
    setHistorySyncStatus(`${pending} ${pending === 1 ? "change" : "changes"} waiting to sync`, "waiting");
    return;
  }
  const lastSyncKey = historyLastSyncKey(userId);
  const lastSync = lastSyncKey ? Number(localStorage.getItem(lastSyncKey)) : 0;
  setHistorySyncStatus(lastSync ? formatLastHistorySync(lastSync) : "Ready to sync", lastSync ? "success" : "");
}

async function processHistorySyncQueue() {
  const userId = authSession.user.id;
  const operations = loadHistorySyncQueue().filter((operation) => operation.userId === userId);
  for (const operation of operations) {
    let response;
    if (operation.type === "upsert") {
      response = await authClient
        .from("workout_sessions")
        .upsert(sessionToCloudRow(operation.record), { onConflict: "id" });
    } else if (operation.type === "delete") {
      response = await authClient
        .from("workout_sessions")
        .delete()
        .eq("id", operation.id);
    } else {
      response = await authClient
        .from("workout_sessions")
        .delete()
        .eq("user_id", authSession.user.id);
    }
    if (response.error) throw response.error;
    recordSuccessfulHistorySyncOperation(operation, userId);
    const latest = loadHistorySyncQueue();
    saveHistorySyncQueue(latest.filter((item) => item.queueId !== operation.queueId));
  }
}

async function pullWorkoutHistoryFromCloud() {
  const { data, error } = await authClient
    .from("workout_sessions")
    .select("id, workout_name, started_at, ended_at, status, duration_seconds, planned_rounds, completed_rounds, exercises, rpe, zone_1_seconds, zone_2_seconds, zone_3_seconds, zone_4_seconds, zone_5_seconds, notes, updated_at")
    .order("ended_at", { ascending: false });
  if (error) throw error;

  const previousCloudIds = loadHistoryCloudIds(authSession.user.id);
  const cloudRecords = (data || []).map(cloudRowToSession);
  const currentCloudIds = new Set(cloudRecords.map((record) => record.id));
  const preservedLocalRecords = loadWorkoutHistory().filter((record) => !previousCloudIds.has(record.id) || currentCloudIds.has(record.id));
  const merged = new Map(preservedLocalRecords.map((record) => [record.id, record]));
  cloudRecords.forEach((record) => merged.set(record.id, record));
  saveWorkoutHistory([...merged.values()]);
  saveHistoryCloudIds(currentCloudIds, authSession.user.id);
  return data?.length || 0;
}

function friendlyHistorySyncError(error) {
  const message = String(error?.message || "").trim();
  if (!navigator.onLine || message.toLocaleLowerCase().includes("failed to fetch")) {
    return "Waiting for an internet connection";
  }
  if (message.toLocaleLowerCase().includes("row-level security")) {
    return "Sync was blocked by the database security policy";
  }
  return message ? `Sync failed: ${message}` : "Workout history could not be synced";
}

async function syncWorkoutHistory(options = {}) {
  if (historySyncInProgress) {
    historySyncRequested = true;
    return false;
  }
  if (!authClient || !authSession || !navigator.onLine) {
    updateHistorySyncStatus();
    if (options.manual) showToast("History will sync when you are online and signed in.");
    return false;
  }

  historySyncInProgress = true;
  historySyncRequested = false;
  updateHistorySyncStatus();
  try {
    await processHistorySyncQueue();
    const cloudCount = await pullWorkoutHistoryFromCloud();
    const syncedAt = Date.now();
    localStorage.setItem(historyLastSyncKey(authSession.user.id), String(syncedAt));
    renderTrends();
    renderSettingsSummary();
    setHistorySyncStatus(cloudCount
      ? `${formatLastHistorySync(syncedAt)} • ${cloudCount} cloud ${cloudCount === 1 ? "session" : "sessions"}`
      : formatLastHistorySync(syncedAt), "success");
    if (options.manual) showToast("Workout history synced.");
    return true;
  } catch (error) {
    setHistorySyncStatus(friendlyHistorySyncError(error), "error");
    if (options.manual) showToast("Workout history sync failed.");
    return false;
  } finally {
    historySyncInProgress = false;
    dom.syncHistoryButton.disabled = !authSession || !navigator.onLine;
    updateHistoryMigrationUI();
    if (historySyncRequested && authSession && navigator.onLine) {
      window.setTimeout(() => syncWorkoutHistory(), 0);
    }
  }
}

async function uploadExistingWorkoutHistory() {
  if (historyMigrationInProgress || historySyncInProgress || !authSession || !navigator.onLine) {
    updateHistoryMigrationUI();
    return;
  }
  const records = getExistingHistoryMigrationRecords(authSession.user.id);
  const count = records.length;
  if (!count) {
    updateHistoryMigrationUI();
    showToast("All local workout history is already synced.");
    return;
  }
  const confirmed = window.confirm(
    `Upload ${count} existing workout ${count === 1 ? "session" : "sessions"} to your account?\n\n` +
    "They will become available on your other signed-in devices. Existing cloud sessions will not be duplicated."
  );
  if (!confirmed) return;

  historyMigrationInProgress = true;
  updateHistoryMigrationUI();
  let queued = false;
  let succeeded = false;
  try {
    queueHistoryUpserts(records);
    queued = true;
    succeeded = await syncWorkoutHistory();
  } catch (error) {
    setHistorySyncStatus(friendlyHistorySyncError(error), "error");
  } finally {
    historyMigrationInProgress = false;
    updateHistoryMigrationUI();
  }
  const cloudIds = loadHistoryCloudIds(authSession?.user?.id);
  const allUploaded = records.every((record) => cloudIds.has(record.id));
  if (succeeded) {
    showToast(`${count} existing ${count === 1 ? "session" : "sessions"} uploaded.`);
  } else if (allUploaded) {
    showToast(`${count} existing ${count === 1 ? "session" : "sessions"} uploaded. Tap Sync now to refresh.`);
  } else if (queued) {
    showToast(`${count} existing ${count === 1 ? "session" : "sessions"} queued. Sync will retry automatically.`);
  } else {
    showToast("Existing history could not be prepared for upload.");
  }
}

function getElapsedDurationMs(now = Date.now()) {
  if (!runtime.startedAt) return 0;
  const currentPause = runtime.pauseStartedAt ? Math.max(0, now - runtime.pauseStartedAt) : 0;
  return Math.max(0, now - runtime.startedAt - runtime.pausedDurationMs - currentPause);
}

function pauseSessionClock() {
  if (runtime.startedAt && !runtime.pauseStartedAt) runtime.pauseStartedAt = Date.now();
}

function resumeSessionClock() {
  if (!runtime.pauseStartedAt) return;
  runtime.pausedDurationMs += Math.max(0, Date.now() - runtime.pauseStartedAt);
  runtime.pauseStartedAt = null;
}

function recordWorkoutSession(status) {
  if (!workout || runtime.historyRecorded) return null;
  const endedAt = Date.now();
  const counts = workout.exercises.map((_, index) => clampInteger(runtime.exerciseCompletionCounts[index], 0, 9999, 0));
  const record = {
    id: sessionUid(),
    startedAt: runtime.startedAt || endedAt,
    endedAt,
    status: status === "partial" ? "partial" : "completed",
    workoutName: workout.name,
    durationSeconds: Math.max(0, Math.round(getElapsedDurationMs(endedAt) / 1000)),
    plannedRounds: workout.rounds,
    completedRounds: status === "completed" ? workout.rounds : runtime.completedRounds,
    exercises: workout.exercises.map((exercise, index) => ({
      name: exercise.name,
      mode: exercise.mode,
      value: exercise.value,
      weight: exercise.weight,
      perSide: exercise.perSide,
      note: exercise.note,
      completedSets: counts[index]
    }))
  };

  const history = loadWorkoutHistory();
  history.unshift(record);
  saveWorkoutHistory(history);
  queueHistoryUpsert(record);
  runtime.historyRecorded = true;
  renderTrends();
  syncWorkoutHistory().catch(() => {});
  return record;
}


function normalizeSavedWorkoutRecord(record) {
  if (!record || typeof record !== "object") return null;

  const createdAt = Number.isFinite(Number(record.createdAt)) ? Number(record.createdAt) : Date.now();
  const candidateUpdatedAt = Number.isFinite(Number(record.updatedAt)) ? Number(record.updatedAt) : createdAt;
  const updatedAt = Math.max(createdAt, candidateUpdatedAt);
  const sourceWorkout = record.workout && typeof record.workout === "object" ? record.workout : record;

  return {
    id: typeof record.id === "string" && record.id ? record.id : workoutUid(),
    createdAt,
    updatedAt,
    sortOrder: clampInteger(record.sortOrder, 0, 999999, 0),
    workout: cloneWorkout(sourceWorkout, false)
  };
}

function loadSavedWorkouts() {
  const parsed = safeJsonParse(localStorage.getItem(SAVED_WORKOUTS_KEY));
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map(normalizeSavedWorkoutRecord)
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function saveSavedWorkouts(records) {
  // Preserve the array order because it is also the user's custom routine order.
  const normalized = records
    .map((record, index) => {
      const normalizedRecord = normalizeSavedWorkoutRecord(record);
      return normalizedRecord ? { ...normalizedRecord, sortOrder: index } : null;
    })
    .filter(Boolean);
  localStorage.setItem(SAVED_WORKOUTS_KEY, JSON.stringify(normalized));
}

function getAccountSyncUserId() {
  return authSession?.user?.id || loadCachedAuthUser()?.id || null;
}

function savedWorkoutCloudIdsKey(userId = getAccountSyncUserId()) {
  return userId ? `${SAVED_WORKOUT_CLOUD_IDS_KEY_PREFIX}.${userId}` : null;
}

function savedWorkoutLastSyncKey(userId = getAccountSyncUserId()) {
  return userId ? `${SAVED_WORKOUT_LAST_SYNC_KEY_PREFIX}.${userId}` : null;
}

function savedWorkoutPullIdsKey(userId = getAccountSyncUserId()) {
  return userId ? `${SAVED_WORKOUT_PULL_IDS_KEY_PREFIX}.${userId}` : null;
}

function loadSavedWorkoutCloudIds(userId = getAccountSyncUserId()) {
  const key = savedWorkoutCloudIdsKey(userId);
  if (!key) return new Set();
  const parsed = safeJsonParse(localStorage.getItem(key));
  return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string" && id) : []);
}

function saveSavedWorkoutCloudIds(ids, userId = getAccountSyncUserId()) {
  const key = savedWorkoutCloudIdsKey(userId);
  if (!key) return;
  localStorage.setItem(key, JSON.stringify([...new Set(ids)].sort()));
}

function loadSavedWorkoutPullIds(userId = getAccountSyncUserId()) {
  const key = savedWorkoutPullIdsKey(userId);
  if (!key) return new Set();
  const parsed = safeJsonParse(localStorage.getItem(key));
  return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string" && id) : []);
}

function saveSavedWorkoutPullIds(ids, userId = getAccountSyncUserId()) {
  const key = savedWorkoutPullIdsKey(userId);
  if (!key) return;
  localStorage.setItem(key, JSON.stringify([...new Set(ids)].sort()));
}

function savedWorkoutSyncOperationUid() {
  return `routine-sync-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeSavedWorkoutSyncOperation(operation) {
  if (!operation || typeof operation !== "object") return null;
  const type = operation.type;
  const userId = typeof operation.userId === "string" && operation.userId
    ? operation.userId
    : getAccountSyncUserId();
  if (!userId || (type !== "upsert" && type !== "delete")) return null;
  if (typeof operation.id !== "string" || !operation.id) return null;
  if (type === "upsert" && (!operation.record || typeof operation.record !== "object")) return null;
  const record = type === "upsert" ? normalizeSavedWorkoutRecord(operation.record) : null;
  return {
    queueId: typeof operation.queueId === "string" ? operation.queueId : savedWorkoutSyncOperationUid(),
    type,
    id: operation.id,
    userId,
    record,
    sortOrder: type === "upsert" ? clampInteger(operation.sortOrder ?? record?.sortOrder, 0, 999999, 0) : null,
    queuedAt: Number.isFinite(Number(operation.queuedAt)) ? Number(operation.queuedAt) : Date.now()
  };
}

function loadSavedWorkoutSyncQueue() {
  const parsed = safeJsonParse(localStorage.getItem(SAVED_WORKOUT_SYNC_QUEUE_KEY));
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map(normalizeSavedWorkoutSyncOperation)
    .filter(Boolean)
    .sort((a, b) => a.queuedAt - b.queuedAt);
}

function saveSavedWorkoutSyncQueue(operations) {
  const normalized = operations
    .map(normalizeSavedWorkoutSyncOperation)
    .filter(Boolean)
    .sort((a, b) => a.queuedAt - b.queuedAt);
  if (normalized.length) localStorage.setItem(SAVED_WORKOUT_SYNC_QUEUE_KEY, JSON.stringify(normalized));
  else localStorage.removeItem(SAVED_WORKOUT_SYNC_QUEUE_KEY);
  updateSavedWorkoutSyncStatus();
}

function queueSavedWorkoutUpserts(records) {
  const userId = getAccountSyncUserId();
  if (!userId) return;
  const normalizedRecords = records.map(normalizeSavedWorkoutRecord).filter(Boolean);
  const recordIds = new Set(normalizedRecords.map((record) => record.id));
  const operations = loadSavedWorkoutSyncQueue()
    .filter((operation) => operation.userId !== userId || !recordIds.has(operation.id));
  normalizedRecords.forEach((record, index) => {
    operations.push({
      queueId: savedWorkoutSyncOperationUid(),
      type: "upsert",
      id: record.id,
      userId,
      record,
      sortOrder: record.sortOrder,
      queuedAt: Date.now() + index
    });
  });
  saveSavedWorkoutSyncQueue(operations);
}

function queueSavedWorkoutDelete(id) {
  const userId = getAccountSyncUserId();
  if (!userId) return;
  const operations = loadSavedWorkoutSyncQueue()
    .filter((operation) => operation.userId !== userId || operation.id !== id);
  operations.push({
    queueId: savedWorkoutSyncOperationUid(),
    type: "delete",
    id,
    userId,
    queuedAt: Date.now()
  });
  saveSavedWorkoutSyncQueue(operations);
}

function savedWorkoutToCloudRow(record, sortOrder = record.sortOrder) {
  const normalized = normalizeSavedWorkoutRecord(record);
  return {
    id: normalized.id,
    user_id: authSession.user.id,
    name: normalized.workout.name,
    workout: normalized.workout,
    sort_order: clampInteger(sortOrder, 0, 999999, 0),
    client_created_at: new Date(normalized.createdAt).toISOString(),
    client_updated_at: new Date(normalized.updatedAt).toISOString()
  };
}

function cloudRowToSavedWorkout(row) {
  return normalizeSavedWorkoutRecord({
    id: row.id,
    createdAt: Date.parse(row.client_created_at),
    updatedAt: Date.parse(row.client_updated_at),
    sortOrder: row.sort_order,
    workout: row.workout
  });
}

function recordSuccessfulSavedWorkoutSyncOperation(operation, userId) {
  const cloudIds = loadSavedWorkoutCloudIds(userId);
  if (operation.type === "upsert") cloudIds.add(operation.id);
  else cloudIds.delete(operation.id);
  saveSavedWorkoutCloudIds(cloudIds, userId);
}

function getExistingSavedWorkoutMigrationRecords(userId = getAccountSyncUserId()) {
  if (!userId) return [];
  const cloudIds = loadSavedWorkoutCloudIds(userId);
  const queuedUpsertIds = new Set(loadSavedWorkoutSyncQueue()
    .filter((operation) => operation.userId === userId && operation.type === "upsert")
    .map((operation) => operation.id));
  return loadSavedWorkouts().filter((record) => !cloudIds.has(record.id) && !queuedUpsertIds.has(record.id));
}

function updateSavedWorkoutMigrationUI() {
  if (!dom.savedWorkoutMigrationRow) return;
  const records = getExistingSavedWorkoutMigrationRecords();
  const count = records.length;
  dom.savedWorkoutMigrationRow.hidden = count === 0;
  if (!count) return;
  dom.savedWorkoutMigrationStatus.textContent = `${count} existing ${count === 1 ? "routine" : "routines"} ready to upload`;
  dom.uploadExistingSavedWorkoutsButton.textContent = savedWorkoutMigrationInProgress
    ? "Preparing upload…"
    : `Upload ${count} ${count === 1 ? "routine" : "routines"}`;
  dom.uploadExistingSavedWorkoutsButton.disabled = savedWorkoutMigrationInProgress
    || savedWorkoutSyncInProgress
    || !authSession
    || !navigator.onLine;
}

function setSavedWorkoutSyncStatus(message, state = "") {
  if (!dom.savedWorkoutSyncStatus) return;
  dom.savedWorkoutSyncStatus.textContent = message;
  dom.savedWorkoutSyncStatus.classList.toggle("is-error", state === "error");
  dom.savedWorkoutSyncStatus.classList.toggle("is-waiting", state === "waiting");
  dom.savedWorkoutSyncStatus.classList.toggle("is-success", state === "success");
  dom.syncSavedWorkoutsButton.disabled = savedWorkoutSyncInProgress || !authSession || !navigator.onLine;
}

function updateSavedWorkoutSyncStatus() {
  if (!dom.savedWorkoutSyncStatus) return;
  updateSavedWorkoutMigrationUI();
  const userId = getAccountSyncUserId();
  const pending = loadSavedWorkoutSyncQueue().filter((operation) => operation.userId === userId).length;
  if (!navigator.onLine || !authSession) {
    setSavedWorkoutSyncStatus(pending
      ? `${pending} routine ${pending === 1 ? "change" : "changes"} waiting for connection`
      : "Offline — local routines are available", "waiting");
    return;
  }
  if (savedWorkoutSyncInProgress) {
    setSavedWorkoutSyncStatus("Syncing saved routines…", "waiting");
    return;
  }
  if (pending) {
    setSavedWorkoutSyncStatus(`${pending} routine ${pending === 1 ? "change" : "changes"} waiting to sync`, "waiting");
    return;
  }
  const lastSyncKey = savedWorkoutLastSyncKey(userId);
  const lastSync = lastSyncKey ? Number(localStorage.getItem(lastSyncKey)) : 0;
  setSavedWorkoutSyncStatus(lastSync ? formatLastHistorySync(lastSync) : "Ready to sync", lastSync ? "success" : "");
}

async function processSavedWorkoutSyncQueue() {
  const userId = authSession.user.id;
  const operations = loadSavedWorkoutSyncQueue().filter((operation) => operation.userId === userId);
  const completed = {
    upsertedIds: new Set(),
    deletedIds: new Set()
  };
  for (const operation of operations) {
    const response = operation.type === "upsert"
      ? await authClient
        .from("saved_workouts")
        .upsert(savedWorkoutToCloudRow(operation.record, operation.sortOrder), { onConflict: "id" })
      : await authClient
        .from("saved_workouts")
        .delete()
        .eq("id", operation.id);
    if (response.error) throw response.error;
    recordSuccessfulSavedWorkoutSyncOperation(operation, userId);
    if (operation.type === "upsert") completed.upsertedIds.add(operation.id);
    else completed.deletedIds.add(operation.id);
    const latest = loadSavedWorkoutSyncQueue();
    saveSavedWorkoutSyncQueue(latest.filter((item) => item.queueId !== operation.queueId));
  }
  return completed;
}

async function pullSavedWorkoutsFromCloud(recentChanges = {}) {
  const { data, error } = await authClient
    .from("saved_workouts")
    .select("id, name, workout, sort_order, client_created_at, client_updated_at, updated_at")
    .order("sort_order", { ascending: true })
    .order("client_updated_at", { ascending: true });
  if (error) throw error;

  const userId = authSession.user.id;
  const recentUpsertIds = recentChanges.upsertedIds instanceof Set ? recentChanges.upsertedIds : new Set();
  const recentDeleteIds = recentChanges.deletedIds instanceof Set ? recentChanges.deletedIds : new Set();
  const previousCloudIds = loadSavedWorkoutCloudIds(userId);
  const previousPullIds = loadSavedWorkoutPullIds(userId);
  const cloudRecords = (data || [])
    .filter((row) => !recentDeleteIds.has(row.id))
    .map(cloudRowToSavedWorkout);
  const currentCloudIds = new Set(cloudRecords.map((record) => record.id));
  const merged = new Map();

  loadSavedWorkouts().forEach((record, index) => {
    // Only infer a remote deletion for a routine that this device previously
    // observed in a completed cloud pull. A successful upload marker alone is
    // not enough because a stale or delayed read must never erase local data.
    if (previousPullIds.has(record.id)
      && !currentCloudIds.has(record.id)
      && !recentUpsertIds.has(record.id)) return;
    merged.set(record.id, { record, sortOrder: record.sortOrder ?? index, source: 1, index });
  });
  cloudRecords.forEach((record, index) => {
    merged.set(record.id, { record, sortOrder: record.sortOrder, source: 0, index });
  });

  const nextRecords = [...merged.values()]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.source - b.source || a.index - b.index)
    .map((entry) => entry.record);
  saveSavedWorkouts(nextRecords);

  // Keep successful uploads marked as migrated until they have appeared in a
  // pull at least once. Once observed, the live cloud snapshot becomes the
  // authority and can also confirm genuine deletions from another device.
  const knownCloudIds = new Set(currentCloudIds);
  previousCloudIds.forEach((id) => {
    if (!previousPullIds.has(id) || recentUpsertIds.has(id)) knownCloudIds.add(id);
  });
  saveSavedWorkoutCloudIds(knownCloudIds, userId);
  saveSavedWorkoutPullIds(currentCloudIds, userId);

  if (activeSavedWorkoutId && !nextRecords.some((record) => record.id === activeSavedWorkoutId)) {
    activeSavedWorkoutId = null;
    localStorage.removeItem(ACTIVE_SAVED_WORKOUT_KEY);
    updateSavedWorkoutStatus();
  }
  return data?.length || 0;
}

function friendlySavedWorkoutSyncError(error) {
  const message = String(error?.message || "").trim();
  const normalized = message.toLocaleLowerCase();
  if (!navigator.onLine || normalized.includes("failed to fetch") || normalized.includes("network")) {
    return "Waiting for an internet connection";
  }
  if (normalized.includes("saved_workouts") && (normalized.includes("not find") || normalized.includes("does not exist") || normalized.includes("relation"))) {
    return "Saved-routine sync needs its Supabase table";
  }
  if (normalized.includes("row-level security")) return "Routine sync was blocked by the database security policy";
  return message ? `Routine sync failed: ${message}` : "Saved routines could not be synced";
}

async function syncSavedWorkouts(options = {}) {
  if (savedWorkoutSyncInProgress) {
    savedWorkoutSyncRequested = true;
    return false;
  }
  if (!authClient || !authSession || !navigator.onLine) {
    updateSavedWorkoutSyncStatus();
    if (options.manual) showToast("Routines will sync when you are online and signed in.");
    return false;
  }

  savedWorkoutSyncInProgress = true;
  savedWorkoutSyncRequested = false;
  updateSavedWorkoutSyncStatus();
  try {
    const recentChanges = await processSavedWorkoutSyncQueue();
    const cloudCount = await pullSavedWorkoutsFromCloud(recentChanges);
    const syncedAt = Date.now();
    localStorage.setItem(savedWorkoutLastSyncKey(authSession.user.id), String(syncedAt));
    renderSavedWorkouts();
    renderSettingsSummary();
    setSavedWorkoutSyncStatus(cloudCount
      ? `${formatLastHistorySync(syncedAt)} • ${cloudCount} cloud ${cloudCount === 1 ? "routine" : "routines"}`
      : formatLastHistorySync(syncedAt), "success");
    if (options.manual) showToast("Saved routines synced.");
    return true;
  } catch (error) {
    setSavedWorkoutSyncStatus(friendlySavedWorkoutSyncError(error), "error");
    if (options.manual) showToast("Saved-routine sync failed.");
    return false;
  } finally {
    savedWorkoutSyncInProgress = false;
    dom.syncSavedWorkoutsButton.disabled = !authSession || !navigator.onLine;
    updateSavedWorkoutMigrationUI();
    if (savedWorkoutSyncRequested && authSession && navigator.onLine) {
      window.setTimeout(() => syncSavedWorkouts(), 0);
    }
  }
}

async function uploadExistingSavedWorkouts() {
  if (savedWorkoutMigrationInProgress || savedWorkoutSyncInProgress || !authSession || !navigator.onLine) {
    updateSavedWorkoutMigrationUI();
    return;
  }
  const records = getExistingSavedWorkoutMigrationRecords(authSession.user.id);
  const count = records.length;
  if (!count) {
    updateSavedWorkoutMigrationUI();
    showToast("All local saved routines are already synced.");
    return;
  }
  const confirmed = window.confirm(
    `Upload ${count} existing saved ${count === 1 ? "routine" : "routines"} to your account?\n\n` +
    "They will become available on your other signed-in devices. Existing cloud routines will not be duplicated."
  );
  if (!confirmed) return;

  savedWorkoutMigrationInProgress = true;
  updateSavedWorkoutMigrationUI();
  let queued = false;
  let succeeded = false;
  try {
    queueSavedWorkoutUpserts(records);
    queued = true;
    succeeded = await syncSavedWorkouts();
  } catch (error) {
    setSavedWorkoutSyncStatus(friendlySavedWorkoutSyncError(error), "error");
  } finally {
    savedWorkoutMigrationInProgress = false;
    updateSavedWorkoutMigrationUI();
  }
  const cloudIds = loadSavedWorkoutCloudIds(authSession?.user?.id);
  const allUploaded = records.every((record) => cloudIds.has(record.id));
  if (succeeded) {
    showToast(`${count} existing ${count === 1 ? "routine" : "routines"} uploaded.`);
  } else if (allUploaded) {
    showToast(`${count} existing ${count === 1 ? "routine" : "routines"} uploaded. Tap Sync routines to refresh.`);
  } else if (queued) {
    showToast(`${count} existing ${count === 1 ? "routine" : "routines"} queued. Sync will retry automatically.`);
  } else {
    showToast("Existing routines could not be prepared for upload.");
  }
}

function getStoredJson(key) {
  return safeJsonParse(localStorage.getItem(key));
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createBackupPayload() {
  saveFormDraft();
  return {
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      settings: loadSettings(),
      savedWorkouts: loadSavedWorkouts(),
      activeSavedWorkoutId: loadActiveSavedWorkoutId(),
      workoutHistory: loadWorkoutHistory(),
      activeSession: getStoredJson(SESSION_KEY),
      theme: loadTheme()
    }
  };
}

function backupFilename(date = new Date()) {
  const datePart = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  return `voice-workout-backup-${datePart}.json`;
}

function updateBackupStatus(message, isError = false) {
  dom.backupStatus.textContent = message;
  dom.backupStatus.classList.toggle("is-error", isError);
}

function exportBackup() {
  try {
    const payload = createBackupPayload();
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = backupFilename();
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    updateBackupStatus(`Backup created with ${payload.data.savedWorkouts.length} saved ${payload.data.savedWorkouts.length === 1 ? "workout" : "workouts"} and ${payload.data.workoutHistory.length} ${payload.data.workoutHistory.length === 1 ? "session" : "sessions"}.`);
    showToast("Workout backup exported.");
  } catch {
    updateBackupStatus("The backup could not be created. Please try again.", true);
    showToast("Backup export failed.");
  }
}

function validateBackupPayload(candidate) {
  if (!isObject(candidate) || candidate.app !== BACKUP_APP_ID) {
    throw new Error("This is not a Voice Workout backup file.");
  }
  if (candidate.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error("This backup version is not supported by this version of the app.");
  }
  if (!isObject(candidate.data)) {
    throw new Error("The backup does not contain app data.");
  }

  const data = candidate.data;
  if (!isObject(data.settings) || !Array.isArray(data.settings.exercises)) {
    throw new Error("The workout settings in this backup are invalid.");
  }
  if (!Array.isArray(data.savedWorkouts)) {
    throw new Error("The saved workouts in this backup are invalid.");
  }
  if (!Array.isArray(data.workoutHistory)) {
    throw new Error("The workout history in this backup is invalid.");
  }
  if (data.theme !== "light" && data.theme !== "dark") {
    throw new Error("The theme setting in this backup is invalid.");
  }
  if (data.activeSavedWorkoutId !== null && typeof data.activeSavedWorkoutId !== "string") {
    throw new Error("The loaded workout reference in this backup is invalid.");
  }
  if (data.activeSession !== null && (!isObject(data.activeSession) || !isObject(data.activeSession.workout) || !isObject(data.activeSession.runtime))) {
    throw new Error("The resumable workout session in this backup is invalid.");
  }

  const savedWorkouts = data.savedWorkouts.map((record) => {
    const sourceWorkout = isObject(record) && isObject(record.workout) ? record.workout : record;
    if (!isObject(record) || !isObject(sourceWorkout) || !Array.isArray(sourceWorkout.exercises)) {
      throw new Error("One or more saved workouts in this backup are invalid.");
    }
    return normalizeSavedWorkoutRecord(record);
  });

  const workoutHistory = data.workoutHistory.map((record) => {
    if (!isObject(record) || !Array.isArray(record.exercises)) {
      throw new Error("One or more workout sessions in this backup are invalid.");
    }
    return normalizeHistoryRecord(record);
  });

  const activeSavedWorkoutId = savedWorkouts.some((record) => record.id === data.activeSavedWorkoutId)
    ? data.activeSavedWorkoutId
    : null;

  return {
    settings: normalizeWorkout(data.settings),
    savedWorkouts,
    activeSavedWorkoutId,
    workoutHistory,
    activeSession: data.activeSession,
    theme: data.theme,
    exportedAt: typeof candidate.exportedAt === "string" ? candidate.exportedAt : ""
  };
}

function restoreStorageSnapshot(snapshot) {
  snapshot.forEach((value, key) => {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  });
}

function applyImportedBackup(data) {
  const keys = [STORAGE_KEY, SAVED_WORKOUTS_KEY, ACTIVE_SAVED_WORKOUT_KEY, HISTORY_KEY, SESSION_KEY, THEME_KEY];
  const snapshot = new Map(keys.map((key) => [key, localStorage.getItem(key)]));

  try {
    saveSettings(data.settings);
    saveSavedWorkouts(data.savedWorkouts);
    saveWorkoutHistory(data.workoutHistory);
    if (data.activeSavedWorkoutId) localStorage.setItem(ACTIVE_SAVED_WORKOUT_KEY, data.activeSavedWorkoutId);
    else localStorage.removeItem(ACTIVE_SAVED_WORKOUT_KEY);
    if (data.activeSession) localStorage.setItem(SESSION_KEY, JSON.stringify(data.activeSession));
    else localStorage.removeItem(SESSION_KEY);
    localStorage.setItem(THEME_KEY, data.theme);
  } catch (error) {
    restoreStorageSnapshot(snapshot);
    throw error;
  }

  workout = null;
  runtime = createEmptyRuntime();
  activeSavedWorkoutId = data.activeSavedWorkoutId;
  applyTheme(data.theme, false);
  populateForm(data.settings);
  renderSavedWorkouts();
  renderTrends();
  showSavedSessionBanner();
  renderSettingsSummary();
}

function formatBackupTimestamp(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "an unknown date";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

async function importBackupFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    if (file.size > MAX_BACKUP_FILE_SIZE) {
      throw new Error("This backup file is too large to import.");
    }
    const candidate = JSON.parse(await file.text());
    const imported = validateBackupPayload(candidate);
    const confirmed = window.confirm(
      `Import the backup from ${formatBackupTimestamp(imported.exportedAt)}?\n\n` +
      `It contains ${imported.savedWorkouts.length} saved ${imported.savedWorkouts.length === 1 ? "workout" : "workouts"} and ` +
      `${imported.workoutHistory.length} workout ${imported.workoutHistory.length === 1 ? "session" : "sessions"}.\n\n` +
      "This will replace the Workout data currently stored on this device."
    );
    if (!confirmed) {
      updateBackupStatus("Import cancelled. Your current data was not changed.");
      return;
    }

    applyImportedBackup(imported);
    updateBackupStatus(`Backup restored: ${imported.savedWorkouts.length} saved ${imported.savedWorkouts.length === 1 ? "workout" : "workouts"} and ${imported.workoutHistory.length} ${imported.workoutHistory.length === 1 ? "session" : "sessions"}.`);
    showToast("Workout backup imported.");
  } catch (error) {
    const message = error instanceof SyntaxError
      ? "The selected file is not valid JSON."
      : (error?.message || "The backup could not be imported.");
    updateBackupStatus(message, true);
    showToast("Backup import failed.");
  } finally {
    event.target.value = "";
  }
}

function renderSettingsSummary() {
  const savedWorkouts = loadSavedWorkouts();
  const history = loadWorkoutHistory();
  const activeSession = getSavedSession();
  dom.settingsSavedWorkoutCount.textContent = String(savedWorkouts.length);
  dom.settingsHistoryCount.textContent = String(history.length);
  dom.settingsActiveSession.textContent = activeSession ? "Available" : "None";
  updateHistoryMigrationUI();
  updateSavedWorkoutMigrationUI();
}

function cloneWorkout(candidate, regenerateExerciseIds = false) {
  const normalized = normalizeWorkout(candidate);
  return {
    ...normalized,
    exercises: normalized.exercises.map((exercise) => ({
      ...exercise,
      id: regenerateExerciseIds ? uid() : (exercise.id || uid())
    }))
  };
}

function loadActiveSavedWorkoutId() {
  try {
    return localStorage.getItem(ACTIVE_SAVED_WORKOUT_KEY) || null;
  } catch {
    return null;
  }
}

function setActiveSavedWorkoutId(id) {
  activeSavedWorkoutId = id || null;
  try {
    if (activeSavedWorkoutId) {
      localStorage.setItem(ACTIVE_SAVED_WORKOUT_KEY, activeSavedWorkoutId);
    } else {
      localStorage.removeItem(ACTIVE_SAVED_WORKOUT_KEY);
    }
  } catch {
    // The current page still tracks the loaded routine when storage is unavailable.
  }
  updateSavedWorkoutStatus();
  renderSavedWorkouts();
}

function findSavedWorkout(id, records = loadSavedWorkouts()) {
  return records.find((record) => record.id === id) || null;
}

function makeUniqueWorkoutName(baseName, records, excludedId = null) {
  const trimmed = String(baseName || "Workout").trim() || "Workout";
  const names = new Set(
    records
      .filter((record) => record.id !== excludedId)
      .map((record) => record.workout.name.toLocaleLowerCase())
  );

  if (!names.has(trimmed.toLocaleLowerCase())) return trimmed;

  let index = 2;
  while (names.has(`${trimmed} ${index}`.toLocaleLowerCase())) index += 1;
  return `${trimmed} ${index}`;
}

function formatSavedDate(timestamp) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(new Date(timestamp));
  } catch {
    return "Recently updated";
  }
}

function showToast(message) {
  if (!message) return;
  window.clearTimeout(toastTimer);
  dom.toast.textContent = message;
  dom.toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    dom.toast.hidden = true;
  }, 2600);
}

function updateSavedWorkoutStatus() {
  const record = activeSavedWorkoutId ? findSavedWorkout(activeSavedWorkoutId) : null;

  if (record) {
    dom.savedWorkoutStatusTitle.textContent = `Editing “${record.workout.name}”`;
    dom.savedWorkoutStatusText.textContent = "Save changes to update this routine, or save a separate copy.";
    dom.saveWorkoutButton.textContent = "Save changes";
    dom.saveWorkoutAsButton.hidden = false;
  } else {
    dom.savedWorkoutStatusTitle.textContent = "Save this routine";
    dom.savedWorkoutStatusText.textContent = "Keep this workout ready for another day.";
    dom.saveWorkoutButton.textContent = "Save workout";
    dom.saveWorkoutAsButton.hidden = true;
  }
}

function renderSavedWorkouts() {
  const records = loadSavedWorkouts();
  dom.savedWorkoutList.replaceChildren();
  dom.savedWorkoutEmptyState.hidden = records.length > 0;
  dom.savedWorkoutCount.textContent = `${records.length} ${records.length === 1 ? "workout" : "workouts"}`;
  dom.savedWorkoutNavCount.textContent = String(records.length);

  const fragment = document.createDocumentFragment();
  records.forEach((record, index) => {
    const cardFragment = dom.savedWorkoutTemplate.content.cloneNode(true);
    const card = cardFragment.querySelector(".saved-workout-card");
    const exerciseNames = record.workout.exercises.map((exercise) => exercise.name).filter(Boolean);
    const preview = exerciseNames.slice(0, 3).join(" • ");
    const remaining = Math.max(0, exerciseNames.length - 3);

    card.dataset.id = record.id;
    card.classList.toggle("is-active", record.id === activeSavedWorkoutId);
    card.querySelector(".saved-workout-name").textContent = record.workout.name;
    card.querySelector(".saved-workout-summary").textContent = `${record.workout.exercises.length} ${record.workout.exercises.length === 1 ? "exercise" : "exercises"} • ${record.workout.rounds} ${record.workout.rounds === 1 ? "round" : "rounds"}`;
    card.querySelector(".saved-workout-preview").textContent = preview
      ? `${preview}${remaining ? ` • +${remaining} more` : ""}`
      : "No named exercises";
    card.querySelector(".saved-workout-date").textContent = `Updated ${formatSavedDate(record.updatedAt)}`;
    card.querySelector(".saved-workout-active-badge").hidden = record.id !== activeSavedWorkoutId;

    const moveUpButton = card.querySelector(".move-saved-workout-up");
    const moveDownButton = card.querySelector(".move-saved-workout-down");
    moveUpButton.disabled = index === 0;
    moveDownButton.disabled = index === records.length - 1;
    moveUpButton.addEventListener("click", () => moveSavedWorkout(record.id, -1));
    moveDownButton.addEventListener("click", () => moveSavedWorkout(record.id, 1));

    card.querySelector(".load-saved-workout").addEventListener("click", () => loadSavedWorkout(record.id));
    card.querySelector(".rename-saved-workout").addEventListener("click", () => renameSavedWorkout(record.id));
    card.querySelector(".duplicate-saved-workout").addEventListener("click", () => duplicateSavedWorkout(record.id));
    card.querySelector(".delete-saved-workout").addEventListener("click", () => deleteSavedWorkout(record.id));
    fragment.appendChild(cardFragment);
  });

  dom.savedWorkoutList.appendChild(fragment);
}

function validateCurrentWorkoutForSave() {
  hideFormError();
  const candidate = collectWorkoutFromForm();
  const problems = validateWorkout(candidate);
  if (problems.length) {
    showScreen("setup");
    showFormError(problems[0]);
    document.querySelector(".invalid")?.focus();
    return null;
  }
  return candidate;
}

function saveCurrentWorkout(asNew = false) {
  let candidate = validateCurrentWorkoutForSave();
  if (!candidate) return;

  const records = loadSavedWorkouts();
  const now = Date.now();
  let targetId = asNew ? null : activeSavedWorkoutId;
  let targetIndex = targetId ? records.findIndex((record) => record.id === targetId) : -1;

  if (targetId && targetIndex < 0) {
    targetId = null;
    setActiveSavedWorkoutId(null);
  }

  if (asNew) {
    candidate = {
      ...candidate,
      name: makeUniqueWorkoutName(`${candidate.name} copy`, records)
    };
  }

  if (targetId && !asNew) {
    const duplicateName = records.some(
      (record) => record.id !== targetId && record.workout.name.toLocaleLowerCase() === candidate.name.toLocaleLowerCase()
    );
    if (duplicateName) {
      showFormError("Another saved workout already uses that name. Choose a different workout name.");
      dom.workoutName.classList.add("invalid");
      dom.workoutName.focus();
      return;
    }
  }

  if (!targetId && !asNew) {
    const sameNameIndex = records.findIndex(
      (record) => record.workout.name.toLocaleLowerCase() === candidate.name.toLocaleLowerCase()
    );

    if (sameNameIndex >= 0) {
      const shouldOverwrite = window.confirm(
        `A saved workout named “${candidate.name}” already exists. Press OK to replace it, or Cancel to save a copy.`
      );
      if (shouldOverwrite) {
        targetId = records[sameNameIndex].id;
        targetIndex = sameNameIndex;
      } else {
        candidate = {
          ...candidate,
          name: makeUniqueWorkoutName(`${candidate.name} copy`, records)
        };
      }
    }
  }

  if (targetId && targetIndex >= 0) {
    const existing = records[targetIndex];
    records[targetIndex] = {
      ...existing,
      updatedAt: now,
      workout: cloneWorkout(candidate, false)
    };
    saveSavedWorkouts(records);
    queueSavedWorkoutUpserts([loadSavedWorkouts()[targetIndex]]);
    syncSavedWorkouts().catch(() => {});
    setActiveSavedWorkoutId(targetId);
    saveSettings(candidate);
    showToast("Workout changes saved.");
    return;
  }

  const record = {
    id: workoutUid(),
    createdAt: now,
    updatedAt: now,
    workout: cloneWorkout(candidate, asNew)
  };
  records.push(record);
  saveSavedWorkouts(records);
  queueSavedWorkoutUpserts([findSavedWorkout(record.id)]);
  syncSavedWorkouts().catch(() => {});
  dom.workoutName.value = record.workout.name;
  saveSettings(record.workout);
  setActiveSavedWorkoutId(record.id);
  showToast(asNew ? "Workout copy saved." : "Workout saved.");
}

function loadSavedWorkout(id) {
  const record = findSavedWorkout(id);
  if (!record) {
    showToast("That saved workout could not be found.");
    renderSavedWorkouts();
    return;
  }

  const loaded = cloneWorkout(record.workout, false);
  setActiveSavedWorkoutId(record.id);
  populateForm(loaded);
  saveSettings(loaded);
  hideFormError();
  showScreen("setup");
  showToast(`Loaded “${loaded.name}”.`);
}

function moveSavedWorkout(id, direction) {
  const records = loadSavedWorkouts();
  const index = records.findIndex((record) => record.id === id);
  if (index < 0) return;

  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= records.length) return;

  [records[index], records[nextIndex]] = [records[nextIndex], records[index]];
  const reorderedAt = Date.now();
  records[index] = { ...records[index], updatedAt: reorderedAt };
  records[nextIndex] = { ...records[nextIndex], updatedAt: reorderedAt };
  saveSavedWorkouts(records);
  const savedRecords = loadSavedWorkouts();
  queueSavedWorkoutUpserts(savedRecords.filter((record) => record.id === records[index].id || record.id === records[nextIndex].id));
  syncSavedWorkouts().catch(() => {});
  renderSavedWorkouts();

  const moved = records[nextIndex];
  showToast(`Moved “${moved.workout.name}” ${direction < 0 ? "up" : "down"}.`);

  requestAnimationFrame(() => {
    const movedCard = dom.savedWorkoutList.querySelector(`[data-id="${CSS.escape(id)}"]`);
    movedCard?.querySelector(direction < 0 ? ".move-saved-workout-up" : ".move-saved-workout-down")?.focus();
  });
}

function duplicateSavedWorkout(id) {
  const records = loadSavedWorkouts();
  const source = findSavedWorkout(id, records);
  if (!source) return;

  const now = Date.now();
  const duplicate = cloneWorkout(source.workout, true);
  duplicate.name = makeUniqueWorkoutName(`${source.workout.name} copy`, records);
  const duplicateRecord = {
    id: workoutUid(),
    createdAt: now,
    updatedAt: now,
    workout: duplicate
  };
  records.push(duplicateRecord);
  saveSavedWorkouts(records);
  queueSavedWorkoutUpserts([findSavedWorkout(duplicateRecord.id)]);
  syncSavedWorkouts().catch(() => {});
  renderSavedWorkouts();
  showToast(`Created “${duplicate.name}”.`);
}

function renameSavedWorkout(id) {
  const records = loadSavedWorkouts();
  const index = records.findIndex((record) => record.id === id);
  if (index < 0) return;

  const currentName = records[index].workout.name;
  const entered = window.prompt("Rename workout", currentName);
  if (entered === null) return;

  const nextName = entered.trim();
  if (!nextName) {
    showToast("Workout name cannot be empty.");
    return;
  }

  const nameTaken = records.some(
    (record) => record.id !== id && record.workout.name.toLocaleLowerCase() === nextName.toLocaleLowerCase()
  );
  if (nameTaken) {
    showToast("Another saved workout already uses that name.");
    return;
  }

  records[index] = {
    ...records[index],
    updatedAt: Date.now(),
    workout: {
      ...records[index].workout,
      name: nextName
    }
  };
  saveSavedWorkouts(records);
  queueSavedWorkoutUpserts([findSavedWorkout(id)]);
  syncSavedWorkouts().catch(() => {});

  if (activeSavedWorkoutId === id) {
    dom.workoutName.value = nextName;
    saveSettings(collectWorkoutFromForm());
  }

  updateSavedWorkoutStatus();
  renderSavedWorkouts();
  showToast("Workout renamed.");
}

function deleteSavedWorkout(id) {
  const records = loadSavedWorkouts();
  const record = findSavedWorkout(id, records);
  if (!record) return;

  if (!window.confirm(`Delete “${record.workout.name}”? This cannot be undone.`)) return;

  saveSavedWorkouts(records.filter((item) => item.id !== id));
  queueSavedWorkoutDelete(id);
  syncSavedWorkouts().catch(() => {});
  if (activeSavedWorkoutId === id) setActiveSavedWorkoutId(null);
  renderSavedWorkouts();
  showToast("Saved workout deleted.");
}

function createBlankWorkout() {
  const current = loadSettings();
  return {
    ...current,
    name: "My workout",
    exercises: [{
      id: uid(),
      name: "",
      mode: "reps",
      value: 10,
      rest: current.defaultRest,
      weight: "",
      perSide: false,
      note: ""
    }]
  };
}

function startNewWorkout() {
  const fresh = createBlankWorkout();
  setActiveSavedWorkoutId(null);
  populateForm(fresh);
  saveSettings(fresh);
  hideFormError();
  showScreen("setup");
  showToast("New workout ready.");
}

function populateForm(data) {
  dom.workoutName.value = data.name;
  dom.rounds.value = data.rounds;
  dom.roundRest.value = data.roundRest;
  dom.prepTime.value = data.prepTime;
  dom.defaultRest.value = data.defaultRest;
  dom.voiceEnabled.checked = data.voiceEnabled;
  dom.countdownVoice.checked = data.countdownVoice;
  dom.soundEffects.checked = data.soundEffects;
  dom.voiceDetail.value = data.voiceDetail;
  populateVoiceOptions(data.voiceURI, data.voiceName);
  dom.exerciseList.replaceChildren();
  data.exercises.forEach((exercise) => addExerciseCard(exercise));
  updateExerciseCards();
  updateSavedWorkoutStatus();
}

function addExerciseCard(exercise = null) {
  const defaultRest = clampInteger(dom.defaultRest.value, 0, 600, 20);
  const data = exercise || {
    id: uid(),
    name: "",
    mode: "reps",
    value: 10,
    rest: defaultRest,
    weight: "",
    perSide: false,
    note: ""
  };

  const fragment = dom.exerciseTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".exercise-card");
  card.dataset.id = data.id;

  const name = card.querySelector(".exercise-name");
  const mode = card.querySelector(".exercise-mode");
  const value = card.querySelector(".exercise-value");
  const rest = card.querySelector(".exercise-rest");
  const weight = card.querySelector(".exercise-weight");
  const perSide = card.querySelector(".exercise-per-side");
  const note = card.querySelector(".exercise-note");

  name.value = data.name;
  mode.value = data.mode;
  value.value = data.value;
  rest.value = data.rest;
  weight.value = data.weight;
  perSide.checked = data.perSide;
  note.value = data.note;

  mode.addEventListener("change", () => updateExerciseMode(card));
  card.querySelector(".remove-exercise").addEventListener("click", () => removeExerciseCard(card));
  card.querySelector(".move-up").addEventListener("click", () => moveExerciseCard(card, -1));
  card.querySelector(".move-down").addEventListener("click", () => moveExerciseCard(card, 1));
  card.addEventListener("input", () => saveFormDraft());
  card.addEventListener("change", () => saveFormDraft());

  dom.exerciseList.appendChild(fragment);
  updateExerciseMode(card);
  updateExerciseCards();
  if (!exercise) name.focus({ preventScroll: false });
}

function removeExerciseCard(card) {
  const cards = getExerciseCards();
  if (cards.length <= 1) {
    showFormError("A workout needs at least one exercise.");
    return;
  }
  card.remove();
  updateExerciseCards();
  saveFormDraft();
}

function moveExerciseCard(card, direction) {
  const sibling = direction < 0 ? card.previousElementSibling : card.nextElementSibling;
  if (!sibling) return;

  if (direction < 0) {
    dom.exerciseList.insertBefore(card, sibling);
  } else {
    dom.exerciseList.insertBefore(sibling, card);
  }
  updateExerciseCards();
  saveFormDraft();
}

function getExerciseCards() {
  return [...dom.exerciseList.querySelectorAll(".exercise-card")];
}

function updateExerciseCards() {
  const cards = getExerciseCards();
  cards.forEach((card, index) => {
    card.querySelector(".exercise-number").textContent = String(index + 1);
    card.querySelector(".move-up").disabled = index === 0;
    card.querySelector(".move-down").disabled = index === cards.length - 1;
  });
  dom.exerciseCount.textContent = `${cards.length} ${cards.length === 1 ? "exercise" : "exercises"}`;
}

function updateExerciseMode(card) {
  const mode = card.querySelector(".exercise-mode").value;
  const label = card.querySelector(".exercise-value-label");
  const value = card.querySelector(".exercise-value");
  label.textContent = mode === "time" ? "Duration (seconds)" : "Reps";
  value.max = mode === "time" ? "3600" : "9999";
}

function collectWorkoutFromForm() {
  const exercises = getExerciseCards().map((card) => ({
    id: card.dataset.id || uid(),
    name: card.querySelector(".exercise-name").value.trim(),
    mode: card.querySelector(".exercise-mode").value === "time" ? "time" : "reps",
    value: Number.parseInt(card.querySelector(".exercise-value").value, 10),
    rest: Number.parseInt(card.querySelector(".exercise-rest").value, 10),
    weight: card.querySelector(".exercise-weight").value.trim(),
    perSide: card.querySelector(".exercise-per-side").checked,
    note: card.querySelector(".exercise-note").value.trim()
  }));

  const selectedVoice = getVoiceByKey(dom.voiceSelect.value);
  const selectedOption = dom.voiceSelect.selectedOptions[0];

  return {
    name: dom.workoutName.value.trim() || "My workout",
    rounds: Number.parseInt(dom.rounds.value, 10),
    roundRest: Number.parseInt(dom.roundRest.value, 10),
    prepTime: Number.parseInt(dom.prepTime.value, 10),
    defaultRest: Number.parseInt(dom.defaultRest.value, 10),
    voiceEnabled: dom.voiceEnabled.checked,
    countdownVoice: dom.countdownVoice.checked,
    soundEffects: dom.soundEffects.checked,
    voiceURI: selectedVoice ? voiceKey(selectedVoice) : (dom.voiceSelect.value || ""),
    voiceName: selectedVoice?.name || selectedOption?.dataset.voiceName || "",
    voiceDetail: dom.voiceDetail.value === "minimal" ? "minimal" : "full",
    exercises
  };
}

function validateWorkout(candidate) {
  clearInvalidFields();
  const problems = [];

  validateNumberInput(dom.rounds, candidate.rounds, 1, 99, "Rounds must be between 1 and 99.", problems);
  validateNumberInput(dom.roundRest, candidate.roundRest, 0, 3600, "Round rest must be between 0 and 3,600 seconds.", problems);
  validateNumberInput(dom.prepTime, candidate.prepTime, 0, 60, "Starting countdown must be between 0 and 60 seconds.", problems);
  validateNumberInput(dom.defaultRest, candidate.defaultRest, 0, 600, "Default rest must be between 0 and 600 seconds.", problems);

  if (!candidate.exercises.length) problems.push("Add at least one exercise.");

  getExerciseCards().forEach((card, index) => {
    const exercise = candidate.exercises[index];
    const nameInput = card.querySelector(".exercise-name");
    const valueInput = card.querySelector(".exercise-value");
    const restInput = card.querySelector(".exercise-rest");

    if (!exercise.name) {
      nameInput.classList.add("invalid");
      problems.push(`Exercise ${index + 1} needs a name.`);
    }

    if (!Number.isInteger(exercise.value) || exercise.value < 1 || exercise.value > (exercise.mode === "time" ? 3600 : 9999)) {
      valueInput.classList.add("invalid");
      problems.push(`Exercise ${index + 1} needs a valid ${exercise.mode === "time" ? "duration" : "rep count"}.`);
    }

    if (!Number.isInteger(exercise.rest) || exercise.rest < 0 || exercise.rest > 600) {
      restInput.classList.add("invalid");
      problems.push(`Exercise ${index + 1} rest must be between 0 and 600 seconds.`);
    }
  });

  return [...new Set(problems)];
}

function validateNumberInput(input, value, min, max, message, problems) {
  if (!Number.isInteger(value) || value < min || value > max) {
    input.classList.add("invalid");
    problems.push(message);
  }
}

function clearInvalidFields() {
  document.querySelectorAll(".invalid").forEach((element) => element.classList.remove("invalid"));
}

function showFormError(message) {
  dom.formError.textContent = message;
  dom.formError.hidden = false;
  dom.formError.scrollIntoView({ behavior: "smooth", block: "center" });
}

function hideFormError() {
  dom.formError.hidden = true;
  dom.formError.textContent = "";
}

function saveFormDraft() {
  const draft = collectWorkoutFromForm();
  saveSettings(normalizeWorkout(draft));
}

function showScreen(name) {
  dom.authScreen.hidden = name !== "auth";
  dom.setupScreen.hidden = name !== "setup";
  dom.savedWorkoutsScreen.hidden = name !== "saved";
  dom.trendsScreen.hidden = name !== "trends";
  dom.settingsScreen.hidden = name !== "settings";
  dom.workoutScreen.hidden = name !== "workout";
  dom.completeScreen.hidden = name !== "complete";

  const showNavigation = name === "setup" || name === "saved" || name === "trends" || name === "settings";
  dom.mainNavigation.hidden = !showNavigation;
  dom.setupNavButton.classList.toggle("is-active", name === "setup");
  dom.savedWorkoutsNavButton.classList.toggle("is-active", name === "saved");
  dom.trendsNavButton.classList.toggle("is-active", name === "trends");
  dom.settingsNavButton.classList.toggle("is-active", name === "settings");
  dom.setupNavButton.toggleAttribute("aria-current", name === "setup");
  dom.savedWorkoutsNavButton.toggleAttribute("aria-current", name === "saved");
  dom.trendsNavButton.toggleAttribute("aria-current", name === "trends");
  dom.settingsNavButton.toggleAttribute("aria-current", name === "settings");

  if (name === "saved") renderSavedWorkouts();
  if (name === "trends") renderTrends();
  if (name === "settings") {
    renderSettingsSummary();
    updateHistorySyncStatus();
    updateSavedWorkoutSyncStatus();
  }
  window.scrollTo({ top: 0, behavior: "auto" });
}

async function startWorkout(candidate = null) {
  workout = normalizeWorkout(candidate || collectWorkoutFromForm());
  runtime = createEmptyRuntime();
  runtime.voiceEnabled = workout.voiceEnabled;
  runtime.startedAt = Date.now();
  runtime.exerciseCompletionCounts = workout.exercises.map(() => 0);
  saveSettings(workout);
  clearSavedSession();
  updateVoiceToggle();
  showScreen("workout");
  getAudioContext()?.resume().catch(() => {});
  requestWakeLock();

  if (workout.prepTime > 0) {
    startPrep();
  } else {
    startExercise(0, 0);
  }
}

function startPrep() {
  setPhase(PHASE.PREP, workout.prepTime);
  updateWorkoutDisplay();
  playTone("start");
  speak(workout.voiceDetail === "full" ? `Get ready. Starting ${workout.name}.` : "Get ready.", true);
  startTimer(() => startExercise(0, 0));
}

function startExercise(roundIndex, exerciseIndex, options = {}) {
  runtime.roundIndex = clampInteger(roundIndex, 0, workout.rounds - 1, 0);
  runtime.exerciseIndex = clampInteger(exerciseIndex, 0, workout.exercises.length - 1, 0);
  runtime.announcedCountdown.clear();

  const exercise = currentExercise();
  const phase = exercise.mode === "time" ? PHASE.ACTIVE_TIME : PHASE.ACTIVE_REPS;
  setPhase(phase, exercise.mode === "time" ? exercise.value : 0);
  runtime.paused = Boolean(options.paused);
  if (runtime.paused) pauseSessionClock();
  updateWorkoutDisplay();
  playTone("exercise");
  announceExercise();

  if (phase === PHASE.ACTIVE_TIME && !runtime.paused) {
    startTimer(finishCurrentExercise);
  } else {
    persistSession();
  }
}

function finishCurrentExercise(completed = true) {
  const exercise = currentExercise();
  if (completed) {
    const currentCount = clampInteger(runtime.exerciseCompletionCounts[runtime.exerciseIndex], 0, 9999, 0);
    runtime.exerciseCompletionCounts[runtime.exerciseIndex] = currentCount + 1;
  }
  const isLastExercise = runtime.exerciseIndex === workout.exercises.length - 1;
  const isLastRound = runtime.roundIndex === workout.rounds - 1;

  if (!isLastExercise) {
    if (exercise.rest > 0) {
      startExerciseRest(exercise.rest);
    } else {
      startExercise(runtime.roundIndex, runtime.exerciseIndex + 1);
    }
    return;
  }

  runtime.completedRounds = runtime.roundIndex + 1;
  if (isLastRound) {
    completeWorkout();
  } else if (workout.roundRest > 0) {
    startRoundRest(workout.roundRest);
  } else {
    announceRoundComplete(runtime.roundIndex + 1, false);
    startExercise(runtime.roundIndex + 1, 0);
  }
}

function startExerciseRest(seconds) {
  setPhase(PHASE.EXERCISE_REST, seconds);
  updateWorkoutDisplay();
  playTone("rest");
  announceExerciseRest();
  startTimer(() => startExercise(runtime.roundIndex, runtime.exerciseIndex + 1));
}

function startRoundRest(seconds) {
  setPhase(PHASE.ROUND_REST, seconds);
  updateWorkoutDisplay();
  playTone("round");
  announceRoundComplete(runtime.roundIndex + 1, true);
  startTimer(() => startExercise(runtime.roundIndex + 1, 0));
}

function completeWorkout() {
  clearTimer();
  runtime.completedRounds = workout.rounds;
  recordWorkoutSession("completed");
  runtime.phase = PHASE.COMPLETE;
  clearSavedSession();
  releaseWakeLock();
  cancelSpeech();
  playTone("complete");
  speak("Workout complete. Great job.", true);
  dom.completeWorkoutName.textContent = workout.name;
  dom.completeSummary.textContent = `${workout.rounds} ${workout.rounds === 1 ? "round" : "rounds"} completed`;
  showScreen("complete");
}

function setPhase(phase, seconds) {
  clearTimer();
  runtime.phase = phase;
  runtime.remainingSeconds = Math.max(0, Number(seconds) || 0);
  runtime.totalSeconds = Math.max(0, Number(seconds) || 0);
  runtime.paused = false;
  resumeSessionClock();
  runtime.announcedCountdown.clear();
}

function startTimer(onComplete) {
  clearTimer();
  persistSession();

  if (runtime.remainingSeconds <= 0) {
    onComplete();
    return;
  }

  runtime.timerId = window.setInterval(() => {
    if (runtime.paused) return;

    runtime.remainingSeconds = Math.max(0, runtime.remainingSeconds - 1);
    maybeAnnounceCountdown();
    updateWorkoutDisplay();
    persistSession();

    if (runtime.remainingSeconds <= 0) {
      clearTimer();
      playTone("transition");
      onComplete();
    }
  }, 1000);
}

function clearTimer() {
  if (runtime.timerId) {
    window.clearInterval(runtime.timerId);
    runtime.timerId = null;
  }
}

function currentExercise() {
  return workout.exercises[runtime.exerciseIndex];
}

function nextExercise() {
  if (runtime.exerciseIndex < workout.exercises.length - 1) {
    return workout.exercises[runtime.exerciseIndex + 1];
  }
  if (runtime.roundIndex < workout.rounds - 1) {
    return workout.exercises[0];
  }
  return null;
}

function previousStep() {
  if (!workout) return;

  if (runtime.phase === PHASE.EXERCISE_REST) {
    startExercise(runtime.roundIndex, runtime.exerciseIndex);
    return;
  }

  if (runtime.phase === PHASE.ROUND_REST) {
    startExercise(runtime.roundIndex, workout.exercises.length - 1);
    return;
  }

  if (runtime.phase === PHASE.PREP) {
    runtime.remainingSeconds = workout.prepTime;
    runtime.totalSeconds = workout.prepTime;
    updateWorkoutDisplay();
    return;
  }

  if (runtime.exerciseIndex > 0) {
    startExercise(runtime.roundIndex, runtime.exerciseIndex - 1);
  } else if (runtime.roundIndex > 0) {
    startExercise(runtime.roundIndex - 1, workout.exercises.length - 1);
  } else {
    startExercise(0, 0);
  }
}

function skipStep() {
  if (!workout) return;

  switch (runtime.phase) {
    case PHASE.PREP:
      startExercise(0, 0);
      break;
    case PHASE.ACTIVE_REPS:
    case PHASE.ACTIVE_TIME:
      finishCurrentExercise(false);
      break;
    case PHASE.EXERCISE_REST:
      startExercise(runtime.roundIndex, runtime.exerciseIndex + 1);
      break;
    case PHASE.ROUND_REST:
      startExercise(runtime.roundIndex + 1, 0);
      break;
    default:
      break;
  }
}

function togglePause() {
  if (!workout || runtime.phase === PHASE.ACTIVE_REPS) return;

  runtime.paused = !runtime.paused;
  if (runtime.paused) {
    pauseSessionClock();
    cancelSpeech();
    speak("Paused.", true);
  } else {
    resumeSessionClock();
    speak("Resuming.", true);
  }
  updatePauseButton();
  updateWorkoutDisplay();
  persistSession();
}

function updatePauseButton() {
  const isRepPhase = runtime.phase === PHASE.ACTIVE_REPS;
  dom.pauseButton.disabled = isRepPhase;
  dom.pauseIcon.textContent = runtime.paused ? "▶" : "Ⅱ";
  dom.pauseText.textContent = runtime.paused ? "Resume" : "Pause";
}

function updateWorkoutDisplay() {
  if (!workout) return;

  const exercise = currentExercise();
  const next = nextExercise();
  const isRest = runtime.phase === PHASE.EXERCISE_REST || runtime.phase === PHASE.ROUND_REST;
  const isPrep = runtime.phase === PHASE.PREP;
  const isRep = runtime.phase === PHASE.ACTIVE_REPS;
  const isTimed = runtime.phase === PHASE.ACTIVE_TIME;

  dom.workoutNameDisplay.textContent = workout.name;
  dom.progressText.textContent = `Round ${runtime.roundIndex + 1} of ${workout.rounds}`;
  dom.exercisePosition.textContent = `EXERCISE ${runtime.exerciseIndex + 1} OF ${workout.exercises.length}`;
  dom.doneButton.hidden = !isRep;
  dom.timerUnit.textContent = isRep ? "tap done when finished" : "seconds";
  dom.previousButton.disabled = isPrep && runtime.remainingSeconds === workout.prepTime;
  updatePauseButton();

  if (isPrep) {
    dom.phaseLabel.textContent = runtime.paused ? "PAUSED" : "GET READY";
    dom.timerValue.textContent = formatTimerValue(runtime.remainingSeconds);
    dom.currentExerciseName.textContent = exercise.name;
    dom.currentTarget.textContent = targetText(exercise);
    dom.currentMeta.hidden = true;
    dom.nextExerciseCard.hidden = false;
    dom.nextExerciseName.textContent = exercise.name;
    dom.nextExerciseTarget.textContent = targetText(exercise);
  } else if (isRest) {
    dom.phaseLabel.textContent = runtime.paused ? "PAUSED" : runtime.phase === PHASE.ROUND_REST ? "ROUND REST" : "REST";
    dom.timerValue.textContent = formatTimerValue(runtime.remainingSeconds);
    dom.currentExerciseName.textContent = runtime.phase === PHASE.ROUND_REST ? `Round ${runtime.roundIndex + 1} complete` : "Recover";
    dom.currentTarget.textContent = next ? `Next: ${next.name}` : "Workout complete";
    dom.currentMeta.hidden = true;
    dom.nextExerciseCard.hidden = !next;
    if (next) {
      dom.nextExerciseName.textContent = next.name;
      dom.nextExerciseTarget.textContent = targetText(next);
    }
  } else {
    dom.phaseLabel.textContent = runtime.paused ? "PAUSED" : "ACTIVE";
    dom.timerValue.textContent = isTimed ? formatTimerValue(runtime.remainingSeconds) : String(exercise.value);
    dom.currentExerciseName.textContent = exercise.name;
    dom.currentTarget.textContent = targetText(exercise);
    const meta = [exercise.weight, exercise.note].filter(Boolean).join(" • ");
    dom.currentMeta.textContent = meta;
    dom.currentMeta.hidden = !meta;
    dom.nextExerciseCard.hidden = !next;
    if (next) {
      dom.nextExerciseName.textContent = next.name;
      dom.nextExerciseTarget.textContent = targetText(next);
    }
  }

  dom.timerRing.dataset.phase = isRest ? "rest" : runtime.phase;
  dom.timerRing.style.setProperty("--progress", `${calculateProgressDegrees()}deg`);
}

function calculateProgressDegrees() {
  if (runtime.phase === PHASE.ACTIVE_REPS) return 360;
  if (runtime.totalSeconds <= 0) return 0;
  const elapsed = runtime.totalSeconds - runtime.remainingSeconds;
  return Math.max(0, Math.min(360, (elapsed / runtime.totalSeconds) * 360));
}

function formatTimerValue(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  if (safe < 60) return String(safe);
  const minutes = Math.floor(safe / 60);
  const remaining = safe % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function targetText(exercise) {
  if (!exercise) return "";
  if (exercise.mode === "time") {
    return `${exercise.value} ${exercise.value === 1 ? "second" : "seconds"}`;
  }
  return `${exercise.value} ${exercise.value === 1 ? "rep" : "reps"}${exercise.perSide ? " per side" : ""}`;
}

function speakTarget(exercise) {
  if (exercise.mode === "time") {
    return `${exercise.value} seconds`;
  }
  return `${exercise.value} ${exercise.value === 1 ? "rep" : "reps"}${exercise.perSide ? " per side" : ""}`;
}

function announceExercise() {
  const exercise = currentExercise();
  const round = runtime.roundIndex + 1;
  const phrase = workout.voiceDetail === "full"
    ? `Round ${round}. ${exercise.name}. ${speakTarget(exercise)}.`
    : `${exercise.name}. ${speakTarget(exercise)}.`;
  speak(phrase, true);
}

function announceExerciseRest() {
  const next = workout.exercises[runtime.exerciseIndex + 1];
  const seconds = runtime.totalSeconds;
  const phrase = workout.voiceDetail === "full"
    ? `Rest for ${seconds} seconds. ${next.name} is next.`
    : "Rest now.";
  speak(phrase, true);
}

function announceRoundComplete(roundNumber, includesRest) {
  const nextRound = roundNumber + 1;
  let phrase;

  if (workout.voiceDetail === "full") {
    phrase = includesRest
      ? `Round ${roundNumber} complete. Rest for ${runtime.totalSeconds} seconds. Round ${nextRound} is next.`
      : `Round ${roundNumber} complete. Starting round ${nextRound}.`;
  } else {
    phrase = `End of round ${roundNumber}.`;
  }

  speak(phrase, true);
}

function maybeAnnounceCountdown() {
  const value = runtime.remainingSeconds;
  const eligiblePhase = runtime.phase === PHASE.PREP || runtime.phase === PHASE.ACTIVE_TIME || runtime.phase === PHASE.EXERCISE_REST || runtime.phase === PHASE.ROUND_REST;
  if (!eligiblePhase || value < 1 || value > 3 || runtime.announcedCountdown.has(value)) return;

  runtime.announcedCountdown.add(value);
  if (workout.countdownVoice && runtime.voiceEnabled) {
    speak(String(value), false);
  } else {
    playTone("countdown");
  }
}

function speak(text, interrupt = false, requestedVoiceURI = null, requestedVoiceName = null) {
  if (!runtime.voiceEnabled || !("speechSynthesis" in window) || !text) return;

  if (interrupt) window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = resolveVoice(
    requestedVoiceURI ?? workout?.voiceURI ?? dom.voiceSelect?.value ?? "",
    requestedVoiceName ?? workout?.voiceName ?? ""
  );

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = document.documentElement.lang || "en-US";
  }

  utterance.rate = 0.96;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

function cancelSpeech() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function updateVoiceToggle() {
  dom.voiceToggleButton.setAttribute("aria-pressed", String(runtime.voiceEnabled));
  dom.voiceToggleButton.textContent = runtime.voiceEnabled ? "🔊" : "🔇";
}

function toggleVoice() {
  runtime.voiceEnabled = !runtime.voiceEnabled;
  updateVoiceToggle();
  if (!runtime.voiceEnabled) {
    cancelSpeech();
  } else {
    speak("Voice guidance on.", true);
  }
  persistSession();
}

function getAudioContext() {
  if (!audioContext) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (Context) audioContext = new Context();
  }
  return audioContext;
}

function playTone(kind) {
  if (!workout?.soundEffects) return;
  const context = getAudioContext();
  if (!context) return;

  const patterns = {
    start: [{ frequency: 520, duration: 0.11 }, { frequency: 700, duration: 0.14 }],
    exercise: [{ frequency: 760, duration: 0.12 }],
    rest: [{ frequency: 390, duration: 0.16 }],
    round: [{ frequency: 520, duration: 0.12 }, { frequency: 520, duration: 0.12 }],
    transition: [{ frequency: 650, duration: 0.09 }],
    countdown: [{ frequency: 450, duration: 0.06 }],
    complete: [{ frequency: 520, duration: 0.11 }, { frequency: 660, duration: 0.11 }, { frequency: 820, duration: 0.18 }]
  };

  const pattern = patterns[kind] || patterns.transition;
  let offset = 0;
  pattern.forEach(({ frequency, duration }) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, context.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + offset + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + offset + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + offset);
    oscillator.stop(context.currentTime + offset + duration + 0.02);
    offset += duration + 0.06;
  });
}

async function requestWakeLock() {
  if (!("wakeLock" in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch {
    wakeLock = null;
  }
}

async function restoreWakeLockIfNeeded() {
  if (!dom.workoutScreen.hidden && document.visibilityState === "visible" && !wakeLock) {
    await requestWakeLock();
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}

function persistSession() {
  if (!workout || !runtime.phase || runtime.phase === PHASE.COMPLETE) return;

  const session = {
    savedAt: Date.now(),
    workout,
    runtime: {
      phase: runtime.phase,
      roundIndex: runtime.roundIndex,
      exerciseIndex: runtime.exerciseIndex,
      remainingSeconds: runtime.remainingSeconds,
      totalSeconds: runtime.totalSeconds,
      paused: true,
      voiceEnabled: runtime.voiceEnabled,
      completedRounds: runtime.completedRounds,
      elapsedDurationMs: getElapsedDurationMs(),
      exerciseCompletionCounts: runtime.exerciseCompletionCounts
    }
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSavedSession() {
  localStorage.removeItem(SESSION_KEY);
  dom.resumeBanner.hidden = true;
}

function getSavedSession() {
  const saved = safeJsonParse(localStorage.getItem(SESSION_KEY));
  if (!saved || !saved.savedAt || Date.now() - saved.savedAt > SESSION_MAX_AGE_MS) {
    clearSavedSession();
    return null;
  }
  return saved;
}

function showSavedSessionBanner() {
  dom.resumeBanner.hidden = !getSavedSession();
}

async function resumeSavedSession() {
  const saved = getSavedSession();
  if (!saved) return;

  workout = normalizeWorkout(saved.workout);
  runtime = createEmptyRuntime();
  const elapsedDurationMs = Math.max(0, Number(saved.runtime?.elapsedDurationMs) || 0);
  Object.assign(runtime, saved.runtime, {
    timerId: null,
    paused: true,
    announcedCountdown: new Set(),
    startedAt: Date.now() - elapsedDurationMs,
    pausedDurationMs: 0,
    pauseStartedAt: Date.now(),
    exerciseCompletionCounts: workout.exercises.map((_, index) => clampInteger(saved.runtime?.exerciseCompletionCounts?.[index], 0, 9999, 0)),
    historyRecorded: false
  });
  updateVoiceToggle();
  showScreen("workout");
  updateWorkoutDisplay();
  getAudioContext()?.resume().catch(() => {});
  requestWakeLock();
  persistSession();
}

function resumeTimerForCurrentPhase() {
  switch (runtime.phase) {
    case PHASE.PREP:
      startTimer(() => startExercise(0, 0));
      break;
    case PHASE.ACTIVE_TIME:
      startTimer(finishCurrentExercise);
      break;
    case PHASE.EXERCISE_REST:
      startTimer(() => startExercise(runtime.roundIndex, runtime.exerciseIndex + 1));
      break;
    case PHASE.ROUND_REST:
      startTimer(() => startExercise(runtime.roundIndex + 1, 0));
      break;
    default:
      break;
  }
}

function togglePauseWithResumeSupport() {
  if (!workout || runtime.phase === PHASE.ACTIVE_REPS) return;

  const wasPaused = runtime.paused;
  runtime.paused = !runtime.paused;

  if (runtime.paused) {
    pauseSessionClock();
    cancelSpeech();
    speak("Paused.", true);
  } else {
    resumeSessionClock();
    speak("Resuming.", true);
    if (wasPaused && !runtime.timerId) resumeTimerForCurrentPhase();
  }

  updatePauseButton();
  updateWorkoutDisplay();
  persistSession();
}

async function endWorkoutAndReturnToSetup(options = {}) {
  if (options.saveSession) recordWorkoutSession("partial");
  clearTimer();
  cancelSpeech();
  releaseWakeLock();
  clearSavedSession();
  runtime = createEmptyRuntime();
  workout = null;
  showScreen("setup");
  populateForm(loadSettings());
}

async function confirmEndWorkout() {
  const completedExercises = runtime.exerciseCompletionCounts.reduce((sum, value) => sum + (Number(value) || 0), 0);
  const progressMessage = `${runtime.completedRounds} of ${workout.rounds} full ${workout.rounds === 1 ? "round" : "rounds"} completed • ${completedExercises} exercise ${completedExercises === 1 ? "set" : "sets"} recorded.`;

  if (!dom.confirmDialog.showModal) {
    if (!window.confirm(`End this workout?\n\n${progressMessage}`)) return;
    const saveSession = window.confirm("Save this ended session in your workout history?");
    await endWorkoutAndReturnToSetup({ saveSession });
    if (saveSession) showToast("Session saved to Trends.");
    return;
  }

  dom.confirmDialogTitle.textContent = "End this workout?";
  dom.confirmDialogMessage.textContent = `${progressMessage} Save it to Trends, or discard it.`;
  dom.confirmDialog.showModal();
  const result = await new Promise((resolve) => {
    dom.confirmDialog.addEventListener("close", () => resolve(dom.confirmDialog.returnValue), { once: true });
  });
  if (result === "save") {
    await endWorkoutAndReturnToSetup({ saveSession: true });
    showToast("Session saved to Trends.");
  } else if (result === "discard") {
    await endWorkoutAndReturnToSetup();
  }
}

function testVoice() {
  const draft = collectWorkoutFromForm();
  runtime.voiceEnabled = draft.voiceEnabled;
  if (!runtime.voiceEnabled) {
    showFormError("Turn on voice guidance before testing the voice.");
    return;
  }
  hideFormError();
  const first = draft.exercises[0] || { name: "Squats", mode: "reps", value: 10, perSide: false };
  const phrase = draft.voiceDetail === "full"
    ? `Round 1. ${first.name || "Squats"}. ${speakTarget(first)}.`
    : `${first.name || "Squats"}. ${speakTarget(first)}.`;
  speak(phrase, true, draft.voiceURI, draft.voiceName);
}


function startOfLocalDay(value = Date.now()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfWeek(value = Date.now()) {
  const date = startOfLocalDay(value);
  const day = date.getDay();
  const offset = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - offset);
  return date;
}

function dateKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatDuration(seconds) {
  const safe = Math.max(0, Math.round(Number(seconds) || 0));
  if (safe < 60) return `${safe}s`;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.round((safe % 3600) / 60);
  if (!hours) return `${minutes}m`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function formatDateRange(start, end) {
  const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function formatSessionDate(timestamp) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(timestamp));
  } catch {
    return "Recent session";
  }
}

function summarizeHistory(records) {
  return {
    workouts: records.length,
    durationSeconds: records.reduce((sum, record) => sum + record.durationSeconds, 0),
    rounds: records.reduce((sum, record) => sum + record.completedRounds, 0),
    exercises: records.reduce(
      (sum, record) => sum + record.exercises.reduce((exerciseSum, exercise) => exerciseSum + exercise.completedSets, 0),
      0
    )
  };
}

function updatePeriodSummary(prefix, records, start, end) {
  const summary = summarizeHistory(records.filter((record) => record.endedAt >= start.getTime() && record.endedAt <= end.getTime()));
  dom[`${prefix}DateRange`].textContent = formatDateRange(start, end);
  dom[`${prefix}Workouts`].textContent = String(summary.workouts);
  dom[`${prefix}Minutes`].textContent = formatDuration(summary.durationSeconds);
  dom[`${prefix}Rounds`].textContent = String(summary.rounds);
  dom[`${prefix}Exercises`].textContent = String(summary.exercises);
}

function getStreakStats(records) {
  const uniqueDays = [...new Set(records.map((record) => dateKey(record.endedAt)))].sort();
  if (!uniqueDays.length) return { current: 0, longest: 0 };

  let longest = 1;
  let running = 1;
  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previous = startOfLocalDay(`${uniqueDays[index - 1]}T12:00:00`);
    const current = startOfLocalDay(`${uniqueDays[index]}T12:00:00`);
    const difference = Math.round((current - previous) / 86400000);
    running = difference === 1 ? running + 1 : 1;
    longest = Math.max(longest, running);
  }

  const days = new Set(uniqueDays);
  const today = startOfLocalDay();
  let cursor = days.has(dateKey(today)) ? today : addDays(today, -1);
  let current = 0;
  while (days.has(dateKey(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}

function getMostActiveDay(records) {
  if (!records.length) return "—";
  const counts = Array(7).fill(0);
  records.forEach((record) => { counts[new Date(record.endedAt).getDay()] += 1; });
  const maximum = Math.max(...counts);
  const index = counts.indexOf(maximum);
  return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(new Date(2026, 7, 2 + index));
}

function buildActivityBuckets(records, range) {
  const now = new Date();
  const today = startOfLocalDay(now);
  if (range === "7" || range === "30") {
    const days = Number(range);
    return Array.from({ length: days }, (_, index) => {
      const start = addDays(today, index - days + 1);
      const end = addDays(start, 1);
      const totalSeconds = records
        .filter((record) => record.endedAt >= start.getTime() && record.endedAt < end.getTime())
        .reduce((sum, record) => sum + record.durationSeconds, 0);
      return {
        label: days === 7
          ? new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(start).slice(0, 2)
          : String(start.getDate()),
        title: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(start),
        minutes: totalSeconds / 60
      };
    });
  }

  if (range === "90") {
    return Array.from({ length: 13 }, (_, index) => {
      const start = addDays(today, (index - 12) * 7 - 6);
      const end = addDays(start, 7);
      const totalSeconds = records
        .filter((record) => record.endedAt >= start.getTime() && record.endedAt < end.getTime())
        .reduce((sum, record) => sum + record.durationSeconds, 0);
      return {
        label: index % 2 === 0 ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(start) : "",
        title: `Week of ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(start)}`,
        minutes: totalSeconds / 60
      };
    });
  }

  const earliest = records.length ? new Date(Math.min(...records.map((record) => record.endedAt))) : now;
  const firstMonth = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthCount = Math.max(1, (currentMonth.getFullYear() - firstMonth.getFullYear()) * 12 + currentMonth.getMonth() - firstMonth.getMonth() + 1);
  return Array.from({ length: monthCount }, (_, index) => {
    const start = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const totalSeconds = records
      .filter((record) => record.endedAt >= start.getTime() && record.endedAt < end.getTime())
      .reduce((sum, record) => sum + record.durationSeconds, 0);
    return {
      label: new Intl.DateTimeFormat(undefined, { month: "short", year: monthCount > 12 ? "2-digit" : undefined }).format(start),
      title: new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(start),
      minutes: totalSeconds / 60
    };
  });
}

function renderActivityChart(records) {
  const buckets = buildActivityBuckets(records, activeTrendRange);
  const totalMinutes = buckets.reduce((sum, bucket) => sum + bucket.minutes, 0);
  const maxMinutes = Math.max(1, ...buckets.map((bucket) => bucket.minutes));
  dom.activityChartSummary.textContent = `${Math.round(totalMinutes)} training ${Math.round(totalMinutes) === 1 ? "minute" : "minutes"} in this range.`;
  dom.activityChart.setAttribute("aria-label", `Training minutes chart. ${Math.round(totalMinutes)} minutes in the selected range.`);
  dom.activityChart.replaceChildren();

  const namespace = "http://www.w3.org/2000/svg";
  const width = 720;
  const height = 245;
  const margin = { top: 18, right: 12, bottom: 42, left: 38 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const svg = document.createElementNS(namespace, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.classList.add("activity-svg");
  svg.style.minWidth = buckets.length <= 7 ? "100%" : buckets.length <= 13 ? "560px" : "760px";

  [0, 0.5, 1].forEach((ratio) => {
    const y = margin.top + chartHeight * (1 - ratio);
    const line = document.createElementNS(namespace, "line");
    line.setAttribute("x1", margin.left);
    line.setAttribute("x2", width - margin.right);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    line.classList.add("chart-grid-line");
    svg.appendChild(line);

    const label = document.createElementNS(namespace, "text");
    label.setAttribute("x", margin.left - 7);
    label.setAttribute("y", y + 4);
    label.setAttribute("text-anchor", "end");
    label.classList.add("chart-axis-label");
    label.textContent = String(Math.round(maxMinutes * ratio));
    svg.appendChild(label);
  });

  const slot = chartWidth / Math.max(1, buckets.length);
  const barWidth = Math.max(3, Math.min(30, slot * 0.62));
  const labelEvery = buckets.length > 20 ? Math.ceil(buckets.length / 8) : 1;
  buckets.forEach((bucket, index) => {
    const barHeight = bucket.minutes ? Math.max(3, (bucket.minutes / maxMinutes) * chartHeight) : 0;
    const x = margin.left + slot * index + (slot - barWidth) / 2;
    const y = margin.top + chartHeight - barHeight;
    const group = document.createElementNS(namespace, "g");
    const title = document.createElementNS(namespace, "title");
    title.textContent = `${bucket.title}: ${Math.round(bucket.minutes)} minutes`;
    group.appendChild(title);

    const bar = document.createElementNS(namespace, "rect");
    bar.setAttribute("x", x);
    bar.setAttribute("y", y);
    bar.setAttribute("width", barWidth);
    bar.setAttribute("height", barHeight);
    bar.setAttribute("rx", Math.min(5, barWidth / 2));
    bar.classList.add("chart-bar");
    if (!bucket.minutes) bar.classList.add("is-empty");
    group.appendChild(bar);
    svg.appendChild(group);

    if (bucket.label && (index % labelEvery === 0 || index === buckets.length - 1)) {
      const label = document.createElementNS(namespace, "text");
      label.setAttribute("x", x + barWidth / 2);
      label.setAttribute("y", height - 15);
      label.setAttribute("text-anchor", "middle");
      label.classList.add("chart-axis-label", "chart-x-label");
      label.textContent = bucket.label;
      svg.appendChild(label);
    }
  });
  dom.activityChart.appendChild(svg);
}

function exerciseKey(name) {
  return String(name || "").trim().toLocaleLowerCase();
}

function collectExerciseTrendData(records) {
  const map = new Map();
  records.forEach((record) => {
    record.exercises.forEach((exercise) => {
      if (exercise.completedSets <= 0) return;
      const key = exerciseKey(exercise.name);
      if (!map.has(key)) map.set(key, { key, name: exercise.name, entries: [] });
      map.get(key).entries.push({ ...exercise, session: record });
    });
  });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function renderExerciseTrend(records) {
  const trends = collectExerciseTrendData(records);
  const previous = dom.exerciseTrendSelect.value;
  dom.exerciseTrendSelect.replaceChildren(...trends.map((trend) => new Option(trend.name, trend.key)));
  dom.exerciseTrendSelect.disabled = trends.length === 0;
  if (!trends.length) {
    dom.exerciseTrendStats.innerHTML = '<p class="subtle inline-empty">Complete an exercise to see its progress.</p>';
    dom.exerciseTrendHistory.replaceChildren();
    return;
  }

  dom.exerciseTrendSelect.value = trends.some((trend) => trend.key === previous) ? previous : trends[0].key;
  const selected = trends.find((trend) => trend.key === dom.exerciseTrendSelect.value) || trends[0];
  const entries = [...selected.entries].sort((a, b) => b.session.endedAt - a.session.endedAt);
  const sessionCount = new Set(entries.map((entry) => entry.session.id)).size;
  const completedSets = entries.reduce((sum, entry) => sum + entry.completedSets, 0);
  const latest = entries[0];
  const sameModeEntries = entries.filter((entry) => entry.mode === latest.mode);
  const best = sameModeEntries.reduce((winner, entry) => entry.value > winner.value ? entry : winner, sameModeEntries[0]);
  const latestWeight = entries.find((entry) => entry.weight)?.weight || "—";

  dom.exerciseTrendStats.innerHTML = `
    <div><strong>${sessionCount}</strong><span>Sessions</span></div>
    <div><strong>${completedSets}</strong><span>Completed sets</span></div>
    <div><strong>${targetText(latest)}</strong><span>Latest target</span></div>
    <div><strong>${targetText(best)}</strong><span>Best target</span></div>
    <div class="exercise-weight-stat"><strong>${escapeHtml(latestWeight)}</strong><span>Latest weight</span></div>
  `;

  dom.exerciseTrendHistory.replaceChildren();
  entries.slice(0, 6).forEach((entry) => {
    const row = document.createElement("div");
    row.className = "exercise-trend-row";
    row.innerHTML = `
      <div><strong>${formatSessionDate(entry.session.endedAt)}</strong><span>${escapeHtml(entry.session.workoutName)}</span></div>
      <div><strong>${targetText(entry)}</strong><span>${entry.completedSets} ${entry.completedSets === 1 ? "set" : "sets"}${entry.weight ? ` • ${escapeHtml(entry.weight)}` : ""}</span></div>
    `;
    dom.exerciseTrendHistory.appendChild(row);
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderHistoryList(records) {
  dom.historyList.replaceChildren();
  dom.historyCount.textContent = `${records.length} ${records.length === 1 ? "session" : "sessions"}`;
  records.forEach((record) => {
    const completedSets = record.exercises.reduce((sum, exercise) => sum + exercise.completedSets, 0);
    const article = document.createElement("article");
    article.className = "history-card";
    const completedExercises = record.exercises.filter((exercise) => exercise.completedSets > 0);
    const exerciseDetails = completedExercises.length
      ? completedExercises.map((exercise) => `
          <li>
            <span>${escapeHtml(exercise.name)}</span>
            <strong>${exercise.completedSets} × ${targetText(exercise)}${exercise.weight ? ` • ${escapeHtml(exercise.weight)}` : ""}</strong>
          </li>`).join("")
      : '<li><span>No completed exercises recorded</span></li>';

    article.innerHTML = `
      <div class="history-card-top">
        <div>
          <div class="history-title-row">
            <h4>${escapeHtml(record.workoutName)}</h4>
            <span class="history-status ${record.status === "completed" ? "is-complete" : "is-partial"}">${record.status === "completed" ? "Completed" : "Ended early"}</span>
          </div>
          <p>${formatSessionDate(record.endedAt)}</p>
        </div>
        <button class="mini-icon delete-history-session" type="button" aria-label="Delete this workout session">×</button>
      </div>
      <div class="history-meta-grid">
        <div><strong>${formatDuration(record.durationSeconds)}</strong><span>Duration</span></div>
        <div><strong>${record.completedRounds}/${record.plannedRounds}</strong><span>Rounds</span></div>
        <div><strong>${completedSets}</strong><span>Exercise sets</span></div>
      </div>
      <details class="history-details">
        <summary>View exercise details</summary>
        <ul>${exerciseDetails}</ul>
      </details>
    `;
    article.querySelector(".delete-history-session").addEventListener("click", () => deleteHistorySession(record.id));
    dom.historyList.appendChild(article);
  });
}

function deleteHistorySession(id) {
  const records = loadWorkoutHistory();
  const record = records.find((item) => item.id === id);
  if (!record) return;
  if (!window.confirm(`Delete the ${formatSessionDate(record.endedAt)} session for “${record.workoutName}”?`)) return;
  saveWorkoutHistory(records.filter((item) => item.id !== id));
  queueHistoryDelete(id);
  renderTrends();
  syncWorkoutHistory().catch(() => {});
  showToast("Workout session deleted.");
}

function clearWorkoutHistory() {
  const records = loadWorkoutHistory();
  if (!records.length) return;
  if (!window.confirm("Clear all workout history? This cannot be undone.")) return;
  queueHistoryDeleteAll();
  localStorage.removeItem(HISTORY_KEY);
  renderTrends();
  syncWorkoutHistory().catch(() => {});
  showToast("Workout history cleared.");
}

function renderTrends() {
  if (!dom.trendsScreen) return;
  const records = loadWorkoutHistory();
  const hasHistory = records.length > 0;
  dom.trendsEmptyState.hidden = hasHistory;
  dom.trendsContent.hidden = !hasHistory;
  if (!hasHistory) return;

  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  updatePeriodSummary("week", records, weekStart, now);
  updatePeriodSummary("month", records, monthStart, now);

  const streak = getStreakStats(records);
  dom.currentStreak.textContent = `${streak.current} ${streak.current === 1 ? "day" : "days"}`;
  dom.longestStreak.textContent = `${streak.longest} ${streak.longest === 1 ? "day" : "days"}`;
  dom.mostActiveDay.textContent = getMostActiveDay(records);
  renderActivityChart(records);
  renderExerciseTrend(records);
  renderHistoryList(records);
}

function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme, persist = true) {
  const resolvedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = resolvedTheme;

  const isDark = resolvedTheme === "dark";
  dom.themeToggleButton.textContent = isDark ? "☀️" : "🌙";
  dom.themeToggleButton.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  dom.themeToggleButton.title = isDark ? "Switch to light mode" : "Switch to dark mode";
  dom.themeToggleButton.setAttribute("aria-pressed", String(isDark));
  dom.themeColorMeta.content = isDark ? "#07131c" : "#0b6ea8";

  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, resolvedTheme);
    } catch {
      // The theme still applies for the current page when storage is unavailable.
    }
  }
}

function toggleTheme() {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
}

function voiceKey(voice) {
  return voice?.voiceURI || `${voice?.name || ""}|${voice?.lang || ""}`;
}

function getVoiceByKey(key) {
  if (!key) return null;
  return availableVoices.find((voice) => voiceKey(voice) === key) || null;
}

function resolveVoice(preferredURI, preferredName = "") {
  return getVoiceByKey(preferredURI)
    || availableVoices.find((voice) => preferredName && voice.name === preferredName)
    || null;
}

function sortVoices(voices) {
  return [...voices].sort((a, b) => {
    if (a.default !== b.default) return a.default ? -1 : 1;
    const aEnglish = /^en(-|$)/i.test(a.lang);
    const bEnglish = /^en(-|$)/i.test(b.lang);
    if (aEnglish !== bEnglish) return aEnglish ? -1 : 1;
    return `${a.lang} ${a.name}`.localeCompare(`${b.lang} ${b.name}`);
  });
}

function populateVoiceOptions(preferredURI = dom.voiceSelect.value, preferredName = "") {
  if (!("speechSynthesis" in window)) {
    dom.voiceSelect.replaceChildren(new Option("Voice selection unavailable", ""));
    dom.voiceSelect.disabled = true;
    dom.testVoiceButton.disabled = true;
    dom.voiceAvailability.textContent = "This browser does not support speech synthesis.";
    return;
  }

  availableVoices = sortVoices(window.speechSynthesis.getVoices());
  const resolvedVoice = resolveVoice(preferredURI, preferredName);
  const options = [new Option("System default", "")];

  availableVoices.forEach((voice) => {
    const label = `${voice.name} — ${voice.lang}${voice.default ? " (default)" : ""}`;
    const option = new Option(label, voiceKey(voice));
    option.dataset.voiceName = voice.name;
    options.push(option);
  });

  dom.voiceSelect.replaceChildren(...options);
  dom.voiceSelect.disabled = false;
  dom.testVoiceButton.disabled = false;
  dom.voiceSelect.value = resolvedVoice ? voiceKey(resolvedVoice) : "";
  dom.voiceAvailability.textContent = availableVoices.length
    ? `${availableVoices.length} voices available on this device.`
    : "Loading voices from your browser and device…";
}

function setupVoiceSelection() {
  if (!("speechSynthesis" in window)) {
    populateVoiceOptions();
    return;
  }

  const refresh = () => {
    const settings = loadSettings();
    populateVoiceOptions(dom.voiceSelect.value || settings.voiceURI, settings.voiceName);
  };

  refresh();
  if (typeof window.speechSynthesis.addEventListener === "function") {
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
  } else {
    window.speechSynthesis.onvoiceschanged = refresh;
  }
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    });
  }
}

function setupInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    dom.installButton.hidden = false;
  });

  dom.installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    dom.installButton.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    dom.installButton.hidden = true;
  });
}

function bindEvents() {
  dom.signInModeButton.addEventListener("click", () => setAuthMode("signin"));
  dom.signUpModeButton.addEventListener("click", () => setAuthMode("signup"));
  dom.authForm.addEventListener("submit", submitAuthForm);
  dom.signOutButton.addEventListener("click", signOutCurrentDevice);
  dom.setupNavButton.addEventListener("click", () => showScreen("setup"));
  dom.savedWorkoutsNavButton.addEventListener("click", () => showScreen("saved"));
  dom.trendsNavButton.addEventListener("click", () => showScreen("trends"));
  dom.settingsNavButton.addEventListener("click", () => showScreen("settings"));
  dom.saveWorkoutButton.addEventListener("click", () => saveCurrentWorkout(false));
  dom.saveWorkoutAsButton.addEventListener("click", () => saveCurrentWorkout(true));
  dom.newWorkoutButton.addEventListener("click", startNewWorkout);
  dom.emptyStateSetupButton.addEventListener("click", () => showScreen("setup"));
  dom.trendsStartWorkoutButton.addEventListener("click", () => showScreen("setup"));
  dom.clearHistoryButton.addEventListener("click", clearWorkoutHistory);
  dom.exportBackupButton.addEventListener("click", exportBackup);
  dom.importBackupButton.addEventListener("click", () => dom.importBackupInput.click());
  dom.importBackupInput.addEventListener("change", importBackupFile);
  dom.syncHistoryButton.addEventListener("click", () => syncWorkoutHistory({ manual: true }));
  dom.uploadExistingHistoryButton.addEventListener("click", uploadExistingWorkoutHistory);
  dom.syncSavedWorkoutsButton.addEventListener("click", () => syncSavedWorkouts({ manual: true }));
  dom.uploadExistingSavedWorkoutsButton.addEventListener("click", uploadExistingSavedWorkouts);
  dom.exerciseTrendSelect.addEventListener("change", () => renderExerciseTrend(loadWorkoutHistory()));
  dom.trendRangeButtons.addEventListener("click", (event) => {
    const button = event.target.closest(".range-button");
    if (!button) return;
    activeTrendRange = button.dataset.range || "7";
    dom.trendRangeButtons.querySelectorAll(".range-button").forEach((item) => item.classList.toggle("is-active", item === button));
    renderActivityChart(loadWorkoutHistory());
  });
  dom.addExerciseButton.addEventListener("click", () => addExerciseCard());
  dom.defaultRest.addEventListener("change", saveFormDraft);
  dom.workoutForm.addEventListener("input", (event) => {
    if (!event.target.closest(".exercise-card")) saveFormDraft();
  });
  dom.workoutForm.addEventListener("change", (event) => {
    if (!event.target.closest(".exercise-card")) saveFormDraft();
  });

  dom.workoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideFormError();
    const candidate = collectWorkoutFromForm();
    const problems = validateWorkout(candidate);
    if (problems.length) {
      showFormError(problems[0]);
      document.querySelector(".invalid")?.focus();
      return;
    }
    await startWorkout(candidate);
  });

  dom.testVoiceButton.addEventListener("click", testVoice);
  dom.themeToggleButton.addEventListener("click", toggleTheme);
  dom.doneButton.addEventListener("click", () => finishCurrentExercise(true));
  dom.previousButton.addEventListener("click", previousStep);
  dom.pauseButton.addEventListener("click", togglePauseWithResumeSupport);
  dom.skipButton.addEventListener("click", skipStep);
  dom.voiceToggleButton.addEventListener("click", toggleVoice);
  dom.backToSetupButton.addEventListener("click", confirmEndWorkout);
  dom.repeatWorkoutButton.addEventListener("click", () => startWorkout(workout));
  dom.editWorkoutButton.addEventListener("click", endWorkoutAndReturnToSetup);
  dom.resumeSavedSession.addEventListener("click", resumeSavedSession);
  dom.discardSavedSession.addEventListener("click", clearSavedSession);

  document.addEventListener("visibilitychange", restoreWakeLockIfNeeded);
  window.addEventListener("beforeunload", persistSession);
  window.addEventListener("online", refreshAuthenticationAfterReconnect);
  window.addEventListener("offline", () => {
    const user = authSession?.user || loadCachedAuthUser();
    if (user) {
      updateAccountPanel(user, true);
      setAccountMessage("You are offline. Workout data on this device remains available.");
      updateHistorySyncStatus();
      updateSavedWorkoutSyncStatus();
    }
  });
}

async function init() {
  applyTheme(loadTheme(), false);
  const savedWorkouts = loadSavedWorkouts();
  const storedActiveId = loadActiveSavedWorkoutId();
  activeSavedWorkoutId = savedWorkouts.some((record) => record.id === storedActiveId) ? storedActiveId : null;
  if (!activeSavedWorkoutId && storedActiveId) setActiveSavedWorkoutId(null);

  populateForm(loadSettings());
  renderSavedWorkouts();
  renderTrends();
  renderSettingsSummary();
  setupVoiceSelection();
  bindEvents();
  showSavedSessionBanner();
  registerServiceWorker();
  setupInstallPrompt();
  setAuthMode("signin");
  await initializeAuthentication();
}

init();
