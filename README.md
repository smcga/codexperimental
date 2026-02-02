# Demoscene AI 2022 Demo

Single-page demoscene-style web demo built with Vite + TypeScript, Canvas 2D, and Web Audio API.

## Requirements

- Node.js 18+ recommended

## Audio + timeline configuration

- Place an MP3 at `public/song.mp3` (replace the placeholder file).
- Edit `public/timeline.json` to change the intro terminal script, section timings, transitions, or text cues. Use `mm:ss` or `mm:ss.s` time strings for section and cue start/end values (for example, `01:44.5`).
- `public/timeline.release.json` is a release-cut timeline that adds per-section era presets and a curated arc for the graphics-history progression. Load it with the release URL flag described below.
- The bundled timeline includes lyric-style overlays in `textCues`; adjust or replace those cues to change the on-screen callouts synced to the music.
- Transition types include `fade`, `wipe`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `iris`, and `flash`.
- Effect sections can include a `params` object to tune effect-specific settings such as starfield speed, warp, or turning intensity.
- Effects can animate numeric params with an `automation` array on a section or a layer; entries are applied in array order (last wins) and ease over absolute demo time.
- Sections can optionally define `layers` to mix multiple effects together, with `blend` modes like `screen` or `overlay` and per-layer `opacity`.
- The timeline includes two 3D showcase effects: `proper3d` (perspective projection + lighting) and `fake3d` (2D skew/shading tricks). The `sphere3d` effect renders a rotating lit point sphere with orbiting satellites.
- The `spherecloud` effect renders a glowing point-cloud sphere with subtle audio-reactive rotation and lighting.
- The `infinitycloud` effect renders a glowing point-cloud infinity loop with audio-reactive pulses and lighting.
- The `flyover` effect renders a sky/sea flythrough with distant islands; tune `params` like `speed`, `horizon`, `seaDetail`, `islandSeed`, and `palette`.
- The `synthwaveSunset` effect renders an outrun sunset with a striped sun, neon sky, and reflective sea; tune `params` like `horizon`, `sunRadius`, `stripeHeight`, `stripeGap`, and `seaSpeed`.
- The `rain` effect renders layered rain streaks with wind drift and optional splashes, with denser, smaller, faster defaults; tune `params` like `intensity`, `wind`, `speed`, `streakLength`, `splash`, `hue`, and `seed`.
- The `lightning` effect renders brief flash overlays with optional bolt branches; tune `params` like `trigger`, `chancePerSecond`, `cooldown`, `flashDuration`, `bolt`, `branches`, and `seed`.
- The `chess` effect renders a deterministic, self-playing chess match driven by the timeline; tune pacing with `params.speed` or anchor with `params.startTime`.
- The `gl_fractal_tunnel` effect renders a WebGL2 raymarched tunnel with audio-reactive pulses and bloom; tune `params` like `quality`, `warp`, `hueShift`, `exposure`, and `seed`. It falls back to the `tunnel` effect when WebGL2 is unavailable.
- The `physics_pile` effect simulates a stack of 2D rigid bodies; tune `params` like `count`, `restitution`, `friction`, `gravity`, `beatImpulse`, `spawnMode`, `trail`, `seed`, `wreckingCue` (swings in a heavy ball), and `shatter` (freezes and dissolves the stack into particles).
- The `gl_impossible_corridor` effect renders a WebGL2 raymarched impossible corridor with bass-driven breathing, beat kicks, and treble shimmer; tune `params` like `quality`, `warp`, `hueShift`, `exposure`, `seed`, and `speed`. It falls back to the `tunnel` effect when WebGL2 is unavailable.
- The `portrait` effect pulls in `img/94B53814-80C3-4851-A6D3-A590FBB6022F.png` for a full-frame image glow; replace that file if you want a different portrait.
- The `intro` block controls the terminal presentation from `t=0` until `intro.end`; the first section must start exactly at the same time so the colour pipeline can take over. Script events are time-coded, so you can align story lines with audio or prior text cue timings.
- Visuals include subtle camera zoom and panning that respond to audio energy.
- Post-intro effects render on a 16:9 base canvas; landscape uses letterboxing, while portrait screens scale to fill the height and crop the sides.
- Append `?release=1` to the URL to load the release timeline and disable the debug overlay/keybinds.

