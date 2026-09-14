# Wellbeing icon

Version 42 uses the supplied heart-and-check artwork as Wellbeing's complete
install icon family. The icon uses the current `#191919` background with white
artwork. The supplied SVG is the canonical scalable source, while the supplied
192px and 512px PNGs are preserved unchanged as the standard PWA icons.

## Source

- `icons/wellbeing-icon.svg` — exact supplied 512 × 512 vector source
- `icons/icon-source.png` — 2048 × 2048 vector-derived PNG master

## Included icon matrix

- `icons/forge-icon-master.png` — 1024 × 1024 rendered compatibility master
- `icons/apple-touch-icon-v42.png` — versioned 180 × 180 Apple Touch icon
- `icons/apple-touch-icon.png` — matching compatibility copy
- `icons/icon-192.png` and `icons/icon-512.png` — standard PWA icons
- `icons/icon-maskable-192.png` and `icons/icon-maskable-512.png` — maskable PWA icons with centered safe-area padding
- `icons/favicon-16.png`, `icons/favicon-32.png`, and `icons/favicon-48.png`
- `icons/favicon.ico` — combined 16, 32 and 48px favicon

Apple and maskable icons are opaque sRGB images. Standard icons and favicons
retain the supplied transparent rounded corners. Maskable icons place a 90%
copy on a full `#191919` field so launcher masks cannot crop the heart or check.
