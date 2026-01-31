# Demoscene AI 2022 Demo

Single-page demoscene-style web demo built with Vite + TypeScript, Canvas 2D, and Web Audio API.

## Requirements

- Node.js 18+ recommended

## Audio + timeline configuration

- Place an MP3 at `public/song.mp3` (replace the placeholder file).
- Edit `public/timeline.json` to change the intro terminal script, section timings, transitions, or text cues. Use `mm:ss` or `mm:ss.s` time strings for section and cue start/end values (for example, `01:44.5`).
- Transition types include `fade`, `wipe`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `iris`, and `flash`.
- Effect sections can include a `params` object to tune effect-specific settings such as starfield speed, warp, or turning intensity.
- The `intro` block controls the terminal presentation from `t=0` until `intro.end`; the first section must start exactly at the same time so the colour pipeline can take over. Script events are time-coded, so you can align story lines with audio or prior text cue timings.
- Visuals include subtle camera zoom and panning that respond to audio energy.
- Post-intro effects render on a 16:9 base canvas; landscape uses letterboxing, while portrait screens scale to fill the height and crop the sides.

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
- `D` to toggle the debug overlay (timestamp, skip intro, transition selection, effect overrides, monochrome toggle)
- On touch devices, two floating buttons appear in the lower-right corner: `DBG` toggles the debug overlay and `⛶` toggles fullscreen.
