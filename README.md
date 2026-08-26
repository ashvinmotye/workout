# Forge

A mobile-first circuit workout timer built with plain HTML, CSS and JavaScript.

The interface uses **AuraOS**, the shared design language established by Level90: luminous depth, translucent surfaces, compact labels, floating navigation and a morphing halo/orb as the main focus element. See `AURAOS.md` for the reusable specification.

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
- Reorder saved workouts with Move Up / Move Down controls
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
- Two-card Recovery dashboard for today’s saved readiness and body-weight direction
- Live 0–100 readiness score with practical training guidance, the latest five check-ins, and paginated history
- Body-weight logging in kilograms with two-decimal 7-measurement and all-time changes plus a larger 30-entry trend chart
- Curated weight history showing today, seven preceding entries and the first measurement, with paginated full history
- Automatic cross-device sync for recovery check-ins and body-weight measurements
- Recovery and body-weight context inside overall Trends
- Per-session analysis with zone distribution and duration × RPE session load
- Same-routine comparison by stable routine identity, even after the routine is renamed
- Weekly and monthly session-load and average-RPE summaries
- Range-based overall load progression and aggregate heart-rate zone analysis
- Plain-language range interpretation and metric guidance for load, RPE, zones and comparisons
- Review coverage, four-week frequency, 30-day active days and completion rate
- Resume an interrupted workout in a paused state
- Screen Wake Lock support where available
- Installable PWA with offline app-shell caching
- Responsive mobile layout
- Fixed-size countdown orb and tabular timer digits that do not shift as values change
- Matching custom SVGs in navigation and individual screen heroes

## Forge icon and icon credits

Version 29 rebuilds the complete icon family around the supplied Fabric Design
System dumbbell. The mark uses AuraOS Arctic Depth cyan, blue and teal over a
deep blue-black forged panel, with the energy sweep retained as Forge's motion
cue. The rounded metallic frame follows the iOS Home Screen squircle so it is
not cropped into a watch-like bezel.

`icons/icon-source.svg` is the editable master and references the original
`icons/dumbbell-mark.svg`. The package includes 16, 32, and 48 px favicons, a
multi-size `.ico`, a versioned 180 px Apple Touch icon, and standard plus
maskable PWA icons at 192 and 512 px. Full generation details are recorded in
`FORGE-ICON.md`.

- Setup: [Iconsax](https://github.com/lusaxweb/iconsax), MIT License
- Routines: [Muhammad Tajudin](https://dribbble.com/tcodesign), CC Attribution
- Recovery: [Gabriele Malaspina](https://www.figma.com/@gabriele), public domain
- Trends: [Unicons](https://github.com/Iconscout/unicons), Apache License 2.0
- Settings: [Dmitriy Novikov](https://www.figma.com/@novaslide), CC Attribution
- Dark mode: [Circum Icons](https://github.com/Klarr-Agency/Circum-icons), Mozilla Public License 2.0
- Light mode: [Ligature Symbols](https://github.com/kudakurage/LigatureSymbols), SIL Open Font License
- App icon dumbbell: [Fabric Design System](https://github.com/fabric-ds/icons), MIT License

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

Use **Save workout** on the Setup screen to add the current routine to **Saved workouts**. Loading a saved routine lets you edit it and use **Save changes**, while **Save as new** creates a separate variation. Each library card shows the unique weights required by that routine using the same summary as **Suggested today**; routines without weights do not show an empty weight row. Use **Move Up** and **Move Down** to arrange the library, and **Schedule** to designate one or more weekdays plus a Pre-workout, Main workout or Post-workout order. Routines scheduled for the current day also appear in **Suggested today**, ordered Pre → Main → Post, while remaining in the full library. Schedules, routines and custom order are saved locally first and synchronized to the signed-in account, with offline changes queued for retry.

## Notes

- Browser voices vary by operating system and device, so the available choices will differ between phones and computers.
- On some mobile browsers, sound and speech begin only after the user taps Start or Test Voice.
- Screen Wake Lock is used only when supported by the browser.

## Trends and history

The **Trends** tab records completed workouts automatically. When ending a workout early, choose **Save session** to include the partial session in history or **Discard** to leave it out.

Trends includes:

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
- Long-duration formatting in hours and minutes throughout Trends
- Individual history deletion and a clear-all option

Workout history is stored locally first and synchronized to the signed-in Supabase account. Review edits use the same offline-first queue as new and deleted sessions.

Each new session stores the stable saved-routine ID used to start it while retaining `workout_name` as the historical name snapshot. Renaming a routine therefore does not break future previous-session comparisons. Older sessions are linked automatically only when the current name or exercise structure gives one unambiguous match; any remaining previous names can be reviewed manually in **Settings → Account**. Linking never rewrites the saved session name or workout details.

## Recovery and body weight

Open **Recovery** to record one check-in and one body-weight measurement per day. The readiness score combines five equally weighted signals: sleep quality, energy, muscle soreness, stress and training motivation. Soreness and stress are reverse-scored, so higher values lower readiness. The result is guidance rather than a medical diagnosis; use pain, illness and unusual symptoms as reasons to stop or seek appropriate care regardless of the score.

Recovery check-ins and body-weight entries are saved locally first. Create, edit and delete changes are queued while offline and synchronized automatically after reconnection. The Recovery dashboard shows today’s saved readiness score alongside body-weight changes across the latest seven measurements and since the first measurement. The full-width weight section includes the latest 30 measurements in its chart, while the history preview shows today, seven preceding entries and the first entry without duplicates. Readiness shows the latest five check-ins. Each history can be opened in a complete list with up to 50 records per page. Trends adds the latest readiness, 7-day readiness average, latest weight and available 30-day weight change.

## Backup and restore

Open Settings from the header beside the light/dark toggle, then use **Export JSON** to download a complete backup. The file includes the current workout draft, saved routines, designated weekdays and custom order, workout history and routine links, theme, the currently loaded routine, and any resumable session.

Use **Import JSON** to restore a backup. The app validates the file and shows its saved-workout and session counts before asking for confirmation. Import replaces the Workout data stored on the current browser or device.

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

Before using Recovery sync for the first time, run `20260820_create_recovery_and_body_weight.sql` in the Supabase SQL Editor. The migration creates the two per-user tables, conflict-safe update triggers, indexes and Row Level Security policies. Existing workout sessions and routines are not changed.

Before using routine schedules or stable cross-device comparisons, run `20260820_add_routine_scheduling_and_identity.sql`. It is additive: it adds schedule metadata to `saved_workouts`, a nullable `routine_id` to `workout_sessions`, validation checks and an index. It does not drop tables, delete rows, rename snapshots or attach a cascading foreign key.

For the first account test, use an email address that belongs to a member of the Supabase organization. Supabase's built-in test email service only sends authentication messages to project members. Configure custom SMTP later before inviting other users.
