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

Use **Save workout** on the Setup screen to add the current routine to **Saved workouts**. Loading a saved routine lets you edit it and use **Save changes**, while **Save as new** creates a separate variation. All routines remain on the current browser and device because they are stored with `localStorage`.

## Notes

- Browser voices vary by operating system and device, so the available choices will differ between phones and computers.
- On some mobile browsers, sound and speech begin only after the user taps Start or Test Voice.
- Screen Wake Lock is used only when supported by the browser.
