# AuraOS design language

AuraOS is the shared interface language established by Level90 and adapted here for Forge.

## Character

- Calm, luminous and focused rather than visually noisy.
- Deep Arctic teal backgrounds with broad, low-opacity ambient color drift.
- Translucent glass surfaces, fine borders and generous rounded corners.
- Compact uppercase kickers paired with strong, clean sans-serif headings.
- One dominant orb or halo moment per primary experience.
- Small, deliberate motion: breathing, drifting, morphing and short entrance transitions.

## Core palette

| Token | Dark | Light |
| --- | --- | --- |
| Background | `#193546` | `#e9f8fb` |
| Background depth | `#102c3d` | `#deeff8` |
| Accent | `#0DB8D3` | `#065B98` |
| Secondary accent | `#1B7FDC` | `#1B7FDC` |
| Highlight | `#78e2ef` | `#087d95` |
| Text | `#effcff` | `#193546` |
| Muted text | `#9bbec8` | `#597786` |

## Components

- App shell: centered, mobile-first and no wider than 760px.
- Header: compact brand or greeting with small translucent icon actions.
- Navigation: fixed four-destination floating glass dock with icon-first destinations and a soft active state; Settings is a compact header action.
- Panels: 20–28px radii, translucent fill, subtle border and deep soft shadow.
- Primary actions: accent gradient, 16–18px radius and restrained glow.
- Inputs: translucent inset surfaces with an accent focus halo.
- Status pills: rounded, compact and semantic without saturated blocks.
- Orb: layered irregular rings with slow independent movement; content stays crisp and centered.

## Workout adaptation

The active timer is Forge’s primary Aura orb. Setup, routines, recovery, trends and settings use the same glass hierarchy; the four primary destinations use floating navigation while Settings remains globally available in the header.

## Motion and accessibility

- Motion supports focus and state; it never delays interaction.
- `prefers-reduced-motion` disables ambient drift, halo morphing and breathing effects.
- Text and controls retain strong contrast in both appearance modes.
- Touch targets remain at least 42px and keyboard focus remains visible.

Version: AuraOS 1.0
