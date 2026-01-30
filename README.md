# Demoscene AI 2022 Demo

Single-page demoscene-style web demo built with Vite + TypeScript, Canvas 2D, and Web Audio API.

## Requirements

- Node.js 18+ recommended

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

## Timeline + Audio Config

- Edit `public/timeline.json` to adjust audio source, sections, transitions, and text cues.
- Place your MP3 at `public/song.mp3` (the repo ships with an empty placeholder file that must be replaced).

### Timeline schema (summary)

- `audio`: `{ src: string, offset?: number }`
- `sections`: array of 16 entries with `id`, `start`, optional `end`, `effect`, optional `transition`, and optional `params`
- `textCues`: array of cues with `id`, `start`, optional `end`, and either `text` or `spans`
