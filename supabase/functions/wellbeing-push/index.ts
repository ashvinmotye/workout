import { createClient } from "npm:@supabase/supabase-js@2.112.3";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
let currentSecretKey = "";
try {
  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  currentSecretKey = secretKeys.default || Object.values(secretKeys)[0] || "";
} catch {
  // Fall through to the legacy hosted secret while Supabase completes its key migration.
}
const serviceRoleKey = String(currentSecretKey || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "";
const cronSecret = Deno.env.get("CRON_SECRET") || "";

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

type Preferences = {
  enabled: boolean;
  weightEnabled: boolean;
  waistEnabled: boolean;
  workoutEnabled: boolean;
  fitnessEnabled: boolean;
  timeZone: string;
};

type LocalParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

function validTimeZone(value: unknown) {
  const candidate = typeof value === "string" && value.length <= 80 ? value : "Indian/Mauritius";
  try {
    new Intl.DateTimeFormat("en", { timeZone: candidate }).format();
    return candidate;
  } catch {
    return "Indian/Mauritius";
  }
}

function normalizePreferences(value: any): Preferences {
  return {
    enabled: value?.enabled === true,
    weightEnabled: value?.weightEnabled ?? value?.weight_enabled ?? true,
    waistEnabled: value?.waistEnabled ?? value?.waist_enabled ?? true,
    workoutEnabled: value?.workoutEnabled ?? value?.workout_enabled ?? true,
    fitnessEnabled: value?.fitnessEnabled ?? value?.fitness_enabled ?? true,
    timeZone: validTimeZone(value?.timeZone ?? value?.time_zone)
  };
}

function preferenceRow(userId: string, preferences: Preferences) {
  return {
    user_id: userId,
    enabled: preferences.enabled,
    weight_enabled: preferences.weightEnabled,
    waist_enabled: preferences.waistEnabled,
    workout_enabled: preferences.workoutEnabled,
    fitness_enabled: preferences.fitnessEnabled,
    time_zone: preferences.timeZone
  };
}

function preferencesFromRow(row: any): Preferences {
  return normalizePreferences(row || {});
}

async function authenticatedUser(req: Request) {
  const authorization = req.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  return error ? null : data.user;
}

async function stateForUser(userId: string) {
  const { data: preferenceData, error: preferenceError } = await db
    .from("wellbeing_notification_preferences")
    .select("enabled, weight_enabled, waist_enabled, workout_enabled, fitness_enabled, time_zone")
    .eq("user_id", userId)
    .maybeSingle();
  if (preferenceError) throw preferenceError;
  const preferences = preferencesFromRow(preferenceData);
  const today = dateKey(localParts(new Date(), preferences.timeZone));
  const tomorrow = shiftDateKey(today, 1);
  const { data: notifications, error: notificationError } = await db
    .from("wellbeing_notifications")
    .select("id, type, title, body, notification_key, is_read, read_at, created_at")
    .eq("user_id", userId)
    .gte("created_at", zonedBoundaryIso(today, preferences.timeZone))
    .lt("created_at", zonedBoundaryIso(tomorrow, preferences.timeZone))
    .order("created_at", { ascending: false })
    .limit(200);
  if (notificationError) throw notificationError;
  return {
    preferences,
    notifications: notifications || [],
    vapidPublicKey
  };
}

async function savePreferences(userId: string, value: any) {
  const preferences = normalizePreferences(value);
  const { error } = await db.from("wellbeing_notification_preferences")
    .upsert(preferenceRow(userId, preferences), { onConflict: "user_id" });
  if (error) throw error;
  return preferences;
}

function localParts(now: Date, timeZone: string): LocalParts {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short"
  });
  const values = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    weekday: values.weekday
  };
}

