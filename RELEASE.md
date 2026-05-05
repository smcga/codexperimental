# Codexperimental: AI Can Do This

Codexperimental is an AI-assisted real-time web demo. It explores whether modern code-generation tools can contribute to demoscene craft without hiding the human direction, editing, timing, integration, and curation required to make a finished production.

It is not a video render. Visuals are generated at runtime from TypeScript, Canvas 2D, WebGL2, timeline data, and audio analysis.

## Why this is a demo

This is a real-time audiovisual program. The release is driven by a fixed soundtrack, a locked timeline, procedural visual effects, transitions, text cues, and documented musical anchors.

The canonical release timeline is `public/timeline.release.json`.

## Release constraints

- All visuals run in real time in the browser.
- No pre-rendered video.
- No external rendering engine such as Three.js, Pixi, or p5.js.
- Canvas 2D and WebGL2 only.
- The canonical release must run from a static build after initial load.
- Release mode (`?release=1`) disables debug and community/product features.
- The soundtrack and timeline are locked to the documented runtime unless intentionally recut.
- Generated or AI-assisted effects must be reviewed, integrated, and curated before release inclusion.

## Intended category

Web demo / wild demo / AI-assisted real-time demo.

This does not claim to be an old-school size-coded intro. Its constraints are transparency, real-time execution, fixed musical sync, browser-native rendering, and explicit AI-assisted authorship.

## Release mode behaviour

Open the demo with `?release=1` to enable release/compo mode.

In release mode:
- debug overlays and debug keybinds are disabled;
- community-facing controls (share, doodles, effect ideas, live view counter) are hidden/disabled;
- view counter polling/registration and other community/product runtime calls are not used;
- playback, rendering, quality selection at start, and fullscreen/mobile controls remain available.

## Runtime/platform assumptions

- Modern desktop or mobile browser with Canvas 2D and WebGL2 support.
- JavaScript enabled.
- Static hosting is sufficient for canonical playback.

## Soundtrack requirements

- Canonical playback depends on `public/song.mp3`.
- `audio.offset: -0.128` must remain aligned with the canonical soundtrack unless intentionally retimed.
- Reproducibility is not meaningful with a different MP3.
- Include the exact release soundtrack in archival packages if licensing allows.
- If soundtrack redistribution is not allowed, document title/source/licence/hash manually (TODO).

## Build

```sh
npm ci
npm run test
npm run docs:check
npm run build:release
```

## Run locally

```sh
npm run dev
```

Then open `http://localhost:5173/?release=1` for release-mode behaviour.

## Archival release packaging

```sh
npm run build:release
npm run package:release
```

This creates `dist-release/` with a copy of `dist/` plus `build-info.json`. Zip `dist-release/` manually for archival distribution.

## Timing authority

- `public/timeline.release.json` is the canonical release timeline.
- `docs/sacred-musical-anchors.md` is authoritative for timing decisions.

## Artistic direction

See `docs/art-direction.md` for arc and pruning rules so the release reads as a directed demo, not a random effect catalogue.
