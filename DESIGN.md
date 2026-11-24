# Design System — Westside Doorstep

## Visual World

Anchored directly to the user's three editorial ink-line bungalow illustrations (`public/images/house-door-closed.jpg`, `public/images/house-door-open.jpg`, `public/images/inside-house.jpg`). The exterior opens on a seamless pure-white canvas (`#FFFFFF`) with deep navy-indigo ink (`#1B264F`) and terracotta (`#B84323`) roof accents; scrolling pulls the visitor through the front door into a sunlit cream living room (`#FAF4E3`) that remains fixed as the atmospheric backdrop behind the foreground rental listings sheet.

## Color Tokens (`src/web/styles/tokens.css`)

| Role | Token | Value | Usage |
| :--- | :--- | :--- | :--- |
| Exterior Ground | `--surface-exterior` | `#ffffff` | Seamless opening canvas matching exterior illustrations |
| Interior Ground | `--surface-interior` | `#faf4e3` | Sunlit cream wall tone, pills, and scrollbar track |
| Foreground Sheet | `--surface-sheet` | `rgba(255, 253, 247, 0.90)` | Listings workspace floating over the interior backdrop |
| Primary Ink | `--ink-primary` | `#1b264f` | Headings, body text, architectural borders & SVG strokes |
| Secondary Ink | `--ink-secondary` | `#3f4d73` | Supporting copy & inactive controls |
| Muted Ink | `--ink-muted` | `#56648a` | Hints, labels & metadata |
| Terracotta Accent | `--accent-terracotta` | `#b84323` | Primary CTA, active filter pills, focus rings & rent callouts |
| Honey Oak | `--accent-oak` | `#c47b3e` | Doorway & hardwood floor harmony |
| Sky Arch | `--accent-sky` | `#7eddf7` | Selection highlight & exterior sky motif |
| Leaf Green | `--accent-leaf` | `#2d7a28` | Active location indicator |

## Typography

- **Display:** `Bricolage Grotesque` (weights 600–800, tight tracking `-0.025em` to `-0.03em`) — warm architectural grotesque harmonizing with the bungalow's clean navy linework.
- **Body & Controls:** `Source Sans 3` (weights 400–700) — crisp UI legibility at all sizes.
- **Tabular Data:** `JetBrains Mono` (`font-variant-numeric: tabular-nums`) — reserved strictly for ZIP codes, date windows, and rent figures.

## Signature Motion

- **Scroll-Driven Threshold (`DoorThreshold.tsx`):** A `310vh` sticky scroll stage driving GPU-composited CSS custom properties via `requestAnimationFrame` (zero per-frame React re-renders).
  1. `0% → 22%`: Door closed on pure white; headline fades upward cleanly before zoom.
  2. `16% → 44%`: Pixel-aligned crossfade to `house-door-open.jpg` as the door swings inward and the camera gently approaches (`scale 1.0 → 1.34`, `transform-origin: 50% 64%`).
  3. `42% → 84%`: Camera glides through the open doorway (`scale 1.34 → 5.74`) into `inside-house.jpg`, which settles as a fixed full-viewport living room backdrop behind `ListingsStage`.
- **Accessibility:** Keyboard-focusable `Porch / Open Door / Inside` step rail + full `prefers-reduced-motion: reduce` fallback.

## Asset Provenance

- `public/images/house-door-closed.jpg`: User-supplied original illustration.
- `public/images/house-door-open.jpg`: User-supplied original illustration (`house_door_opened_inward_1795495008757.jpg`).
- `public/images/inside-house.jpg`: User-supplied original illustration.
