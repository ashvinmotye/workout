# Wellbeing

A mobile-first physical-wellbeing app built with plain HTML, CSS and JavaScript. **Forge** remains the training system inside the broader app, alongside body measurements, recovery and whole-picture progress.

The interface uses **AuraOS**, the shared design language established by Level90: luminous depth, translucent surfaces, compact labels, floating navigation and a morphing halo/orb as the main focus element. See `AURAOS.md` for the reusable specification.

## Version 35 reliable mobile sorting

- Moves active drag tracking to document-level pointer listeners so the card continues to follow the finger outside the handle and between cards.
- Adds an explicit touch-event fallback for browsers without Pointer Events, plus mouse fallback for desktop.
- Removes pointer capture from sorting and prevents SVG paths or exercise numbers from intercepting the handle press.
- Extends the three reorder bars across most of the icon and increases the visible icon to 30px inside the existing 48px touch area.
- Advances the offline app-shell cache and asset URLs to Version 35.

### Upgrade from Version 34

Replace the hosted PWA files with this package, then fully close and reopen the installed app once while online. No Supabase deployment, SQL, secret or Cron change is required.

## Version 34 touch sorting + notification test

- Adds **Send test notification** under Settings → Notifications. It uses the deployed Edge Function and the current Web Push subscription, and the test remains in the notification centre until cleared.
- Fixes Forge and Routines touch sorting by calculating the drop position from card midpoints instead of pointer hit-testing.
- Enlarges exercise and routine drag handles to 48px-high touch areas.
- Shows expanded routine exercises as a vertical list, one exercise per line.
- Reduces mobile form controls to a compact 38px height, tightens field gaps and reduces exercise-card padding while retaining 16px text to prevent iPhone input zoom.
- Advances the offline app-shell cache and asset URLs to Version 34.

### Upgrade from Version 33

1. Replace the deployed `wellbeing-push` Edge Function with `supabase/functions/wellbeing-push/index.ts`. Keep **Verify JWT disabled**.
2. Replace the hosted PWA files with this package, then open or refresh the installed PWA once while online.
3. In Settings → Notifications, tap **Send test notification**.

No SQL migration, secret change or Cron change is required for this version.

## Version 33 compact routines + notifications

- Replaces the large routine action grid with one **Load** button and a compact overflow menu for Schedule, Rename, Duplicate and Delete.
- Replaces routine and exercise arrow controls with touch-friendly drag handles. The new order remains local-first and synchronizes through the existing routine sync.
- Adds **Show all exercises / Show fewer exercises** to routine cards instead of permanently truncating the exercise list.
- Uses bin icons for destructive item actions while retaining X only for close/end actions.
- Makes mobile exercise and workout inputs denser while preserving 44px touch targets.
- Moves Voice and cues from Forge/Home to Settings.
- Adds Level90-style persistent notification history with a header bell, count badge, individual clear and Clear all. A disabled bell opens notification Settings.
- Adds a daily 07:00 weight reminder with last-7-days and since-first summaries, a Monday 08:00 waist reminder with available trend data, and a 16:00 reminder only when a scheduled Main workout has not been completed.
- Changes the header line to **MOVE · BUILD · ASCEND**.
- Removes the custom Install button and prompt interception so browser and operating-system Add to Home Screen flows remain native.
- Advances the offline app-shell cache and asset URLs to Version 33.

### Upgrade notification infrastructure