Automation example:

```json
{
  "effect": "tunnel",
  "params": { "speed": 1.15 },
  "automation": [
    { "param": "speed", "from": 1.15, "to": 1.55, "t0": 122.0, "t1": 127.0, "ease": "easeInOutQuad" }
  ]
}
```

Automation supports numeric params only; non-numeric values fall back to the base params.

### Effect catalog

Each timeline section `effect` maps to one of the entries below. Include any of the parameters in a section `params` object; omit or set to defaults to use the built-in values.

| Effect | Parameters | Notes |
| --- | --- | --- |
| `starfield` | `speed`, `warp`, `turnRate`, `turnStrength` | Warp/turn adjust the starfield flight feel. |
| `plasma` | `speed` |  |
| `tunnel` | `speed` |  |
| `rotozoom` | `speed` |  |
| `blobs` | None |  |
| `ribbons` | None |  |
| `lissajous` | None |  |
| `glitch` | None |  |
| `bokeh` | None |  |
| `fractal` | None |  |
| `feedback` | None |  |
| `equalizer` | None |  |
| `isogrid` | None |  |
| `neon` | None |  |
| `particles` | None |  |
| `finale` | None |  |
| `proper3d` | `speed` |  |
| `fake3d` | `speed` |  |
| `portrait` | `zoom`, `drift` |  |
| `sphere3d` | `speed` |  |
| `spherecloud` | `speed` |  |
| `infinitycloud` | `speed` |  |
| `chess` | `speed`, `showHighlights`, `startTime` |  |
| `flyover` | `speed`, `horizon`, `seaDetail`, `waveSpeed`, `waveIntensity`, `islandCount`, `islandSeed`, `fog`, `palette`, `audioReactive` | `palette` supports `day`, `sunset`, `night`. |
| `gl_fractal_tunnel` | `quality`, `warp`, `hueShift`, `exposure`, `seed` | Falls back to `tunnel` when WebGL2 is unavailable. |
| `physics_pile` | `count`, `restitution`, `friction`, `gravity`, `beatImpulse`, `spawnMode`, `trail`, `seed`, `wreckingCue`, `shatter` | `spawnMode` supports `pile` or `rain`. |
| `gl_impossible_corridor` | `quality`, `warp`, `hueShift`, `exposure`, `seed`, `speed`, `internalScale` | Falls back to `tunnel` when WebGL2 is unavailable. |
| `synthwaveSunset` | `horizon`, `sunRadius`, `stripeHeight`, `stripeGap`, `seaSpeed`, `starCount`, `glow`, `scanlines`, `audioReactive` |  |
| `rain` | `intensity`, `wind`, `speed`, `streakLength`, `splash`, `hue`, `seed` |  |
| `lightning` | `trigger`, `chancePerSecond`, `cooldown`, `flashDuration`, `bolt`, `branches`, `seed` | `trigger` supports `beat`, `random`, `both`. |

## Run

```bash
npm install
npm run dev
```

## Test

```bash
npm run test
```

## Build

```bash
npm run build
npm run preview
```

## Controls

- Click to start (audio + visuals)
- `R` to restart
- `F` to toggle fullscreen (if supported)
- `D` to toggle the debug overlay (timestamp, skip intro, skip to second half, transition selection, effect overrides, monochrome toggle)
- The debug overlay shows WebGL status as `OK` or `FALLBACK` when available.
- When the debug overlay is visible, selecting an effect reveals a secondary panel with effect-specific controls (or a note when none are available).
- On touch devices, two floating buttons appear in the lower-right corner: `DBG` toggles the debug overlay and `⛶` toggles fullscreen.