function dateKey(parts: LocalParts) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function shiftDateKey(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function zonedBoundaryIso(value: string, timeZone: string) {
  const [year, month, day] = value.split("-").map(Number);
  const desired = Date.UTC(year, month - 1, day, 0, 0, 0);
  let guess = desired;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = localParts(new Date(guess), timeZone);
    const represented = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, 0);
    guess += desired - represented;
  }
  return new Date(guess).toISOString();
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function changeText(value: number | null, unit: string) {
  if (value === null) return "not enough data";
  if (Math.abs(value) < 0.005) return `0.00 ${unit}`;
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(2)} ${unit}`;
}

async function weightMessage(userId: string, today: string) {
  const { data, error } = await db.from("body_weight_entries")
    .select("measurement_date, weight_kg")
    .eq("user_id", userId)
    .order("measurement_date", { ascending: true });
  if (error) throw error;
  const records = data || [];
  if (!records.length) return "Take today's weight to start your baseline.";
  const latest = records[records.length - 1];
  const first = records[0];
  const cutoff = shiftDateKey(today, -6);
  const recent = records.filter((record) => record.measurement_date >= cutoff && record.measurement_date <= today);
  const latestValue = numberValue(latest.weight_kg);
  const firstValue = numberValue(first.weight_kg);
  const recentFirstValue = recent.length ? numberValue(recent[0].weight_kg) : null;
  const sevenDayChange = latestValue !== null && recentFirstValue !== null && recent.length > 1 ? latestValue - recentFirstValue : null;
  const sinceFirst = latestValue !== null && firstValue !== null ? latestValue - firstValue : null;
  return `Take today's weight. Last 7 days: ${changeText(sevenDayChange, "kg")} · since first: ${changeText(sinceFirst, "kg")}.`;
}

async function waistMessage(userId: string, today: string) {
  const { data, error } = await db.from("body_waist_entries")
    .select("measurement_date, waist_cm")
    .eq("user_id", userId)
    .order("measurement_date", { ascending: true });
  if (error) throw error;
  const records = data || [];
  if (!records.length) return "Take this week's waist measurement to start your baseline.";
  const latest = records[records.length - 1];
  const first = records[0];
  const cutoff = shiftDateKey(today, -28);
  const recent = records.filter((record) => record.measurement_date >= cutoff && record.measurement_date <= today);
  const latestValue = numberValue(latest.waist_cm);
  const firstValue = numberValue(first.waist_cm);
  const recentFirstValue = recent.length ? numberValue(recent[0].waist_cm) : null;
  const fourWeekChange = latestValue !== null && recentFirstValue !== null && recent.length > 1 ? latestValue - recentFirstValue : null;
  const sinceFirst = latestValue !== null && firstValue !== null ? latestValue - firstValue : null;
  return `Take this week's waist measurement. Latest: ${latestValue?.toFixed(1) ?? "—"} cm · 4 weeks: ${changeText(fourWeekChange, "cm")} · since first: ${changeText(sinceFirst, "cm")}.`;
}

async function unfinishedMainWorkoutMessage(userId: string, today: string, dayNumber: number, timeZone: string) {
  const { data: mainRoutines, error: routineError } = await db.from("saved_workouts")
    .select("id, name, designated_days")
    .eq("user_id", userId)
    .eq("routine_role", "main");
  if (routineError) throw routineError;
  const scheduledRoutines = (mainRoutines || []).filter((routine) => Array.isArray(routine.designated_days)
    && routine.designated_days.includes(dayNumber));
  if (!scheduledRoutines.length) return null;

  const mainRoutineIds = (mainRoutines || []).map((routine) => routine.id);
  const tomorrow = shiftDateKey(today, 1);
  const { data: completed, error: historyError } = await db.from("workout_sessions")
    .select("routine_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .in("routine_id", mainRoutineIds)
    .gte("ended_at", zonedBoundaryIso(today, timeZone))
    .lt("ended_at", zonedBoundaryIso(tomorrow, timeZone))
    .limit(1);
  if (historyError) throw historyError;
  if (completed?.length) return null;

  const names = scheduledRoutines.map((routine) => routine.name).filter(Boolean);
  const summary = names.length === 1 ? `“${names[0]}”` : `${names.length} main workouts`;
  return `${summary} is scheduled today and has not been completed yet.`;
}

async function createAndSendNotification(userId: string, type: "weight" | "waist" | "workout" | "fitness", title: string, body: string, key: string, checkpointId: string | null = null) {
  const { data: subscriptions, error: subscriptionError } = await db.from("wellbeing_push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (subscriptionError) throw subscriptionError;
  if (!subscriptions?.length) return { created: false, delivered: 0 };

  const { data: notification, error: insertError } = await db.from("wellbeing_notifications")
    .insert({ user_id: userId, type, title, body, notification_key: key })
    .select("id")
    .single();
  if (insertError?.code === "23505") return { created: false, delivered: 0 };
  if (insertError) throw insertError;

  const payload = JSON.stringify({
    notificationId: notification.id,
    type,
    userId,
    checkpointId,
    title,
    body,
    tag: key,
    url: type === "weight"
      ? "./?weight=1"
      : (type === "waist" ? "./?waist=1" : type === "fitness" ? "./?body=1" : "./?notifications=1")
  });
  let delivered = 0;
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth }
      }, payload);
      delivered += 1;
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await db.from("wellbeing_push_subscriptions").delete().eq("id", subscription.id);
      } else {
        console.error("Wellbeing push delivery failed", error?.statusCode || error?.message || error);
      }
    }
  }
  return { created: true, delivered };
}

