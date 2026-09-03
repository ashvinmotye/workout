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
  const [{ data: preferenceData, error: preferenceError }, { data: notifications, error: notificationError }] = await Promise.all([
    db.from("wellbeing_notification_preferences").select("enabled, weight_enabled, waist_enabled, workout_enabled, time_zone").eq("user_id", userId).maybeSingle(),
    db.from("wellbeing_notifications").select("id, type, title, body, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(200)
  ]);
  if (preferenceError) throw preferenceError;
  if (notificationError) throw notificationError;
  return {
    preferences: preferencesFromRow(preferenceData),
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
  const { data: routines, error: routineError } = await db.from("saved_workouts")
    .select("id, name")
    .eq("user_id", userId)
    .eq("routine_role", "main")
    .contains("designated_days", [dayNumber]);
  if (routineError) throw routineError;
  if (!routines?.length) return null;

  const routineIds = routines.map((routine) => routine.id);
  const tomorrow = shiftDateKey(today, 1);
  const { data: completed, error: historyError } = await db.from("workout_sessions")
    .select("routine_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .in("routine_id", routineIds)
    .gte("ended_at", zonedBoundaryIso(today, timeZone))
    .lt("ended_at", zonedBoundaryIso(tomorrow, timeZone))
    .limit(1);
  if (historyError) throw historyError;
  if (completed?.length) return null;

  const names = routines.map((routine) => routine.name).filter(Boolean);
  const summary = names.length === 1 ? `“${names[0]}”` : `${names.length} main workouts`;
  return `${summary} is scheduled today and has not been completed yet.`;
}

async function createAndSendNotification(userId: string, type: "weight" | "waist" | "workout", title: string, body: string, key: string) {
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
    title,
    body,
    tag: key,
    url: "./?notifications=1"
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

async function dispatchScheduledNotifications(now = new Date()) {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) throw new Error("VAPID secrets are incomplete.");
  const { data: preferenceRows, error } = await db.from("wellbeing_notification_preferences")
    .select("user_id, enabled, weight_enabled, waist_enabled, workout_enabled, time_zone")
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

    if (body.action === "clear") {
      const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === "string").slice(0, 200) : [];
      if (ids.length) {
        const { error } = await db.from("wellbeing_notifications").delete().eq("user_id", user.id).in("id", ids);
        if (error) throw error;
      }
      return json({ ok: true, ...(await stateForUser(user.id)) });
    }

    if (body.action === "clear-all") {
      const { error } = await db.from("wellbeing_notifications").delete().eq("user_id", user.id);
      if (error) throw error;
      return json({ ok: true, ...(await stateForUser(user.id)) });
    }

    return json({ ok: false, error: "Unknown notification action." }, 400);
  } catch (error: any) {
    console.error("wellbeing-push error", error);
    return json({ ok: false, error: error?.message || "The notification request failed." }, 500);
  }
});
