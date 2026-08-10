# Voice Workout

A mobile-first circuit workout timer built with plain HTML, CSS and JavaScript.

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
- Reorder saved workouts with Move Up / Move Down controls, with the custom order saved locally
- Resume an interrupted workout in a paused state
- Screen Wake Lock support where available
- Installable PWA with offline app-shell caching
- Responsive mobile layout

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

Use **Save workout** on the Setup screen to add the current routine to **Saved workouts**. Loading a saved routine lets you edit it and use **Save changes**, while **Save as new** creates a separate variation. Use **Move Up** and **Move Down** in the Saved workouts tab to arrange routines in your preferred order (for example Monday through Sunday). The custom order is preserved in `localStorage`, so it remains after closing or refreshing the app. All routines remain on the current browser and device.

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
- Individual history deletion and a clear-all option

Workout history is stored in `localStorage`, so it remains on the current browser and device.
