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
- The `border_multiplex` effect fakes border-breaking sprites and multiplexed raster reuse; tune `params` like `hwSprites`, `totalSprites`, `bandHeight`, `spriteSize`, `speed`, `rasterJitter`, `borderMaskStrength`, `audioReact`, and `seed`.
- The `rain` effect renders layered rain streaks with wind drift and optional splashes, with denser, smaller, faster defaults; tune `params` like `intensity`, `wind`, `speed`, `streakLength`, `splash`, `hue`, and `seed`.
- The `lightning` effect renders brief flash overlays with optional bolt branches; tune `params` like `trigger`, `chancePerSecond`, `cooldown`, `flashDuration`, `bolt`, `branches`, and `seed`.
- The `treegrowth` effect renders a stylized, audio-reactive tree that grows branches outward; tune `params` like `speed`, `levels`, `trunkHeight`, `branchScale`, `branchAngle`, `trunkWidth`, `sway`, `leafSize`, `jitter`, `seed`, and `growth`.
- The `amiga_showcase` effect layers copperbars, shadebobs, a twister ribbon, and optional glenz vectors for a 16-bit demo part; tune `params` like `barCount`, `barSpeed`, `barWaveAmp`, `barWaveFreq`, `barSaturation`, `bobCount`, `bobRadius`, `bobTrail`, `bobIntensity`, `twistWidth`, `twistAmp`, `twistSpeed`, `twistSlices`, `twistHueSpeed`, `twistX`, `glenz`, and `audioReact`.
- The `chess` effect renders a deterministic, self-playing chess match driven by the timeline; tune pacing with `params.speed` or anchor with `params.startTime`.
- The `gl_fractal_tunnel` effect renders a WebGL2 raymarched tunnel with audio-reactive pulses and bloom; tune `params` like `quality`, `warp`, `hueShift`, `exposure`, and `seed`. It falls back to the `tunnel` effect when WebGL2 is unavailable.
- The `physics_pile` effect simulates a stack of 2D rigid bodies; tune `params` like `count`, `restitution`, `friction`, `gravity`, `kickImpulse`/`beatImpulse`, `kickRadius`, `scatterAngleDeg`, `scatterJitter`, `kickUpBias`, `kickTorque`, `loosenDuration`, `loosenFrictionMult`, `loosenRestitutionAdd`, `loosenPosCorrMult`, `loosenExtraSlop`, `maxLinVel`, `maxAngVel`, `kickOrigin`, `kickOriginY`, `sepBiasDeg`, `spawnMode`, `trail`, `seed`, `wreckingCue` (swings in a heavy ball), and `shatter` (freezes and dissolves the stack into particles).
- The `gl_impossible_corridor` effect renders a WebGL2 raymarched impossible corridor with bass-driven breathing, beat kicks, and treble shimmer; tune `params` like `quality`, `warp`, `hueShift`, `exposure`, `seed`, and `speed`. It falls back to the `tunnel` effect when WebGL2 is unavailable.
- The `neon_alley` effect renders a WebGL2 raymarched neon alley with audio-reactive shimmer; tune `params` like `quality`, `speed`, `exposure`, `hueShift`, and `seed`. It falls back to the `neon` effect when WebGL2 is unavailable.
- The `space_hangar` effect renders a WebGL2 raymarched sci-fi hangar flythrough with bass-driven camera shake; tune `params` like `quality`, `speed`, `exposure`, `hueShift`, and `seed`. It falls back to the `tunnel` effect when WebGL2 is unavailable.
- The `wireframeRide` effect renders a WebGL2 wireframe terrain flythrough with neon gradients, fog, and audio-reactive pulses; tune `params` like `speed`, `gridWidth`, `gridDepth`, `gridResX`, `gridResZ`, `amplitude`, `noiseFreq`, `cameraHeight`, `fov`, `fog`, `neon`, `bassReactive`, `rmsReactive`, and `sun`. It falls back to the `isogrid` effect when WebGL2 is unavailable.
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
| `raster_bars` | `orientation`, `barCount`, `barThickness`, `speed`, `waveAmp`, `waveFreq`, `splitStrength`, `scanlineStep`, `border`, `borderSize`, `palette`, `audioReact`, `beatThump` | `orientation` supports `horizontal` or `vertical`; `palette` supports `c64`, `atari`, `spectrum`, or `rainbow`. |
| `copper_gradient_splits` | `scanStep`, `gradientRowStep`, `barCount`, `speed`, `barWobble`, `barHueStep`, `hueWobble`, `saturation`, `lightnessBase`, `lightnessPeak`, `splits`, `hamish`, `hamishStrength`, `paletteClamp`, `paletteClampSteps`, `audioReact`, `beatKick` | Copper bar gradients with optional pseudo-high-colour splits. |
| `tunnel` | `speed` |  |
| `rotozoom` | `speed` |  |
| `blobs` | `count`, `radius`, `orbit`, `speed`, `glow` |  |
| `ribbons` | `count`, `speed`, `amplitude`, `audioBoost`, `offset`, `spacing`, `thickness` |  |
| `lissajous` | `points`, `speed`, `a`, `b`, `radius`, `lineWidth` |  |
| `glitch` | `sparkles`, `sparkleSize`, `sliceCount`, `sliceBoost`, `sliceHeight`, `sliceVariance`, `offset`, `shake`, `maxShake` |  |
| `bokeh` | `count`, `speed`, `radius`, `alpha`, `hueShift` |  |
| `fractal` | `iterations`, `trebleBoost`, `speed`, `scale`, `alpha` |  |
| `feedback` | `scale`, `wobble`, `rotation`, `trail`, `glow` |  |
| `equalizer` | `bars`, `barWidth`, `height`, `bassBoost`, `alpha` |  |
| `isogrid` | `opacity`, `lineWidth`, `spacing`, `wave`, `speed` |  |
| `neon` | `shapes`, `radius`, `radiusStep`, `speed`, `glow`, `lineWidth` |  |
| `particles` | `trail`, `burst`, `burstAudio`, `force`, `forceAudio` |  |
| `border_multiplex` | `hwSprites`, `totalSprites`, `bandHeight`, `spriteSize`, `speed`, `rasterJitter`, `borderMaskStrength`, `audioReact`, `seed` |  |
| `fluid` | `speed`, `dissipation`, `splatCount`, `splatSize`, `turbulence`, `hueShift`, `seed` |  |
| `finale` | `trail`, `starSpeed`, `starWarp`, `starTurn`, `particleCount`, `particleForce`, `bars`, `barHeight` |  |
| `proper3d` | `speed` |  |
| `fake3d` | `speed` |  |
| `software_gouraud` | `bufW`, `bufH`, `model`, `segmentsU`, `segmentsV`, `camDist`, `focalMul`, `rotXSpeed`, `rotYSpeed`, `rotZSpeed`, `shading`, `ambient`, `diffuse`, `specStrength`, `shininess`, `hueSpeed`, `rimStrength`, `wireframeOverlay`, `audioReact`, `beatKick`, `seed` | `model` supports `torus`, `sphere`. `shading` supports `gouraud`, `phong` (lower buffer sizes recommended). |
| `portrait` | `zoom`, `drift` |  |
| `sphere3d` | `speed` |  |
| `spherecloud` | `speed` |  |
| `infinitycloud` | `speed` |  |
| `chess` | `speed`, `showHighlights`, `startTime` |  |
| `flyover` | `speed`, `horizon`, `seaDetail`, `waveSpeed`, `waveIntensity`, `islandCount`, `islandSeed`, `fog`, `palette`, `audioReactive` | `palette` supports `day`, `sunset`, `night`. |
| `gl_fractal_tunnel` | `quality`, `warp`, `hueShift`, `exposure`, `seed` | Falls back to `tunnel` when WebGL2 is unavailable. |
| `physics_pile` | `count`, `restitution`, `friction`, `gravity`, `kickImpulse`, `beatImpulse`, `kickRadius`, `scatterAngleDeg`, `scatterJitter`, `kickUpBias`, `kickTorque`, `loosenDuration`, `loosenFrictionMult`, `loosenRestitutionAdd`, `loosenPosCorrMult`, `loosenExtraSlop`, `maxLinVel`, `maxAngVel`, `kickOrigin`, `kickOriginY`, `sepBiasDeg`, `spawnMode`, `trail`, `seed`, `wreckingCue`, `shatter` | `spawnMode` supports `pile` or `rain`. |
| `gl_impossible_corridor` | `quality`, `warp`, `hueShift`, `exposure`, `seed`, `speed`, `internalScale` | Falls back to `tunnel` when WebGL2 is unavailable. |
| `neon_alley` | `quality`, `speed`, `exposure`, `hueShift`, `seed` | Falls back to `neon` when WebGL2 is unavailable. |
| `space_hangar` | `quality`, `speed`, `exposure`, `hueShift`, `seed` | Falls back to `tunnel` when WebGL2 is unavailable. |
| `wireframeRide` | `speed`, `gridWidth`, `gridDepth`, `gridResX`, `gridResZ`, `amplitude`, `noiseFreq`, `cameraHeight`, `fov`, `fog`, `neon`, `bassReactive`, `rmsReactive`, `sun` | Falls back to `isogrid` when WebGL2 is unavailable. |
| `vector3d_balls` | `model`, `pointCount`, `wireframe`, `roundDots`, `baseDotSize`, `dotDepthScale`, `lineWidth`, `camDist`, `rotXSpeed`, `rotYSpeed`, `rotZSpeed`, `trail`, `stripeFreq`, `stripeSpeed`, `stripeStrength`, `palette`, `audioReact`, `beatKick`, `seed` | `model` supports `cube`, `sphere`, `torus`. `palette` supports `c64`, `spectrum`, `rainbow`. |
| `synthwaveSunset` | `horizon`, `sunRadius`, `stripeHeight`, `stripeGap`, `seaSpeed`, `starCount`, `glow`, `scanlines`, `audioReactive` |  |
| `rain` | `intensity`, `wind`, `speed`, `streakLength`, `splash`, `hue`, `seed` |  |
| `lightning` | `trigger`, `chancePerSecond`, `cooldown`, `flashDuration`, `bolt`, `branches`, `seed` | `trigger` supports `beat`, `random`, `both`. |
| `effect_evolution` | `density`, `motion`, `warp`, `trail`, `seed` | Reinterprets the same lattice across eras. |
| `treegrowth` | `speed`, `levels`, `trunkHeight`, `branchScale`, `branchAngle`, `trunkWidth`, `sway`, `leafSize`, `jitter`, `seed`, `growth` | `growth` overrides the automatic growth cycle (0-1). |
| `amiga_showcase` | `barCount`, `barSpeed`, `barWaveAmp`, `barWaveFreq`, `barSaturation`, `bobCount`, `bobRadius`, `bobTrail`, `bobIntensity`, `twistWidth`, `twistAmp`, `twistSpeed`, `twistSlices`, `twistHueSpeed`, `twistX`, `glenz`, `audioReact` |  |
| `sine_scroller_logo` | `message`, `fontSize`, `speed`, `waveAmp`, `waveSpeed`, `wavePhaseStep`, `scrollerY`, `scrollerX`, `layer2`, `layer2Speed`, `layer2FontSize`, `layer2Y`, `logoText`, `logoFontSize`, `logoY`, `scanlineStep`, `logoWaveAmp`, `logoWaveSpeed`, `logoWaveFreq`, `audioReact`, `beatBoost` | Scroll + sine wave + scanline logo wobble. |

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
- The debug overlay includes 10-second skip buttons plus a timeline JSON editor; click "Apply changes" (or press Ctrl/Cmd+Enter inside the editor) to hot-reload the timeline while the demo runs.
- On touch devices, two floating buttons appear in the lower-right corner: `DBG` toggles the debug overlay and `⛶` toggles fullscreen.
