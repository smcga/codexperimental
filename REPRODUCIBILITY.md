# Reproducibility

## Canonical release inputs

- Release tag: TODO
- Commit hash: TODO
- Timeline: `public/timeline.release.json`
- Timing anchors: `docs/sacred-musical-anchors.md`
- Soundtrack: `public/song.mp3`
- Soundtrack hash: TODO
- Expected runtime: `06:22.87`
- Timeline audio offset: `-0.128s`
- Browser targets: current Chromium/Firefox/Safari releases with WebGL2 and Canvas 2D

## Build environment

- Node version: TODO
- Install: `npm ci`
- Test command: `npm run test`
- Docs check command: `npm run docs:check`
- Release build command: `npm run build:release`
- Expected output location: `dist/`

## Build

```sh
npm ci
npm run test
npm run docs:check
npm run build:release
```

## Release verification

- Open the built demo with `?release=1`.
- Confirm the debug overlay is hidden.
- Confirm community/doodle/effect-generation/share/view-counter UI is hidden or disabled.
- Confirm playback follows `public/timeline.release.json`.
- Confirm no visual section retimes sacred anchors.

## Known fallbacks

- If the exact soundtrack cannot be distributed in an archive, document title/source/licence/hash in release notes and acknowledge that timing reproducibility is reduced.
- If backend APIs are unavailable, canonical release playback still runs as a static build in release mode.