1. Run `supabase/migrations/20260903_create_wellbeing_notifications.sql` once in the Supabase SQL Editor. It adds only notification preferences, subscriptions and notification-history tables with per-user security.
2. In **Supabase → Edge Functions**, create or replace `wellbeing-push` with `supabase/functions/wellbeing-push/index.ts`. Deploy it with **Verify JWT disabled**: the function validates signed-in users itself, while scheduled dispatches are protected by `x-cron-secret`.
3. Reuse the existing Level90 secrets in this Supabase project: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` and `CRON_SECRET`.
4. In **Supabase → Integrations → Cron**, schedule the function every 15 minutes. Use the actual value of `CRON_SECRET` for the header—not the words `CRON_SECRET`:

```sql
select cron.schedule(
  'wellbeing-push-quarter-hour',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://xacwgipxqujbqvhzogbd.supabase.co/functions/v1/wellbeing-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'YOUR_ACTUAL_CRON_SECRET_VALUE'
    ),
    body := '{"action":"dispatch"}'::jsonb
  ) as request_id;
  $$
);
```

5. Replace the deployed PWA files with this package, then open or refresh the installed PWA once while online. Enable the three reminder types under **Settings → Notifications**.

The dispatcher reads the browser's IANA time zone saved when notifications are enabled, so the stated times are local. The 15-minute job can safely run throughout each reminder hour because the database key permits only one notification of each type per user and date.

## Version 32 Wellbeing + waist progress

- Renames the user-facing app and PWA from **Forge** to **Wellbeing** while retaining Forge as the training module.
- Keeps existing local-storage keys, workout history, routines, recovery check-ins and body-weight records intact.
- Renames the primary navigation to **Forge**, **Routines**, **Body** and **Progress**.
- Adds weekly waist-circumference logging in centimetres with a saved measurement method, notes, editing, deletion and paginated history.
- Adds a three-card Body dashboard for readiness, weight direction and weekly waist direction, including an in-app due/overdue state.
- Adds a waist trend chart, four-week change, since-first change and a consistent-measurement guide.
- Adds a four-signal Progress Profile combining weight, waist, Zone 2 time and completed weighted sets.
- Keeps waist change separate from Spider-Man phase advancement: it is a health-progress signal, not a training gate.
- Adds offline-first Supabase synchronization, JSON backup/restore and Settings counts for waist measurements.
- Includes the additive `20260827_create_body_waist_entries.sql` migration with per-user Row Level Security.

### Upgrade from the current Forge build

1. Run only `supabase/migrations/20260827_create_body_waist_entries.sql` in the existing Supabase project's SQL Editor. The earlier migrations do not need to be rerun when Recovery and body-weight sync already work.
2. Replace the deployed Forge app files with this package. Existing browser data remains available because the established `voiceWorkout.*` storage keys are intentionally unchanged.
3. Open or refresh the installed PWA once while online so the Version 32 app shell is cached. Previous Forge and Voice Workout JSON backups remain importable.

## Version 31 supplied Forge icon

- Replaces the complete install-icon family with the supplied navy dumbbell artwork.
- Preserves the original 2048px PNG as `icons/icon-source.png` and derives the standard PWA, Apple Touch, favicon PNG and multi-size `.ico` assets from it.
- Adds restrained centered padding only to the Android maskable variants so launcher crops cannot clip the dumbbell.
- Advances the Apple Touch filename and offline app-shell cache to Version 31 so installed copies request the new icon.
- Requires only the updated PWA files; there is no Supabase migration or Edge Function deployment for this version.

## Included

- Setup and active-workout screens
- Rep-based and timed exercises
- Per-exercise rest and between-round rest
- Voice guidance using the browser Speech Synthesis API
- Voice selector populated from the voices available on the user’s browser and device
- Light and dark mode toggle with the chosen theme saved locally
- Optional spoken 3-2-1 countdown
- Transition sounds
- Pause, resume, previous and skip controls
- Large `Done` button for rep-based exercises
- Local storage for the current workout draft
- Saved workout library for loading routines on another day
- Rename, duplicate, update and delete saved workouts
- Reorder saved workouts with drag and drop
- Assign any saved routine to multiple weekdays and see today’s routines in **Suggested today**
- See the unique required weights for each routine in both **Suggested today** and the full **Routines Library**
- Four-item bottom navigation with Settings available beside the appearance toggle in the header
- Settings page with full JSON export and validated JSON import
- Supabase email/password account creation and sign-in
- Persistent authenticated sessions with a current-device sign-out control
- Previously authenticated devices retain access to local workout data while offline
- Automatic cloud sync for newly completed workout sessions
- Cloud history download when the same account signs in on another device
- Offline history-operation queue with automatic retry after reconnection
- One-time migration control for uploading existing local workout history
- Automatic saved-routine CRUD and custom-order sync with offline retry
- One-time migration control for uploading existing local routines
- Silent history and routine refresh when the app opens, returns to the foreground, regains focus or reconnects
- Optional post-workout review for RPE, heart-rate zone minutes and session notes
- Heart-rate zone entry in `minutes.seconds` format (`7.1` = 7m 01s, `4.32` = 4m 32s)
- Daily Recovery Readiness check-ins using sleep, energy, soreness, stress and motivation
- Three-card Body dashboard for today’s saved readiness, body-weight direction and weekly waist direction
- Live 0–100 readiness score with practical training guidance, the latest five check-ins, and paginated history
- Body-weight logging in kilograms with two-decimal 7-measurement and all-time changes plus a larger 30-entry trend chart
- Weekly waist logging in centimetres with 4-week and all-time changes plus a 30-entry trend chart
- Curated weight history showing today, seven preceding entries and the first measurement, with paginated full history
- Automatic cross-device sync for recovery check-ins, body-weight and waist measurements
- Four-signal Progress Profile for weight, waist, Zone 2 time and weighted strength work
- Per-session analysis with zone distribution and duration × RPE session load
- Same-routine comparison by stable routine identity, even after the routine is renamed
- Weekly and monthly session-load and average-RPE summaries
- Range-based overall load progression and aggregate heart-rate zone analysis
- Plain-language range interpretation and metric guidance for load, RPE, zones and comparisons
- Review coverage, four-week frequency, 30-day active days and completion rate
- Resume an interrupted workout in a paused state
- Screen Wake Lock support where available
- Installable PWA with native browser Add to Home Screen and offline app-shell caching
- Responsive mobile layout
- Fixed-size countdown orb and tabular timer digits that do not shift as values change
- Matching custom SVGs in navigation and individual screen heroes

## Forge icon and icon credits

Version 31 rebuilds the complete icon family from the supplied navy dumbbell
artwork. `icons/icon-source.png` preserves the exact original 2048px source.
The package includes 16, 32, and 48px favicons, a multi-size `.ico`, a
versioned 180px Apple Touch icon, and standard plus safely padded maskable PWA
icons at 192 and 512px. Full generation details are recorded in
`FORGE-ICON.md`.

- Setup: [Iconsax](https://github.com/lusaxweb/iconsax), MIT License
- Routines: [Muhammad Tajudin](https://dribbble.com/tcodesign), CC Attribution
- Recovery: [Gabriele Malaspina](https://www.figma.com/@gabriele), public domain
- Trends: [Unicons](https://github.com/Iconscout/unicons), Apache License 2.0
- Settings: [Dmitriy Novikov](https://www.figma.com/@novaslide), CC Attribution
- Dark mode: [Circum Icons](https://github.com/Klarr-Agency/Circum-icons), Mozilla Public License 2.0
- Light mode: [Ligature Symbols](https://github.com/kudakurage/LigatureSymbols), SIL Open Font License

## Run locally

Service workers require an HTTP server. From this folder, run one of the following:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Deploy to GitHub Pages

Place all files from this folder directly in the repository root, commit them, and configure GitHub Pages to deploy from the root of the selected branch.

The project uses only relative paths, so it also works when deployed under a repository subpath.

## Saved workouts

Use **Save workout** on the Setup screen to add the current routine to **Saved workouts**. Loading a saved routine lets you edit it and use **Save changes**, while **Save as new** creates a separate variation. Each library card shows the unique weights required by that routine using the same summary as **Suggested today**; routines without weights do not show an empty weight row. Drag a routine by its handle to arrange the library, use **Show all exercises** when needed, and open the overflow menu to designate one or more weekdays plus a Pre-workout, Main workout or Post-workout order. Routines scheduled for the current day also appear in **Suggested today**, ordered Pre → Main → Post, while remaining in the full library. Schedules, routines and custom order are saved locally first and synchronized to the signed-in account, with offline changes queued for retry.

## Notes

- Browser voices vary by operating system and device, so the available choices will differ between phones and computers.
- On some mobile browsers, sound and speech begin only after the user taps Start or Test Voice.
- Screen Wake Lock is used only when supported by the browser.

## Progress and history

The **Progress** tab records completed Forge workouts automatically. When ending a workout early, choose **Save session** to include the partial session in history or **Discard** to leave it out.

Progress includes:

- A four-signal profile for body weight, waist circumference, Zone 2 time and completed weighted sets

- This-week and this-month summaries
- Training-minute charts for 7 days, 30 days, 90 days, or all history
- Current and longest workout streaks
- Most active training day
- Exercise-specific targets, completed sets, and recent sessions
- Detailed workout history with completed and ended-early status
- Per-session RPE, session load, heart-rate zone distribution and notes
- Previous-session comparison for duration, completed work, round completion, RPE, load and high-intensity share
- Context-aware comparison explanations that distinguish added work from changes in internal effort
- An editable Session review on the completion screen and every history card
- Weekly and monthly load plus average RPE
- Overall load charts and aggregate zone distributions for 7D, 30D, 90D and all history
- Review coverage and expanded consistency metrics
- Long-duration formatting in hours and minutes throughout Progress
- Individual history deletion and a clear-all option

Workout history is stored locally first and synchronized to the signed-in Supabase account. Review edits use the same offline-first queue as new and deleted sessions.

Each new session stores the stable saved-routine ID used to start it while retaining `workout_name` as the historical name snapshot. Renaming a routine therefore does not break future previous-session comparisons. Older sessions are linked automatically only when the current name or exercise structure gives one unambiguous match; any remaining previous names can be reviewed manually in **Settings → Account**. Linking never rewrites the saved session name or workout details.

## Body measurements and recovery

Open **Body** to record recovery readiness, body weight and waist circumference. Weight may be logged regularly; waist is designed as a weekly signal and the dashboard shows when the next measurement is due. The waist form saves either the rib–hip midpoint or navel method with each entry so the user can keep the trend consistent.

The readiness score combines five equally weighted signals: sleep quality, energy, muscle soreness, stress and training motivation. Soreness and stress are reverse-scored, so higher values lower readiness. The result is guidance rather than a medical diagnosis; use pain, illness and unusual symptoms as reasons to stop or seek appropriate care regardless of the score.

Recovery, weight and waist entries are saved locally first. Create, edit and delete changes are queued while offline and synchronized automatically after reconnection. Weight and waist each provide 30-entry charts, curated history previews and complete paginated histories. Progress reads the four official signals together; it does not use waist change as a Spider-Man phase requirement.

## Backup and restore

Open Settings from the header beside the light/dark toggle, then use **Export JSON** to download a complete backup. The file includes the current workout draft, saved routines, designated weekdays and custom order, workout history and routine links, theme, the currently loaded routine, and any resumable session.

Use **Import JSON** to restore a backup. The app validates the file and shows its routine, session, recovery, weight and waist counts before asking for confirmation. Version 32 continues to accept previous Forge and Voice Workout backups; missing waist history is treated as an empty list. Import replaces the Wellbeing data stored on the current browser or device.

## Supabase authentication

The app uses Supabase email/password authentication. Create an account from the opening screen, confirm the email if required, and return to sign in. The browser stores the authenticated session so the app remains signed in between launches. **Settings → Account** shows the current email and provides a current-device sign-out action.

Newly completed workout sessions are saved locally first and then synchronized to the Supabase `workout_sessions` table. Signing into the same account on another device downloads cloud sessions and merges them into that device's local history. Individual history deletion and **Clear all** are also synchronized, with offline changes queued for retry.

Existing sessions that predate cloud sync remain local until **Settings → Account → Upload existing history** is confirmed. The app counts only sessions that are not already in Supabase, keeps their existing IDs to prevent duplicates, marks every successful upload immediately, and queues interrupted uploads for automatic retry.

Saved workout changes—including create, edit, rename, duplicate, delete and custom order—synchronize through the `saved_workouts` table. Existing routines remain local until **Settings → Account → Upload existing routines** is confirmed. When two devices save the same routine, the change with the latest client update timestamp wins; the database prevents an older delayed upsert from replacing it.

Supabase API responses bypass the PWA cache so every sync reads the current database state. The app also distinguishes a successful upload from a routine observed in a completed cloud pull, preventing a stale or delayed empty response from being mistaken for a remote deletion.

Authenticated devices automatically refresh workout history and saved routines when the app opens, returns to the foreground, regains focus or reconnects. Closely spaced lifecycle events are combined into one refresh, and the manual sync buttons remain available as a fallback.

The current workout draft, preferences and active workout session remain device-local during this milestone.

The reproducible table definitions and Row Level Security policies are stored in:

- `supabase/migrations/20260816_create_workout_sessions.sql`
- `supabase/migrations/20260816220000_create_saved_workouts.sql`
- `supabase/migrations/20260820_create_recovery_and_body_weight.sql`
- `supabase/migrations/20260820_add_routine_scheduling_and_identity.sql`
- `supabase/migrations/20260827_create_body_waist_entries.sql`
- `supabase/migrations/20260903_create_wellbeing_notifications.sql`

Before using Recovery sync for the first time, run `20260820_create_recovery_and_body_weight.sql` in the Supabase SQL Editor. The migration creates the two per-user tables, conflict-safe update triggers, indexes and Row Level Security policies. Existing workout sessions and routines are not changed.

Run `20260827_create_body_waist_entries.sql` after the existing Recovery/body-weight migration. It creates only the new waist table, trigger, index, grants and per-user Row Level Security policies. It does not alter or delete any existing data.

Before using routine schedules or stable cross-device comparisons, run `20260820_add_routine_scheduling_and_identity.sql`. It is additive: it adds schedule metadata to `saved_workouts`, a nullable `routine_id` to `workout_sessions`, validation checks and an index. It does not drop tables, delete rows, rename snapshots or attach a cascading foreign key.

For the first account test, use an email address that belongs to a member of the Supabase organization. Supabase's built-in test email service only sends authentication messages to project members. Configure custom SMTP later before inviting other users.
