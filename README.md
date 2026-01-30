# Demoscene AI 2022 Demo

Single-page demoscene-style web demo built with Vite + TypeScript, Canvas 2D, and Web Audio API.

## Requirements

- Node.js 18+ recommended

## Run

```bash
npm install
npm run dev
```

## Configuration

- `public/timeline.json` drives audio source, section timings, transitions, and text cues.
- Place your MP3 at `public/song.mp3` (or update `audio.src` in the JSON). A placeholder file is committed so you can drop in your own track.

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
