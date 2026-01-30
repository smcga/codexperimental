# Demoscene AI 2022 Demo

Single-page demoscene-style web demo built with Vite + TypeScript, Canvas 2D, and Web Audio API.

## Requirements

- Node.js 18+ recommended

## Audio + timeline configuration

- Place an MP3 at `public/song.mp3` (replace the placeholder file).
- Edit `public/timeline.json` to change the terminal intro script, section timings, transitions, or text cues. Use `mm:ss` or `mm:ss.s` time strings for section and cue start/end values (for example, `01:44.5`).
- The terminal intro runs from `00:00.0` until the `intro.end` value, and the first section must start at the same timestamp (currently `00:54.15`).
- Visuals include subtle camera zoom and panning that respond to audio energy.

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
- `D` to toggle the debug overlay (timestamp, transition selection, effect overrides, monochrome toggle)