function fitnessMonthDate(anchor: string, monthOffset: number) {
  const [year, month, day] = anchor.split("-").map(Number);
  const index = year * 12 + month - 1 + monthOffset;
  const targetYear = Math.floor(index / 12);
  const targetMonth = index % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

function currentFitnessCheckpoint(anchorDate: string, results: any[], today: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(anchorDate)) return null;
  const firstYear = Number(anchorDate.slice(0, 4));
  const lastYear = Math.max(firstYear + 1, Number(today.slice(0, 4)) + 2);
  const completed = new Set(results.filter((record) => record?.status === "completed" && !record.deletedAt)
    .map((record) => record.checkpointId));
  const checks = [];
  for (let year = firstYear; year <= lastYear; year += 1) {
    const offset = (year - firstYear) * 12;
    const annualDate = fitnessMonthDate(anchorDate, offset);
    checks.push({ id: `${anchorDate}:${year}:annual`, kind: "yearly", dueDate: annualDate });
    checks.push({ id: `${anchorDate}:${year}:midyear`, kind: "midyear", dueDate: fitnessMonthDate(annualDate, 6) });
  }
  const overdueOrDue = checks.find((check) => check.dueDate <= today && !completed.has(check.id));
  if (overdueOrDue) return overdueOrDue;
  return checks.find((check) => check.dueDate > today && !completed.has(check.id)) || null;
}

async function fitnessReminderForUser(userId: string, today: string) {
  const { data, error } = await db.from("fitness_check_data")
    .select("anchor_date, results").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data?.anchor_date) return null;
  const check = currentFitnessCheckpoint(data.anchor_date, Array.isArray(data.results) ? data.results : [], today);
  if (!check) return null;
  const days = (Date.parse(`${check.dueDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000;
  if (days > 7) return null;
  const label = check.kind === "yearly" ? "Yearly" : "Midyear";
  const title = days < 0 ? `${label} fitness check overdue` : days === 0
    ? `${label} fitness check today` : `${label} fitness check in ${days} ${days === 1 ? "day" : "days"}`;
  const body = days < 0
    ? `Your ${label.toLowerCase()} fitness check is ${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} overdue. Complete it in Body → Configure fitness check.`
    : `Your ${label.toLowerCase()} fitness check is ${days === 0 ? "due today" : `due in ${days} ${days === 1 ? "day" : "days"}`}. Open Body → Configure fitness check.`;
  return { title, body, id: check.id };
}

async function dispatchScheduledNotifications(now = new Date()) {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) throw new Error("VAPID secrets are incomplete.");
  const { data: preferenceRows, error } = await db.from("wellbeing_notification_preferences")
    .select("user_id, enabled, weight_enabled, waist_enabled, workout_enabled, fitness_enabled, time_zone")
    .eq("enabled", true);
  if (error) throw error;

  let created = 0;
  let delivered = 0;
  for (const row of preferenceRows || []) {
    const preferences = preferencesFromRow(row);
    const parts = localParts(now, preferences.timeZone);
    const today = dateKey(parts);
    const dayNumber = new Date(`${today}T00:00:00Z`).getUTCDay();

    if (parts.hour === 7 && preferences.weightEnabled) {
      const result = await createAndSendNotification(
        row.user_id,
        "weight",
        "Time to take your weight",
        await weightMessage(row.user_id, today),
        `weight:${today}`
      );
      created += Number(result.created);
      delivered += result.delivered;
    }

    if (parts.hour === 8 && parts.weekday === "Mon" && preferences.waistEnabled) {
      const result = await createAndSendNotification(
        row.user_id,
        "waist",
        "Weekly waist measurement",
        await waistMessage(row.user_id, today),
        `waist:${today}`
      );
      created += Number(result.created);
      delivered += result.delivered;
    }

    if (parts.hour === 16 && preferences.workoutEnabled) {
      const body = await unfinishedMainWorkoutMessage(row.user_id, today, dayNumber, preferences.timeZone);
      if (body) {
        const result = await createAndSendNotification(
          row.user_id,
          "workout",
          "Your main workout is waiting",
          body,
          `workout:${today}`
        );
        created += Number(result.created);
        delivered += result.delivered;
      }
    }

    if (parts.hour === 19 && preferences.fitnessEnabled) {
      const reminder = await fitnessReminderForUser(row.user_id, today);
      if (reminder) {
        const result = await createAndSendNotification(
          row.user_id, "fitness", reminder.title, reminder.body, `fitness:${reminder.id}:${today}`, reminder.id
        );
        created += Number(result.created);
        delivered += result.delivered;
      }
    }
  }
  return { users: preferenceRows?.length || 0, created, delivered, checkedAt: now.toISOString() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    if (body.action === "dispatch") {
      if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) return json({ ok: false, error: "Unauthorized cron request." }, 401);
      return json({ ok: true, ...(await dispatchScheduledNotifications()) });
    }

    const user = await authenticatedUser(req);
    if (!user) return json({ ok: false, error: "Sign in is required." }, 401);

    if (req.method === "GET") return json({ ok: true, ...(await stateForUser(user.id)) });
    if (req.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

    if (body.action === "subscribe") {
      const subscription = body.subscription;
      const endpoint = typeof subscription?.endpoint === "string" ? subscription.endpoint : "";
      const p256dh = typeof subscription?.keys?.p256dh === "string" ? subscription.keys.p256dh : "";
      const auth = typeof subscription?.keys?.auth === "string" ? subscription.keys.auth : "";
      if (!endpoint || !p256dh || !auth) return json({ ok: false, error: "The browser subscription is incomplete." }, 400);
      const preferences = normalizePreferences({ ...body.preferences, enabled: true });
      const { error } = await db.from("wellbeing_push_subscriptions").upsert({
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
        user_agent: req.headers.get("user-agent") || ""
      }, { onConflict: "endpoint" });
      if (error) throw error;
      await savePreferences(user.id, preferences);
      return json({ ok: true, ...(await stateForUser(user.id)) });
    }

    if (body.action === "unsubscribe") {
      const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
      let query = db.from("wellbeing_push_subscriptions").delete().eq("user_id", user.id);
      if (endpoint) query = query.eq("endpoint", endpoint);
      const { error } = await query;
      if (error) throw error;
      await savePreferences(user.id, { ...body.preferences, enabled: false });
      return json({ ok: true, ...(await stateForUser(user.id)) });
    }

    if (body.action === "preferences") {
      await savePreferences(user.id, body.preferences);
      return json({ ok: true, ...(await stateForUser(user.id)) });
    }

    if (body.action === "test") {
      if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) throw new Error("VAPID secrets are incomplete.");
      const test = await createAndSendNotification(
        user.id,
        "workout",
        "Wellbeing test notification",
        "Notifications are working on this device.",
        `test:${Date.now()}:${crypto.randomUUID()}`
      );
      return json({ ok: true, test, ...(await stateForUser(user.id)) });
    }

    if (body.action === "read" || body.action === "clear") {
      const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === "string").slice(0, 200) : [];
      if (ids.length) {
        const { error } = await db.from("wellbeing_notifications")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .in("id", ids);
        if (error) throw error;
      }
      return json({ ok: true, ...(await stateForUser(user.id)) });
    }

    if (body.action === "read-all" || body.action === "clear-all") {
      const { data: preferenceData, error: preferenceError } = await db
        .from("wellbeing_notification_preferences")
        .select("time_zone")
        .eq("user_id", user.id)
        .maybeSingle();
      if (preferenceError) throw preferenceError;
      const timeZone = preferencesFromRow(preferenceData).timeZone;
      const today = dateKey(localParts(new Date(), timeZone));
      const tomorrow = shiftDateKey(today, 1);
      const { error } = await db.from("wellbeing_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false)
        .gte("created_at", zonedBoundaryIso(today, timeZone))
        .lt("created_at", zonedBoundaryIso(tomorrow, timeZone));
      if (error) throw error;
      return json({ ok: true, ...(await stateForUser(user.id)) });
    }

    return json({ ok: false, error: "Unknown notification action." }, 400);
  } catch (error: any) {
    console.error("wellbeing-push error", error);
    return json({ ok: false, error: error?.message || "The notification request failed." }, 500);
  }
});
