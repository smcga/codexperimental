# Demoscene AI 2022 Demo

Single-page demoscene-style web demo built with Vite + TypeScript, Canvas 2D, and Web Audio API.

## Release-facing docs

- `RELEASE.md` — what the canonical demo release is and how to run it.
- `AI_AUTHORSHIP.md` — how AI assistance is used and bounded.
- `CREDITS.md` — credits, thanks, and scene-facing context.
- `REPRODUCIBILITY.md` — build, runtime, and archival notes.
- `docs/sacred-musical-anchors.md` — locked timing anchors for the soundtrack.
- `docs/art-direction.md` — dramatic arc and pruning rules for release curation.

Codexperimental is an AI-assisted real-time web demo. It keeps the AI premise visible while documenting the human direction, timing, selection, editing, and release constraints required to make the result a coherent production.

- The on-page view counter fetches `/api/views` continuously (default every 5 seconds) so audience totals can update live while the page is open.

## Requirements

- Node.js 18+ recommended.

## Audio + timeline configuration

- `public/song.mp3` is required for canonical playback (use the exact release soundtrack).
- For archival releases, include the exact soundtrack file when licensing allows; otherwise document title/source/licence/hash as TODO metadata in release notes.
- The demo timing is not meaningfully reproducible with a different MP3.
- Edit `public/timeline.release.json` to change the intro terminal script, section timings, transitions, or text cues. Use `mm:ss` or `mm:ss.s` time strings for section and cue start/end values (for example, `01:44.5`).
- **Sacred anchor policy:** before changing timeline timings, read `docs/sacred-musical-anchors.md`. The listed musical anchor timestamps are mandatory and must remain locked unless the soundtrack itself is intentionally recut; secondary effect-switch cues in that doc are advisory and must never override the sacred anchors.
- Rap lyric cue timing is also locked: the rap starts at **03:25.012** on the word **“All”**, and the detailed lyric cue anchors in `docs/sacred-musical-anchors.md` must be preserved when editing `textCues`.
- `public/timeline.release.json` is the canonical timeline and adds per-section era presets plus a curated arc for the graphics-history progression.
- The bundled timeline includes lyric-style overlays in `textCues`; adjust or replace those cues to change the on-screen callouts synced to the music.
- Timeline playback now applies `audio.offset: -0.128` in `public/timeline.release.json` so the in-app timeline clock matches manual MP3 timing checks (e.g., Audacity) instead of drifting late.
- Transition types include `fade`, `wipe`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `iris`, `flash`, `glitch`, `shatter`, `signal-collapse`, `camera-punch-through`, `bitplane-wipe`, and `audio-reactive-particle` (vertical VGA-style bands with staggered timing).
- Effect sections can include a `params` object to tune effect-specific settings such as starfield speed, warp, or turning intensity.
- Effects can animate numeric params with an `automation` array on a section or a layer; entries are applied in array order (last wins) and ease over absolute demo time.
- Sections can optionally define `layers` to mix multiple effects together, with `blend` modes like `screen` or `overlay` and per-layer `opacity`.
- The timeline includes two 3D showcase effects: `proper3d` (perspective projection + lighting) and `fake3d` (2D skew/shading tricks). The `sphere3d` effect renders a rotating lit point sphere with orbiting satellites.
- The `spherecloud` effect renders a glowing point-cloud sphere with subtle audio-reactive rotation and lighting.
- The `infinitycloud` effect renders a glowing point-cloud infinity loop with audio-reactive pulses and lighting.
- The `volumetric_clouds` effect renders layered procedural cloud banks with parallax depth and audio-reactive density pulses; tune `params` like `density`, `layers`, `windSpeed`, `cloudScale`, `detail`, `sunlight`, `haze`, and `audioReact`.
- The `flyover` effect renders a sky/sea flythrough with distant islands; tune `params` like `speed`, `horizon`, `seaDetail`, `islandSeed`, and `palette`.
- The `synthwaveSunset` effect renders an outrun sunset with a striped sun, neon sky, and reflective sea; tune `params` like `horizon`, `sunRadius`, `stripeHeight`, `stripeGap`, and `seaSpeed`.
- The `skyboxTransition` effect renders a panoramic atmospheric backdrop that smoothly evolves from day through sunset into surreal night; tune `params` like `speed`, `intensity`, `horizon`, `cloudAmount`, `starAmount`, `silhouetteAmount`, `surrealness`, `audioReactive`, `loop`, and `phaseOffset`.
- The `border_multiplex` effect fakes border-breaking sprites and multiplexed raster reuse; tune `params` like `hwSprites`, `totalSprites`, `bandHeight`, `spriteSize`, `speed`, `rasterJitter`, `borderMaskStrength`, `audioReact`, and `seed`.
- The `rain` effect renders layered storm rain with turbulence, optional ground splashes, and low mist bands; tune `params` like `intensity`, `wind`, `speed`, `streakLength`, `splash`, `hue`, `storm`, `turbulence`, `mist`, and `seed`.
- The `lightning` effect renders brief flash overlays with optional bolt branches; tune `params` like `trigger`, `chancePerSecond`, `cooldown`, `flashDuration`, `bolt`, `branches`, and `seed`.
- The `amiga_showcase` effect layers copperbars, shadebobs, a twister ribbon, and optional glenz vectors for a 16-bit demo part; tune `params` like `barCount`, `barSpeed`, `barWaveAmp`, `barWaveFreq`, `barSaturation`, `bobCount`, `bobRadius`, `bobTrail`, `bobIntensity`, `twistWidth`, `twistAmp`, `twistSpeed`, `twistSlices`, `twistHueSpeed`, `twistX`, `glenz`, and `audioReact`.
- The `chess` effect renders a deterministic, self-playing chess match with clearer, silhouette-driven pieces that better read as crowns, crosses, mitres, battlements, and horse heads; tune pacing with `params.speed` or anchor with `params.startTime`.
- The `gl_fractal_tunnel` effect renders a WebGL2 raymarched tunnel with audio-reactive pulses and bloom; tune `params` like `quality`, `warp`, `hueShift`, `exposure`, and `seed`. It falls back to the `tunnel` effect when WebGL2 is unavailable.
- The `physics_pile` effect simulates a stack of 2D rigid bodies with independent box rendering (no connector lines) and floor-origin kick pulses that throw boxes upward; tune `params` like `count`, `restitution`, `friction`, `gravity`, `kickImpulse`/`beatImpulse`, `kickRadius`, `scatterAngleDeg`, `scatterJitter`, `kickUpBias`, `kickTorque`, `loosenDuration`, `loosenFrictionMult`, `loosenRestitutionAdd`, `loosenPosCorrMult`, `loosenExtraSlop`, `maxLinVel`, `maxAngVel`, `kickOrigin`, `kickOriginY`, `sepBiasDeg`, `spawnMode`, `trail`, `seed`, `wreckingCue` (swings in a heavy ball), and `shatter` (freezes and dissolves the stack into particles).
- The `gl_impossible_corridor` effect renders a WebGL2 raymarched impossible corridor with bass-driven breathing, beat kicks, and treble shimmer; tune `params` like `quality`, `warp`, `hueShift`, `exposure`, `seed`, and `speed`. It falls back to the `tunnel` effect when WebGL2 is unavailable.
- The `neon_alley` effect renders a WebGL2 raymarched neon alley with audio-reactive shimmer; tune `params` like `quality`, `speed`, `exposure`, `hueShift`, and `seed`. It falls back to the `neon` effect when WebGL2 is unavailable.
- The `space_hangar` effect renders a WebGL2 raymarched sci-fi hangar flythrough with bass-driven camera shake; tune `params` like `quality`, `speed`, `exposure`, `hueShift`, and `seed`. It falls back to the `tunnel` effect when WebGL2 is unavailable.
- The `raymarch_fractal` effect renders a WebGL2 raymarched fractal emerging from a ground plane with audio-reactive palette shifts; tune `params` like `quality`, `fractal`, `cameraRadius`, `cameraHeight`, `cameraOrbitSpeed`, `paletteSpeed`, `audioReact`, `beatKick`, and `fractalScale`. It falls back to the `fractal` effect when WebGL2 is unavailable.
- The `explicitpixels` effect can switch between a generated assignment-only static frame (`mode: "explicit"`) and an audio-reactive procedural animation (`mode: "procedural"`). The checked-in assignment frame is treated as source-of-truth; `npm run gen:explicitpixels` only refreshes metadata and will not regenerate frame bytes.
- The `wireframeRide` effect renders a WebGL2 wireframe terrain flythrough with neon gradients, fog, and audio-reactive pulses; tune `params` like `speed`, `gridWidth`, `gridDepth`, `gridResX`, `gridResZ`, `amplitude`, `noiseFreq`, `cameraHeight`, `fov`, `fog`, `neon`, `bassReactive`, `rmsReactive`, and `sun`. It falls back to the `isogrid` effect when WebGL2 is unavailable.
- The `roadDrive` effect renders a WebGL2 night highway drive with dashed lane markers, guardrail glow, and horizon fog; tune `params` like `speed`, `roadWidth`, `laneDashLength`, `laneGap`, `fog`, `glow`, `cameraBob`, `curveStrength`, `curveFrequency`, `bassReactive`, and `rmsReactive`. Camera bobbing keeps the road grounded near the lower frame edge to preserve the forward-driving illusion. It falls back to the `isogrid` effect when WebGL2 is unavailable.
- The `prism_bloom` effect renders painterly spectral petals, soft bloom clouds, and drifting dust for a lush AI-art tableau; tune `params` like `bloom`, `flow`, `petalCount`, `smear`, `prismShift`, `vignette`, `audioReact`, and `seed`.
- The `velvet_dreamscape` effect renders flowing silk ribbons, luminous gallery blooms, and subtle film grain for an unabashedly tasteful AI-art hero shot; tune `params` like `bloom`, `flow`, `ribbonCount`, `grain`, `hueDrift`, `focus`, `audioReact`, and `seed`.
- The `tetris_matrix` effect renders a self-playing falling-block match that cycles through all 12 pentominoes (five-cell shapes) with clearer side-panel HUD spacing, safe top-out game-over restarts, and visible mid-air spins plus quick-drop/hesitation choices for a monochrome handheld LCD vibe; tune `params` like `speed`, `level`, `glow`, `contrast`, `ghost`, and `seed`.
- The `intro` block controls the terminal presentation from `t=0` until `intro.end`; the first section must start exactly at the same time so the colour pipeline can take over. Script events are time-coded, so you can align story lines with audio or prior text cue timings.
- Visuals include subtle camera zoom and panning that respond to audio energy.
- While the demo is running, tapping/clicking the main canvas injects an extra-strong manual beat pulse so audio-reactive effects (especially `physics_pile`) thump like a kick hit.
- Post-intro effects render on a 16:9 base canvas; landscape uses letterboxing, while portrait screens scale to fill the height and crop the sides.
- Append `?release=1` to the URL to disable the debug overlay/keybinds.
- Rendering quality can be tuned via URL query params:
  - `?baseScale=2` multiplies the base canvas size (default `1`, clamped to `1`-`4`).
  - `?baseW=640&baseH=360` overrides the base canvas dimensions (must be 16:9 and between `320×180` and `1920×1080`).
  - `?quality=0.85` scales the effective base resolution for performance (default `1.0`, clamped to `0.65`-`1.0`).
  - `?autoQuality=1` enables dynamic quality scaling based on frame time (adjusts by `0.05` at most once per second).
  - The start overlay includes a **render quality** selector (`Best performance`, `Balanced`, `Maximum`) so users can pick sensible defaults without query-string tuning.
  - Recommended: `baseScale=2` for 1080p-class displays, `baseScale=3` for 1440p+ if your GPU/CPU allows.

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

### Timeline runtime behavior (how playback works)

- The timeline runs in two modes: `intro` and `sections`. While the current playback time is before `intro.end`, the app stays in `intro`; at `intro.end` and later it switches to `sections`.
- During `intro`, the renderer still receives the first section as `section` context so post-intro visuals can warm up consistently, but transitions and text cues remain inactive.
- Section lookup is start-time based: the active section is the last section whose `start` is less than or equal to the current time.
- Transition blending is evaluated only at section boundaries:
  - A transition is active for `section.transition.duration` seconds after a section starts.
  - Transition progress is clamped from `0` to `1`.
  - The transition type uses the incoming section `transition.in` (normalized to `fade` when omitted in JSON).
  - Supported transition types: `fade`, `wipe`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `iris`, `flash`, `glitch`, `shatter`, `signal-collapse`, `camera-punch-through`, `bitplane-wipe`, `audio-reactive-particle`, `checkerboard-wipe`, `venetian-blinds`, `radial-wipe`, `noise-threshold`, `portal-zoom`, `whip-pan`, `quantum-slice`, `chromatic-bloom`, `neural-feedback`.
- `textCues` are active only while `start <= currentTime <= end`.
- If the final section omits an explicit `end`, it is treated as "until audio ends" and is finalized after audio metadata loads.
- `introTime` is exposed in both modes:
  - In `intro`, `introTime` equals absolute playback time.
  - In `sections`, `introTime` equals elapsed time since `intro.end`.

### Timeline data schema

`public/timeline.release.json` follows this top-level shape:

```json
{
  "audio": { "src": "song.mp3", "offset": 0 },
  "intro": {
    "mode": "terminal",
    "end": "00:54.15",
    "theme": {
      "bg": "#000000",
      "fg": "#d0ffd0",
      "accent": "#66ff66",
      "dim": "#4c7f4c",
      "fontFamily": "'IBM Plex Mono', monospace",
      "fontSize": 20,
      "lineHeight": 1.4,
      "padding": 24,
      "window": { "title": "boot", "chrome": true }
    },
    "script": [
      { "t": "00:00", "type": "prompt", "text": "boot sequence" },
      { "t": "00:02", "type": "type", "text": "loading...", "cps": 28 }
    ]
  },
  "sections": [
    {
      "id": "intro-neon",
      "start": "00:54.15",
      "end": "01:10.00",
      "effect": "neon",
      "era": "future",
      "transition": { "in": "fade", "duration": 0.8 },
      "fitAlign": "fill",
      "params": { "speed": 1.2 },
      "automation": [
        { "param": "speed", "from": 0.8, "to": 1.4, "t0": "00:54.15", "t1": "01:10.00", "ease": "linear" }
      ],
      "layers": [
        { "effect": "rain", "opacity": 0.5, "blend": "screen", "fitAlign": "centre", "params": { "intensity": 0.9 } }
      ]
    }
  ],
  "textCues": [
    {
      "id": "cue-1",
      "start": "01:02.0",
      "end": "01:06.0",
      "text": "HELLO WORLD",
      "x": 0.5,
      "y": 0.72,
      "align": "center",
      "size": 42,
      "color": "#ffffff",
      "effects": { "glitchIn": true, "shadow": true }
    }
  ]
}
```

- `audio`: soundtrack path and optional timeline offset in seconds.
- `intro`: terminal intro mode, end timestamp, visual theme, and scripted terminal events (`prompt`, `type`, `enter`, `output`, `ascii`, `clear`).
- `sections`: ordered effect schedule with IDs, timing, effect key, optional era preset (`8bit`, `16bit`, `ps1`, `pcdemo`, `future`), transitions, `fitAlign` (`top`/`centre`/`bottom`/`fill`), parameter overrides, optional automations, and optional layered effects.
  - In mobile-fit presentation, `fitAlign: top|centre|bottom` now maps each render into its own vertical third so multiple non-`fill` layers can be shown simultaneously without fullscreen overlap.
  - To author three simultaneous “main” effects in timeline JSON, set the section’s main `effect` + `fitAlign` to one slot and add additional `layers` using `blend: "source-over"`, `opacity: 1`, and `fitAlign` set to the other slots.
- `textCues`: optional overlay callouts with timing, position, typography, and optional per-cue visual effects (glitch, shadow, scanline mask, and typewriter speed).
- Time fields accept either seconds (`number`) or timeline strings (`mm:ss` / `mm:ss.s`).

### Effect catalog

Each timeline section `effect` maps to one of the entries below. Include any of the parameters in a section `params` object; omit or set to defaults to use the built-in values.
The curated `public/timeline.release.json` pass now gives every registry effect at least one primary section spotlight while preserving the historical-to-impossible era arc.

| Effect | Parameters | Notes |
| --- | --- | --- |
| `starfield` | `speed`, `warp`, `turnRate`, `turnStrength`, `drift`, `sparkle`, `colorShift` | Warp/turn adjust flight feel; drift/sparkle/colorShift add richer motion and chroma variation. |
| `plasma` | `speed` |  |
| `raster_bars` | `orientation`, `barCount`, `barThickness`, `speed`, `waveAmp`, `waveFreq`, `splitStrength`, `scanlineStep`, `border`, `borderSize`, `palette`, `audioReact`, `beatThump` | `orientation` supports `horizontal` or `vertical`; `palette` supports `c64`, `atari`, `spectrum`, or `rainbow`. |
| `kefrens_bars` | `barCount`, `barWidth`, `amp`, `freq`, `speed`, `phaseOffset`, `palette` | `palette` supports `rainbow`, `c64`, or `amiga`. |
| `copper_gradient_splits` | `scanStep`, `gradientRowStep`, `barCount`, `speed`, `barWobble`, `barHueStep`, `hueWobble`, `saturation`, `lightnessBase`, `lightnessPeak`, `splits`, `hamish`, `hamishStrength`, `paletteClamp`, `paletteClampSteps`, `audioReact`, `beatKick` | Copper bar gradients with optional pseudo-high-colour splits. |
| `bumpmap_plane` | `bufW`, `bufH`, `bumpStrength`, `ambient`, `diffuseStrength`, `specStrength`, `shininess`, `lightZ`, `lightSpeed`, `embossText`, `embossStrength`, `animateBumps`, `waveAmp`, `waveFreqX`, `waveFreqY`, `baseHue`, `paletteMode`, `scanlines`, `audioReact`, `beatKick`, `seed` | CPU bump-mapped plane with moving light and optional embossed text. |
| `vga_fire` | `fireW`, `fireH`, `stepsPerFrame`, `baseHeat`, `sparkChance`, `decay`, `wind`, `windWave`, `turbulence`, `gustOnBeat`, `logoText`, `logoSize`, `logoY`, `audioReact`, `scanlines`, `glowStrength` | Classic VGA/DOS fire with optional logo mask. |
| `tunnel` | `speed` |  |
| `dotTunnel` | `ringCount`, `dotsPerRing`, `fov`, `speed`, `twist`, `palette`, `glow`, `seed` | Depth-sorted sprite/ring tunnel; `palette` selects built-in color ramps. |
| `moire_grid` | `spacing`, `lineWidth`, `speed`, `warp`, `intensity`, `palette`, `audioReact` | Warped interference grid; `palette` supports `cyan`, `magenta`, or `amber`. |
| `recursiveFracture` | `seed`, `shapeCount`, `maxDepth`, `splitBias`, `angleJitter`, `gap`, `strokeWidth`, `fillAlpha`, `lineAlpha`, `progressSpeed`, `progressMode`, `beatPunch`, `bassInfluence`, `trebleDetail`, `paletteMode`, `minFragmentSize` | Deterministic recursive subdivision panes; `progressMode` supports `outward`/`inward`, and `paletteMode` supports `mono`, `era`, or `heat`. |
| `moving_shadow_map` | `seed`, `objectCount`, `lightCount`, `lightSpeed`, `lightHeightMin`, `lightHeightMax`, `shadowLength`, `shadowSoftness`, `floorGrid`, `paletteMode`, `contrast`, `haze`, `orbitRadius`, `colorA`, `colorB`, `lightColor` | Faux-3D Canvas2D scene with orbiting lights and projected moving shadows over a ground plane. |
| `textmode_charset` | `cols`, `rows`, `glyphSet`, `mode`, `speed`, `palette`, `scanlines`, `seed` | Coarse character-grid renderer with glyph ramps (` .:-=+*#%@`) and palette-indexed tinting. |
| `rotozoom` | `speed` |  |
| `blobs` | `count`, `radius`, `orbit`, `speed`, `glow` |  |
| `metaballs` | `bufW`, `bufH`, `count`, `baseRadius`, `radiusVar`, `baseThreshold`, `edgeSoftness`, `normalZ`, `ambient`, `diffuse`, `specStrength`, `shininess`, `rimStrength`, `palette`, `hueSpeed`, `smoothing`, `glow`, `audioReact`, `beatKick`, `seed` | Implicit surface metaballs with chrome/neon lighting; `palette` supports `chrome` or `neon`. |
| `ribbons` | `count`, `speed`, `amplitude`, `audioBoost`, `offset`, `spacing`, `thickness` |  |
| `skeletal_ribbon` | `boneCount`, `length`, `thickness`, `waveAmp`, `waveFreq`, `stiffness`, `audioInfluence`, `colorMode`, `hueShift`, `glow`, `debugSkeleton` | Articulated spine/tentacle ribbon driven by chained bone kinematics with beat-reactive pulse thickness. |
| `lissajous` | `points`, `speed`, `a`, `b`, `radius`, `lineWidth` |  |
| `marble` | `scale`, `veinScale`, `contrast`, `brightness`, `speed`, `turbulence`, `layers` | Animated marble veins using turbulent sine domain warping; audio subtly modulates turbulence, vein scale, and brightness. |
| `glitch` | `sparkles`, `sparkleSize`, `sliceCount`, `sliceBoost`, `sliceHeight`, `sliceVariance`, `offset`, `shake`, `maxShake` |  |
| `bokeh` | `count`, `speed`, `radius`, `alpha`, `hueShift` |  |
| `fractal` | `iterations`, `trebleBoost`, `speed`, `scale`, `alpha` |  |
| `feedback` | `scale`, `wobble`, `rotation`, `trail`, `glow` |  |
| `equalizer` | `bars`, `barWidth`, `height`, `bassBoost`, `alpha` |  |
| `spectrum_analyzer` | `bands`, `smoothing`, `curve`, `tilt`, `peakHold`, `grid`, `glow` | Parametric-EQ-style spectrum trace with log-spaced bins and peak-hold markers. |
| `isogrid` | `opacity`, `lineWidth`, `spacing`, `wave`, `speed` |  |
| `kaleidoscope_symmetry` | `slices`, `rotationSpeed`, `radialZoom`, `mirror`, `patternScale`, `patternWarp`, `centreX`, `centreY`, `colorShift`, `glow`, `audioReactive`, `bassInfluence`, `trebleInfluence`, `spinOnBeat`, `ringDensity` | Mirrored radial wedges driven by a procedural source pattern for mandala/starburst motion. |
| `neon` | `shapes`, `radius`, `radiusStep`, `speed`, `glow`, `lineWidth` |  |
| `particles` | `trail`, `burst`, `burstAudio`, `force`, `forceAudio` |  |
| `particleAttractors` | `count`, `seed`, `attractorCount`, `strength`, `swirl`, `damping`, `speedLimit`, `softening`, `absorbRadius`, `spawnMode`, `trailAlpha`, `particleSize`, `glow`, `motion`, `audioReactive`, `beatPulse`, `colorMode`, `backgroundFade`, `vignette` | Gravity-well particle flow with swirling paths; `spawnMode` supports `edges`, `ring`, or `random`, and `colorMode` supports `mono`, `era`, or `heat`. |
| `border_multiplex` | `hwSprites`, `totalSprites`, `bandHeight`, `spriteSize`, `speed`, `rasterJitter`, `borderMaskStrength`, `audioReact`, `seed` |  |
| `fluid` | `speed`, `dissipation`, `splatCount`, `splatSize`, `turbulence`, `hueShift`, `seed` |  |
| `reactionDiffusion` | `scale`, `simScale`, `feed`, `kill`, `diffA`, `diffB`, `steps`, `seed`, `contrast`, `brightness`, `invert`, `paletteMix`, `audioReactivity`, `beatPulse`, `drift`, `reseedCue` | Gray–Scott style reaction-diffusion simulation with evolving spots/stripes, subtle audio pulse response, and era-aware output shaping. |
| `smoke_simulation` | `density`, `flowSpeed`, `turbulence`, `swirl`, `diffusion`, `softness`, `emission`, `emitMode`, `scale`, `colorMode`, `hueShift`, `audioReactive`, `bassInfluence`, `midInfluence`, `trebleInfluence`, `seed`, `highlights` | `emitMode` supports `centre`, `bottom`, `random`; `colorMode` supports `mono` or `tinted`. |
| `boids_simulation` | `count`, `speed`, `cohesion`, `alignment`, `separation`, `neighborRadius`, `separationRadius`, `trail`, `size`, `seed` | Audio-reactive flocking simulation with wraparound space and neon boid trails. |
| `finale` | `trail`, `starSpeed`, `starWarp`, `starTurn`, `particleCount`, `particleForce`, `bars`, `barHeight` |  |
| `proper3d` | `speed` |  |
| `fake3d` | `speed` |  |
| `textured_cube` | `scale`, `camDist`, `focalMul`, `rotXSpeed`, `rotYSpeed`, `rotZSpeed`, `backfaceCull`, `perspectiveCorrect`, `edge`, `edgeAlpha`, `shadeStrength`, `audioReact`, `beatKick`, `textureAnim` | Software-textured cube with optional affine/perspective mapping. |
| `sphere3d` | `speed` |  |
| `spherecloud` | `speed` |  |
| `infinitycloud` | `speed` |  |
| `infinite_zoom_droste` | `speed`, `scaleBase`, `rotationSpeed`, `detail`, `glow`, `pulse`, `twist`, `seed`, `shape`, `fitMode` | `shape` supports `portal`, `rings`, or `grid`; `fitMode` supports `auto` or `safe`. |
| `infiniteMirror` | `depth`, `scale`, `rotation`, `twist`, `offsetX`, `offsetY`, `pulse`, `glow`, `softness`, `vignette`, `monochrome`, `mirrorFrames`, `baseScene`, `symmetry`, `strobeOnBeat`, `feedbackMix` | Self-referential mirror corridor recursion using feedback; `baseScene` supports `grid`, `rings`, `checker`, `bars`, `void`. |
| `volumetric_clouds` | `density`, `layers`, `windSpeed`, `cloudScale`, `detail`, `sunlight`, `haze`, `audioReact` | Layered procedural cloudscape with parallax and soft haze. |
| `voronoi_cells` | `cellCount`, `drift`, `speed`, `lineWidth`, `lineAlpha`, `fillAlpha`, `contrast`, `jitter`, `paletteMode`, `beatPulse`, `shade`, `seed`, `pixelStep`, `chromatic` | Animated Voronoi-style cellular mosaic with era-aware palette bias; `paletteMode` supports `mono`, `neon`, `heat`, or `era`. |
| `torus_orbit_3d` | `ringCount`, `pointsPerRing`, `majorRadius`, `minorRadius`, `spinSpeed`, `wobbleSpeed`, `depth`, `glow`, `palette`, `audioReact` | Orbiting 3D torus points; `palette` supports `teal`, `violet`, or `amber`. |
| `raytrace_spheres` | `quality`, `bufW`, `bufH`, `sphereCount`, `maxDepth`, `floorReflect`, `shininess`, `diffuseStrength`, `specStrength`, `ambient`, `fov`, `cellSize`, `adaptive`, `refineThreshold`, `refineGrow`, `aa`, `aaMode`, `outputSmoothing`, `forceAA`, `audioReact`, `beatKick`, `scanlines`, `seed` | Low-res software raytraced spheres with reflections. |
| `chess` | `speed`, `showHighlights`, `startTime` | Deterministic self-playing chess match with clearer silhouette-led pieces, distinctive major-piece markers, and move highlights. |
| `cloth_sim` | `width`, `height`, `cols`, `rows`, `gravity`, `damping`, `stiffness`, `iterations`, `wind`, `flutter`, `audioReactive`, `pinMode`, `driftX`, `driftY`, `shading`, `seamAlpha`, `paletteMode`, `backgroundAlpha`, `mobileQuality`, `obstacle`, `obstacleSize` | Canvas2D verlet cloth mesh with pinned anchors, gust-driven folds, beat billows, and era-aware shading that can run as base or composited layer. |
| `flyover` | `speed`, `horizon`, `seaDetail`, `waveSpeed`, `waveIntensity`, `islandCount`, `islandSeed`, `fog`, `palette`, `audioReactive` | `palette` supports `day`, `sunset`, `night`. |
| `voxel_landscape` | `bufW`, `bufH`, `speed`, `turnRate`, `turnWobble`, `camH`, `heightBob`, `beatBump`, `fov`, `horizon`, `scale`, `maxDist`, `stepBase`, `stepGrow`, `fogStrength`, `audioReact`, `beatKick`, `scanlines`, `seed` | Heightfield voxel landscape flyover with portrait-aware camera framing. |
| `voxel_world_builder` | `buildProgress`, `cityDensity`, `glow`, `cameraLift`, `seed` | WebGL2 instanced voxel city assembler (64x64 cubes); falls back to Canvas2D isometric voxels when WebGL2 is unavailable. |
| `gl_fractal_tunnel` | `quality`, `warp`, `hueShift`, `exposure`, `seed` | Falls back to `tunnel` when WebGL2 is unavailable. |
| `physics_pile` | `count`, `restitution`, `friction`, `gravity`, `kickImpulse`, `beatImpulse`, `kickRadius`, `scatterAngleDeg`, `scatterJitter`, `kickUpBias`, `kickTorque`, `loosenDuration`, `loosenFrictionMult`, `loosenRestitutionAdd`, `loosenPosCorrMult`, `loosenExtraSlop`, `maxLinVel`, `maxAngVel`, `kickOrigin`, `kickOriginY`, `sepBiasDeg`, `spawnMode`, `trail`, `seed`, `wreckingCue`, `shatter` | `spawnMode` supports `pile` or `rain`; joints stay simulation-only so boxes render without connector lines. |
| `polar_tunnel` | `rotateSpeed`, `wobbleFrequency`, `wobbleSpeed`, `wobbleAmount`, `radialWobbleFrequency`, `radialWobbleSpeed`, `radialWobbleAmount`, `radialFrequency`, `angularFrequency`, `colorCycles`, `audioReact` | Center-relative polar tunnel with angle/radius wobble and a sine palette for demoscene-style concentric motion. |
| `gl_impossible_corridor` | `quality`, `warp`, `hueShift`, `exposure`, `seed`, `speed`, `internalScale` | Falls back to `tunnel` when WebGL2 is unavailable. |
| `neon_alley` | `quality`, `speed`, `exposure`, `hueShift`, `seed` | Falls back to `neon` when WebGL2 is unavailable. |
| `space_hangar` | `quality`, `speed`, `exposure`, `hueShift`, `seed` | Falls back to `tunnel` when WebGL2 is unavailable. |
| `wireframeRide` | `speed`, `gridWidth`, `gridDepth`, `gridResX`, `gridResZ`, `amplitude`, `noiseFreq`, `cameraHeight`, `fov`, `fog`, `neon`, `bassReactive`, `rmsReactive`, `sun` | Falls back to `isogrid` when WebGL2 is unavailable. |
| `roadDrive` | `speed`, `roadWidth`, `laneDashLength`, `laneGap`, `fog`, `glow`, `cameraBob`, `curveStrength`, `curveFrequency`, `bassReactive`, `rmsReactive` | Falls back to `isogrid` when WebGL2 is unavailable. |
| `vector3d_balls` | `model`, `pointCount`, `wireframe`, `roundDots`, `baseDotSize`, `dotDepthScale`, `lineWidth`, `camDist`, `rotXSpeed`, `rotYSpeed`, `rotZSpeed`, `trail`, `stripeFreq`, `stripeSpeed`, `stripeStrength`, `palette`, `audioReact`, `beatKick`, `seed` | `model` supports `cube`, `sphere`, `torus`. `palette` supports `c64`, `spectrum`, `rainbow`. |
| `envmap_donut` | `bufW`, `bufH`, `segmentsU`, `segmentsV`, `R`, `r`, `camDist`, `focalMul`, `rotXSpeed`, `rotYSpeed`, `rotZSpeed`, `fresnelStrength`, `specStrength`, `shininess`, `chromeDesat`, `backfaceCull`, `scanlines`, `edge`, `audioReact`, `beatKick`, `seed` | Software environment-mapped chrome torus. |
| `explosionBurst` | `startTime`, `duration`, `seed`, `intensity`, `radius`, `particleCount`, `smokeCount`, `debrisCount`, `gravity`, `drag`, `turbulence`, `turbulenceScale`, `fade`, `audioReactive` | One-shot seeded explosion burst with flash, fireball, debris streaks, and rolling smoke fade for beat-synced impact moments. |
| `poly_morph_showcase` | `lat`, `lon`, `morphSpeed`, `styleSpeed`, `style`, `camDist`, `focalMul`, `rotXSpeed`, `rotYSpeed`, `rotZSpeed`, `sat`, `baseHue`, `hueSpeed`, `solidAlpha`, `glenzAlpha`, `shadedAlpha`, `edge`, `edgeAlpha`, `sortSolid`, `sortShaded`, `sortGlenz`, `audioReact`, `beatKick`, `seed` | `style` supports `auto`, `solid`, `glenz`, `shaded`. |
| `glenz_vectors` | `model`, `instances`, `camDist`, `focal`, `rotXSpeed`, `rotYSpeed`, `rotZSpeed`, `baseHue`, `hueSpeed`, `sat`, `lightness`, `faceAlpha`, `edge`, `edgeAlpha`, `lineWidth`, `trailFade`, `sortFaces`, `audioReact`, `beatKick`, `seed` | `model` supports `cube`, `octa`, `icosa`; `sortFaces` supports `none` or `backToFront`. |
| `god_rays` | `sourceX`, `sourceY`, `rayCount`, `spread`, `intensity`, `haze`, `occlusion`, `drift`, `pulse`, `warmth`, `dust`, `seed`, `style`, `sourceDriftX`, `sourceDriftY`, `shadowBands` | Atmospheric volumetric-style shafts with drifting haze, procedural occluders, and style variants (`sunbreak`, `window`, `cathedral`). |
| `synthwaveSunset` | `horizon`, `sunRadius`, `stripeHeight`, `stripeGap`, `seaSpeed`, `starCount`, `glow`, `scanlines`, `audioReactive` |  |
| `skyboxTransition` | `speed`, `intensity`, `horizon`, `cloudAmount`, `starAmount`, `silhouetteAmount`, `surrealness`, `audioReactive`, `loop`, `phaseOffset` | Evolving panoramic skybox backdrop that blends day, sunset, twilight, and surreal night moods. |
| `taco_meteor_shower` | `shellCount`, `fallSpeed`, `swirl`, `burst`, `stardust`, `toppingSpread`, `audioReact`, `seed` | Luminescent taco shells cascade like meteors, shed sparkling stardust, and splat into avocado/cilantro/salsa confetti. |
| `rain` | `intensity`, `wind`, `speed`, `streakLength`, `splash`, `hue`, `storm`, `turbulence`, `mist`, `seed` | `storm` controls downpour density/velocity, `turbulence` adds sideways sway, and `mist` controls near-ground fog bands. |
| `water_drops` | `dropCount`, `minRadius`, `maxRadius`, `fallSpeed`, `distortion`, `trail`, `audioReact`, `tint`, `refraction`, `microDrops`, `rivulets`, `seed` | Layered wet-glass droplets with refractive cores, chromatic rims, sparkling micro-beads, and flowing rivulet streaks. |
| `fireworks_display` | `shellRate`, `burstSize`, `glitter`, `trail`, `gravity`, `hueShift`, `audioReact`, `launchSpread`, `seed` | Audio-reactive fireworks with ember launch tails, deterministic shell timing, sparkling burst spokes, and smoky bloom rings. |
| `cosmic_voyage` | `speed`, `warp`, `starDensity`, `galaxyGlow`, `nebula`, `asteroidDensity`, `planetCount`, `parallax`, `bloom`, `seed` | Cinematic deep-space flythrough with layered galaxies, planets, and asteroid belts. |
| `caustics` | `scale`, `speed`, `intensity`, `contrast`, `warp`, `detail`, `background`, `color`, `glow`, `seed`, `audioReactive`, `driftX`, `driftY` | Animated refractive caustic web with converging bright filaments and soft glow bloom. |
| `prism_bloom` | `bloom`, `flow`, `petalCount`, `smear`, `prismShift`, `vignette`, `audioReact`, `seed` | Painterly prism petals and spectral bloom clouds for a tasteful AI-art showcase beat. |
| `velvet_dreamscape` | `bloom`, `flow`, `ribbonCount`, `grain`, `hueDrift`, `focus`, `audioReact`, `seed` | Layered silk ribbons, luminous blooms, and gallery grain for a tasteful AI-art statement shot. |
| `platformerScroll` | `speed`, `seed`, `tileSize`, `groundRatio`, `parallaxFar`, `parallaxMid`, `parallaxFront`, `audioReact`, `beatKick`, `platformRate`, `platformMaxSteps`, `skyGlow`, `speedLines`, `collectibleRate` | Deterministic side-scrolling platformer parallax scene with twinkling sky glow, speed streaks, polished bobbing pickups, and a colorful neon astronaut mascot runner. |
| `tetris_matrix` | `speed`, `level`, `glow`, `contrast`, `ghost`, `seed` | Self-playing falling-block match with all 12 pentominoes, clearer side-panel HUD spacing, safe top-out game-over restarts, and visible mid-air spins plus quick-drop/hesitation choices in tricky spots. |
| `matrix_rain` | `speed`, `density`, `fontSize`, `trail`, `glow`, `brightness`, `jitter`, `audioReact`, `glyphSet`, `seed` | Matrix-style falling code rain tuned for slower, smoother descent with smaller glyphs and subtle default jitter. |
| `tilingMorph` | `scale`, `morphSpeed`, `morphAmount`, `rotationSpeed`, `lineWidth`, `fillAlpha`, `paletteShift`, `audioReactive`, `cellJitter`, `roundedness`, `contrast`, `seed`, `backgroundAlpha`, `mode` | Seam-safe lattice tiling morph that cycles square, diamond, skewed, and rounded-interlocking phases; `mode` supports `mono`, `palette`, `neon`. |
| `gameOfLife` | `cellSize`, `stepRate`, `seed`, `density`, `wrap`, `paletteMode`, `gridLines`, `fadeTrails`, `gliderRate`, `patternMode`, `burstOnBeat`, `survivalTint`, `safeFit` | Conway-style cellular automata with deterministic seeding, curated inserts, optional wrap edges, and restrained beat-triggered bursts/gliders. |
| `hexGridPulse` | `cellSize`, `speed`, `waveScale`, `rippleStrength`, `pulseStrength`, `lineWidth`, `fillAlpha`, `glowAlpha`, `audioReactive`, `paletteMix`, `invert` | Hexagonal lattice with travelling waves, radial ripples, and controlled audio-reactive pulse highlights across eras. |
| `doodle_greetz_wall` | `layout`, `transitionStyle`, `cycleSeconds`, `columns`, `padding`, `highlightPulse`, `beatPulseDecay`, `audioReact`, `title` | Pulls approved PNG doodles from the doodle API and renders them in `grid` or `carousel` layouts. |
| `lightning` | `trigger`, `chancePerSecond`, `cooldown`, `flashDuration`, `bolt`, `branches`, `seed` | `trigger` supports `beat`, `random`, `both`. |
| `effect_evolution` | `density`, `motion`, `warp`, `trail`, `seed` | Reinterprets the same lattice across eras. |
| `amiga_showcase` | `barCount`, `barSpeed`, `barWaveAmp`, `barWaveFreq`, `barSaturation`, `bobCount`, `bobRadius`, `bobTrail`, `bobIntensity`, `twistWidth`, `twistAmp`, `twistSpeed`, `twistSlices`, `twistHueSpeed`, `twistX`, `glenz`, `audioReact` |  |
| `twister` | `x`, `baseWidth`, `amplitude`, `turns`, `speed`, `sliceH`, `sat`, `hueSpeed`, `minWidthScale`, `maxWidthScale`, `minAlpha`, `maxAlpha`, `edgeShade`, `background`, `trailFade`, `texture`, `audioReact`, `beatKick` | `x` accepts pixels or normalized 0-1; `background` supports `clear` or `fade`; `texture` supports `solid` or `pattern`. |
| `sine_scroller_logo` | `message`, `fontSize`, `speed`, `waveAmp`, `waveSpeed`, `wavePhaseStep`, `scrollerY`, `scrollerX`, `layer2`, `layer2Speed`, `layer2FontSize`, `layer2Y`, `logoText`, `logoFontSize`, `logoY`, `scanlineStep`, `logoWaveAmp`, `logoWaveSpeed`, `logoWaveFreq`, `audioReact`, `beatBoost` | Scroll + sine wave + scanline logo wobble. |
| `soft_shadows` | `count`, `lightAngle`, `lightSweep`, `height`, `shadowLength`, `softness`, `contactHardness`, `passCount`, `objectSize`, `motion`, `floorGlow`, `audioReactive`, `palette` | Layered faux-PCF floor shadows with deterministic contact hardening and smooth penumbra falloff. `palette` supports `studio`, `sunset`, or `mono`. |
| `lens_flare` | `intensity`, `sourceX`, `sourceY`, `haloRadius`, `ghostCount`, `ghostSpread`, `streakStrength`, `ringStrength`, `chromatic`, `audioReactive`, `shimmer`, `bgDim`, `seed`, `blendBias` | Cinematic optical flare with centered ghost chains, soft rings, and an optional anamorphic streak. |
| `lens_wobbler` | `bufW`, `bufH`, `rotSpeed`, `baseScale`, `zoomAmp`, `zoomSpeed`, `scrollU`, `scrollV`, `lensRadius`, `lensStrength`, `invertRing`, `wobble`, `wobbleAmp`, `wobbleFreq`, `wobbleSpeed`, `wobbleSlice`, `audioReact`, `beatKick`, `seed`, `lensPath` | Bubble lens warp with optional jelly wobble. |
| `shadebobs_bobs` | `mode`, `shadeCount`, `bobCount`, `shadeScale`, `blobRadius`, `trailFade`, `blend`, `hueSpeed`, `steer`, `maxSpeed`, `spriteSize`, `boingCheckers`, `bobAlpha`, `fastBlob`, `audioReact`, `beatPulseStrength`, `dirtyRects`, `seed` | Amiga-style bobs mixed with shadebobs interference. |
| `sine_distorter` | `mode`, `amp`, `freq`, `speed`, `slice`, `phase`, `sourceScale`, `edges`, `source`, `logoText`, `audioReact`, `beatBoost`, `glow` | Wavy glass distorter (scanline or column sine shifts). |
| `fractal_zoomer` | `setType`, `zoom`, `centerX`, `centerY`, `iterations`, `paletteSpeed`, `audioReact` | `setType` supports `mandelbrot`, `julia`, or `burningShip`. |
| `explicitpixels` | `mode`, `speed`, `audioReact` | `mode` supports `explicit` (generated wall of byte assignments) or `procedural` (loop-driven animation). |
| `raymarch_fractal` | `quality`, `fractal`, `cameraRadius`, `cameraHeight`, `cameraOrbitSpeed`, `paletteSpeed`, `audioReact`, `beatKick`, `fractalScale` | `fractal` supports `mandelbulb` or `mandelbox`. |

#### voxel_world_builder intended usage

Use `voxel_world_builder` for the lyric moment **"we can build whole worlds, all we have to do is ask for it"** and drive the staged assembly with timeline automation over the section duration.

Recommended section setup:

```json
{
  "id": "rap-world-build",
  "start": "03:44.4",
  "end": "03:49.2",
  "effect": "voxel_world_builder",
  "params": {
    "buildProgress": 0,
    "cityDensity": 0.62,
    "glow": 0.85,
    "cameraLift": 0.15
  },
  "automation": [
    { "param": "buildProgress", "from": 0.0, "to": 1.0, "t0": "03:44.4", "t1": "03:49.2", "ease": "inOutSine" },
    { "param": "cameraLift", "from": 0.05, "to": 0.3, "t0": "03:44.4", "t1": "03:49.2", "ease": "inOutSine" },
    { "param": "glow", "from": 0.65, "to": 1.05, "t0": "03:47.8", "t1": "03:49.2", "ease": "outQuad" }
  ]
}
```

Automation guidance by phase:

- `buildProgress` **0.0 → 0.4**: terrain rises from flat ground.
- `buildProgress` **0.4 → 0.8**: city blocks/buildings extrude.
- `buildProgress` **0.8 → 1.0**: emissive intensity and window flicker become dominant.
- Keep `cityDensity` mostly static per shot for structural readability (recommended `0.5`–`0.75`).
- Use a gentle `cameraLift` ramp (for example +`0.2`) to avoid perspective popping at low resolutions (320×180).

#### bumpmap_plane parameters

Defaults shown are from the built-in effect configuration:

- `bufW` (default `240`): internal buffer width (lower = faster).
- `bufH` (default `180`): internal buffer height (lower = faster).
- `bumpStrength` (default `0.035`): height gradient scale for normals.
- `ambient` (default `0.2`): base ambient light contribution.
- `diffuseStrength` (default `1.05`): Lambertian diffuse multiplier.
- `specStrength` (default `0.35`): specular highlight multiplier.
- `shininess` (default `24`): specular exponent (higher = tighter highlight).
- `lightZ` (default `120`): light height above the plane.
- `lightSpeed` (default `1.0`): time scale for light motion.
- `embossText` (default `"BUMP"`): text to emboss; set to `""` to disable.
- `embossStrength` (default `70`): added height for embossed text.
- `animateBumps` (default `true`): enable animated wave component.
- `waveAmp` (default `18`): animated wave amplitude.
- `waveFreqX` (default `0.08`): animated wave frequency along X.
- `waveFreqY` (default `0.06`): animated wave frequency along Y.
- `baseHue` (default `200`): base hue when `paletteMode` is `hsl`.
- `paletteMode` (default `"ramp"`): `ramp` or `hsl`.
- `scanlines` (default `false`): draw scanline overlay.
- `audioReact` (default `0.7`): audio reaction strength.
- `beatKick` (default `0.7`): beat pulse intensity.
- `seed` (default `0`): procedural height map seed.

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

- Click anywhere or use the stylized **Execute** control to begin playback (audio + visuals).
- The start overlay and end overlay now pair that demoscene-styled call-to-action with a subtle, bottom-anchored **Spread the signal** link-style control. On supported devices it opens the native share sheet; otherwise it reveals quick-share links for LinkedIn, X, Facebook, Reddit, email, plus a copy-link fallback.
- The browser tab title now animates with unicode spinner glyphs, a subscript clock, and a binary counter for a glitchy demoscene-style status feed.
- `R` to restart
- At the end screen, use **Add a doodle** to draw and submit a doodle for moderation; the modal now includes multiple brush colours plus an adjustable brush size slider, and approved doodles only appear in `doodle_greetz_wall` after someone opens the review page and approves them.
- At the end screen, use **Got an effect idea? Make it real!** to open the effect-idea modal, describe a concept, generate TypeScript/runtime code through the OpenAI Codex API, preview it live, and submit it to a moderation queue before it can appear as an effect option.
- Generated runtime code is sandboxed by policy checks, but now intentionally errs on allowing general JavaScript patterns (including dynamic helper patterns such as `eval`/`Function`/`import()`/`require()`) unless code attempts side-effects that are unnecessary for visual rendering.
- For best generation reliability, favor prompts that imply deterministic helper functions, lookup tables, and explicit state updates.
- `F` to toggle fullscreen (if supported)
- `D` to toggle the debug overlay (timestamp, skip intro, skip to second half, skip to end, transition selection, effect overrides, monochrome toggle)
- The debug overlay shows WebGL status as `OK` or `FALLBACK` when available.
- The debug overlay now groups controls into `Transport`, `Effects`, and `Render` sections; on mobile/touch it uses tabs plus an internal scroll region so controls stay reachable without page scrolling.
- Selecting an effect in the `Effects` section reveals effect-specific controls (or a note when none are available) and still supports copying timeline-ready JSON.
- Easter egg: in devtools, set the debug effect selector value to `__random` before triggering `change` to force a random effect pick for quick inspiration.
- The same `Effects` panel now includes an **Edit param value limits** mode that exposes `min / current / max` inputs per numeric parameter, auto-expands draft limits when current values exceed bounds, and saves applied limits to the shared `/api/effects?action=paramLimits` datastore via **Apply new limits** so clamp thresholds update for all users without editing code.
- The serverless view/doodle APIs accept either the legacy `KV_*` Upstash variables or the newer `DB2_KV_*` prefixed variants. If any `DB2_*` variable is present, the API locks to the DB2 configuration and ignores legacy `KV_*` values. Use the REST URL/token variables (`*_KV_REST_API_URL`, `*_KV_REST_API_TOKEN`, and optionally `*_KV_REST_API_READ_ONLY_TOKEN`); copied values are trimmed, and raw `redis://` URLs are ignored by the REST client.
- Doodle submissions now land in a pending moderation queue. The public doodle wall only reads approved doodles, while pending doodles stay hidden until approved via the signed review flow. Set `DOODLE_MODERATION_TOKEN` (or legacy `DOODLE_ADMIN_TOKEN`) to enable the review page at `/review.html?id=...&token=...`, direct moderation actions through `/api/doodles?action=approve|reject&id=...&token=...`, and queue inspection through `/api/doodles?includePending=1&token=...`.
- To get fast phone notifications for new doodles, set `DOODLE_MODERATION_BASE_URL` to your public site URL and configure either `DOODLE_MODERATION_WEBHOOK_URL` for a custom JSON webhook payload or `DOODLE_MODERATION_NTFY_URL` (plus optional `DOODLE_MODERATION_NTFY_TOKEN`) to push a message through ntfy. The webhook payload includes the review URL plus direct moderation endpoints, while the ntfy notification sets a default click action that opens the signed doodle review page.
- The effect-idea generator requires an OpenAI API key on the server. Set `OPENAI_API_KEY` and (optionally) `OPENAI_CODEX_MODEL` if you want to override the default model (`gpt-5-codex`), then redeploy.
- Effect idea moderation uses `EFFECT_MODERATION_TOKEN` (falls back to `DOODLE_MODERATION_TOKEN` / `DOODLE_ADMIN_TOKEN`). Each submission now gets a signed review page at `/effect-review.html?id=...&token=...` with live preview + submitted code, approve/reject links still use `/api/effects?action=approve|reject&id=...&token=...`, and pending queue inspection stays at `/api/effects?includePending=1&token=...`.
- Run `npm run test:integration` in an environment with the DB2 secrets set to verify the live Upstash database exists and can be read/written. If the DB2 URL is malformed, the APIs now fail closed instead of crashing with a 500 during Redis client creation. The serverless API modules also use explicit `.js` ESM imports so Vercel can resolve the emitted files correctly.
- Append `?editor=1` in dev builds to open the Scene + Timeline Editor (or toggle "Editor mode" in the debug overlay). The editor shows a live preview, edits hot-apply to the running demo, and changes persist to localStorage.
- The timeline editor layout uses a narrow Scenes sidebar, a center workspace with Preview plus a single accordion stack for Basic/Main Slots/Transition, and a right Inspector for scene/layer/cue editing. The Generate Text Cues tool opens from a bottom-left button as a modal.
- The timeline area now dedicates at least half the editor height, renders all scenes on the main track, adds extra rows for selected-scene layers and scene automation entries, and exposes text cues on their own global timeline row for independent editing/seeking.
- Selecting a text cue in the timeline now swaps the left-side top panel (where Basic/Main Slots/Transition normally appears) into a cue editor for that selected cue, instead of listing all cues in the right inspector.
- The left top panel is now height-capped with internal scrolling, so long text-cue forms no longer push the timeline down.
- Text-cue timeline rendering now uses duration bars plus compact start markers (click marker to select/seek), improving selection when many cues overlap.
- Selected text cues are highlighted in the timeline track, marker glyphs are larger for readability, and marker clicks seek slightly into the cue so the paused preview reliably shows it.
- The text cue properties panel is now denser (multi-column layout), drops cue ID editing, uses timecode-style start/end fields, includes a compact font dropdown with classic system faces plus Google fonts (Audiowide, Orbitron, Press Start 2P, and more), and exposes colour via a flyout colour picker.
- Text cue duration bars are now thinner and aligned with marker rows, and the text cue panel is rendered as a non-collapsing block so editing values does not auto-collapse the section.
- Automation clip editing foundations now treat automation as point-driven envelopes (per-segment curve type + tension metadata), with helpers for snapped point add/remove/move, slide-mode temporal shifting, and segment-level curve/tension updates for timeline UI integration.
- In the Scene Automation table, each automation row now includes **+Pt** to seed/edit point-based clip data from legacy `from/to` ramps for timeline-envelope workflows.
- Automation interaction model mirrors FL-style priorities in code: point hit > segment hit > empty hit, with optional grid-snapped step drawing and axis constraints for pulse-like horizontal/vertical edits.
- Clip-edit operations preserve adjacent segment metadata when adding/removing points so curve/tension edits remain stable during iterative shaping.
- Scene Automation rows now render an inline curve editor: click on empty graph space to add points, drag points to move (hold Shift to slide following points in time), right-click points to delete, and hold Alt while dragging/clicking to temporarily disable snap.
- Timeline automation tracks now render envelope lines directly in-lane (matching inspector clips), and the playlist supports deeper vertical zoom directly from **Alt + mouse wheel** (no separate V+/V- buttons).
- The timeline now shows both horizontal and vertical custom scrollbars; drag the horizontal thumb to pan time, drag its end handles to zoom the visible time window, and use the vertical thumb for tall track stacks.
- The vertical timeline scrollbar now mirrors horizontal behavior: drag the thumb to pan tracks, and drag the top/bottom thumb handles to resize the visible vertical window (track zoom) around the current stack.
- The timeline ruler supports click-drag loop selection: drag across the top time bar to create a loop range overlay, use **Clear loop selection** to reset it, and scene selection won’t seek while a timeline loop selection is active.
- Timeline custom scrollbars are anchored inside the timeline panel (not the full page edge) and reserve internal right/bottom padding so bars remain visible on narrow screens.
- The vertical timeline scrollbar thumb is draggable (not just clickable) and the timeline/preview sizing now prioritises keeping the horizontal timeline scrollbar visible at normal 100% browser zoom on 1080p layouts.
- While zoomed in, use **Shift + mouse wheel** (or horizontal trackpad scroll) to pan left/right across the playlist without resetting zoom.
- Playlist quick controls: mouse wheel = horizontal zoom to cursor, **Alt + mouse wheel** = vertical track zoom, Shift+wheel/horizontal scroll = pan timeline, drag empty lane = scrub pan.
- The playlist now includes a dedicated timeline scrollbar under the lanes; the thumb shrinks as you zoom in and can be dragged/clicked for coarse navigation across the full song length.
- Native browser scrollbars for the playlist lane are intentionally hidden so the custom timeline scrollbar is the single visible navigation control.
- In editor mode, scene duration is now derived from the next scene start (the End field is display-only), so looping and active-scene selection match runtime behavior where the newest started scene is the one that renders.
- Scene/layer parameter editing now uses control-aware numeric inputs with clearer `Param`/`Value` labels: bounded params get a slider + numeric spinner with +/- nudge buttons, while unbounded numeric params get touch-friendly spinner controls. Focused `input[type=number]` fields now consume the mouse wheel globally (no page scroll) and step by their configured bounds/step values.
- Playback now auto-syncs across same-origin tabs/windows via `BroadcastChannel`, so play/pause/seek/restart actions in one editor window mirror to the others (handy for running multiple preview sizes side-by-side).
- The editor's Text Cues panel now includes a bulk generator: paste words/new lines, set font/colour/size/position/alignment plus start/end timing, and auto-create evenly timed cue sequences (useful for ~100 words over ~30 seconds).
- On touch devices, two floating buttons appear in the lower-right corner: `DBG` toggles the debug overlay and `⛶` toggles fullscreen.

### Phone notifications via ntfy (recommended)

If you want your phone to buzz the moment someone submits a doodle, the simplest path is to use `ntfy`. The app is available for Android and iPhone, and this project already knows how to publish moderation messages to an ntfy topic.

1. Pick a long, hard-to-guess topic name, for example `doodle-moderation-a8f4c2e91b7d`.
2. In your deployment environment, set these variables:

   ```bash
   DOODLE_MODERATION_TOKEN=replace-this-with-a-long-random-secret
   DOODLE_MODERATION_BASE_URL=https://your-public-site.example.com
   DOODLE_MODERATION_NTFY_URL=https://ntfy.sh/doodle-moderation-a8f4c2e91b7d
   ```

   Optional if you run a protected/self-hosted ntfy server:

   ```bash
   DOODLE_MODERATION_NTFY_TOKEN=your-ntfy-access-token
   ```

3. Redeploy the site so the serverless doodle API sees the new environment variables.
4. On your phone, install the official ntfy app:
   - Android: Google Play, F-Droid, or the official APK/GitHub release.
   - iPhone: App Store.
5. Open the ntfy app, add a subscription, and subscribe to the same topic name you configured above on the `ntfy.sh` server (or your self-hosted ntfy server if you are not using `ntfy.sh`).
6. Allow notifications when iOS/Android prompts you. If your phone has per-app notification settings disabled, re-enable them in the system settings before testing.
7. Submit a test doodle from the site. Your phone should receive a notification titled `Doodle awaiting approval`.
8. Tap the notification itself. ntfy uses its default click action to open the signed `/review.html?...` page for that doodle.
9. Review the doodle image on that page, then use the **Approve** or **Deny** buttons at the bottom to finish moderation in the browser.

Quick verification from a laptop/terminal before testing the site itself:

```bash
curl -H "Title: ntfy doodle test" -d "If you can read this on your phone, ntfy is wired up." https://ntfy.sh/doodle-moderation-a8f4c2e91b7d
```

If that curl command appears on your phone but doodle submissions do not, double-check `DOODLE_MODERATION_BASE_URL`, `DOODLE_MODERATION_TOKEN`, and `DOODLE_MODERATION_NTFY_URL`, then redeploy.

### Effect idea generator setup (OpenAI + moderation)

To use **Got an effect idea? Make it real!** in deployed environments, configure these variables:

```bash
OPENAI_API_KEY=sk-...
# Optional override; defaults to gpt-5-codex
OPENAI_CODEX_MODEL=gpt-5-codex

# Required if you want token-protected effect moderation endpoints
EFFECT_MODERATION_TOKEN=replace-with-a-long-random-secret

# Optional effect-specific moderation notifications
EFFECT_MODERATION_BASE_URL=https://your-public-site.example.com
EFFECT_MODERATION_NTFY_URL=https://ntfy.sh/effect-moderation-topic
EFFECT_MODERATION_NTFY_TOKEN=your-ntfy-access-token

# Optional: allow trusted authenticated sessions by cookie/header identity
# Defaults: "__session,next-auth.session-token,__Secure-next-auth.session-token"
EFFECT_GENERATE_SESSION_COOKIE_NAMES=__session,next-auth.session-token,__Secure-next-auth.session-token

# Optional strict allowlists (comma-separated)
EFFECT_GENERATE_ALLOWLIST_IPS=203.0.113.10,198.51.100.17
EFFECT_GENERATE_ALLOWLIST_USERS=alice,moderator-42

# Optional rate limit tuning (defaults: 8 requests / 60 seconds per identity)
EFFECT_GENERATE_RATE_LIMIT_MAX=8
EFFECT_GENERATE_RATE_LIMIT_WINDOW_MS=60000

# Optional global daily cap (defaults to 100 generations/day across all users, UTC day boundary)
EFFECT_GENERATE_DAILY_CAP=100

# Optional generation failure alerting (defaults to moderation ntfy topic if omitted)
EFFECT_GENERATE_ALERT_NTFY_URL=https://ntfy.sh/your-effect-generate-alert-topic
EFFECT_GENERATE_ALERT_NTFY_TOKEN=your-alert-ntfy-access-token
# Optional per-category cooldown for alerts (default 300000ms / 5 minutes)
EFFECT_GENERATE_ALERT_COOLDOWN_MS=300000
```

Optional fallback token behavior:
- If `EFFECT_MODERATION_TOKEN` is not set, `/api/effects` moderation falls back to `DOODLE_MODERATION_TOKEN`, then `DOODLE_ADMIN_TOKEN`.
- Effect moderation notifications can use their own ntfy feed (`EFFECT_MODERATION_NTFY_URL`) or fall back to doodle ntfy settings (`DOODLE_MODERATION_NTFY_URL`).
- Generated effects are submitted into a pending queue; they only become selectable after approval via the signed review page (`/effect-review.html?id=...&token=...`) or direct API link (`/api/effects?action=approve&id=...&token=...`).
- `POST /api/effects?action=generate` is open by default (no auth friction), but it still recognizes trusted identities in this order for rate-limit keys and audit logs: signed moderation token, session identity, allowlisted user/IP, then fallback public IP.
- Generation prompts are trimmed and hard-capped at 3000 characters.
- Generate requests are rate limited per identity (`user`/`session`/`IP`) via KV-backed sliding window and return `429` with a friendly wait-time message (for example, “Please wait 5 minutes before trying again.”).
- Generate requests also enforce a global daily cap (default `100/day`, configurable via `EFFECT_GENERATE_DAILY_CAP`) and return `429` when the day budget is exhausted.
- Generate monitoring now persists aggregate counters + recent failure samples in KV so regressions can be tracked over time (status mix, failure categories, and timestamps).
- The generation system prompt is now versioned in KV (`effects:generate:prompt-template`) and can self-improve after failures; each failed attempt also logs the exact sent prompt, raw model response, user-facing error message, and failure timestamp (`effects:generate:failure-logs`).
- Self-improvement revisions are now triggered through a dedicated endpoint (`POST /api/effects?action=improvePromptTemplate`) between retries, so prompt updates are persisted before the next generate call.
- The effect-idea modal now auto-retries after failures (up to 5 self-improvement retries), including runtime-compile failures from generated code, shows active attempt counts, and falls back with an apology message when all retries are exhausted.
- Moderators can inspect those generation diagnostics via `GET /api/effects?action=generateMetrics&token=...` (signed moderation token required).
- Generation monitoring can also push proactive ntfy alerts on failures (with per-category cooldown) so you do not need to poll logs/metrics manually.
- If generation requests return `503` from `/api/effects?action=generate`, check that `OPENAI_API_KEY` is set in your deployed environment and redeploy so the serverless function picks it up.
- If generation fails with `Unable to parse generated effect response.`, the modal now shows the raw model output in the code panel so you can inspect formatting mismatches.
- The generator prompt now explicitly asks for `runtimeCode` as plain JavaScript (no TS annotations/import/export). The client still attempts to normalize module-style code (`export default function ...`) when possible.
- Server-side effect moderation/generation endpoints treat submitted/generated code as inert text only (validated/stored/returned), and never execute that code in the server environment. This keeps server secrets (for example `process.env` values) out of reach of model-generated effects.
- Before any generated runtime code is compiled for preview/review, the client applies a safety scanner that rejects primitives unrelated to rendering (for example environment-variable access like `process.env`, browser cookies/storage, and network APIs such as `fetch`/`XMLHttpRequest`/`sendBeacon`).
- Generated effect payloads now also include optional parameter control metadata (`params`) and concise docs (`docs`). After approval, these generated controls are exposed in the debug panel + editor parameter pickers just like built-in effects.
- The effect generator modal now keeps the initial prompt editor focused and roomy, then reveals preview/code/param sections only after a successful generation. While generating, it shows approved community effects in a carousel with previous/next controls (kept available whenever the busy panel is open) plus live param controls for the currently previewed approved effect in a dedicated busy panel beneath the preview (so controls do not overlap the prompt/canvas); those community params now sit behind a compact expandable “Community params” bar so the busy panel stays tidy by default, and the eventual submission uses the current preview param values as defaults automatically (no separate “set defaults” step).
- While effect generation is actively running, backdrop clicks and `Escape` no longer close the generator modal, preventing accidental loss of progress visibility.
- Effect generation and moderation preview now use `public/songloop.ogg` as a dedicated seamless background loop (low volume), while a synthetic preview timeline keeps generated effects animating continuously even as the audio loops.
- After approving or denying from `/effect-review.html`, the page now offers a **Next effect** button whenever additional pending effects are still in the moderation queue.
- The client also normalizes escaped code payloads (for example strings containing literal `\\n`) before compiling preview/runtime effects.

Expected `POST /api/effects?action=generate` failure codes:

| Status | Cause |
| --- | --- |
| `400` | Missing prompt or prompt exceeds 3000 characters. |
| `429` | Rate limit exceeded (either per-identity window or global daily cap). |
| `503` | OpenAI unavailable/misconfigured (for example missing `OPENAI_API_KEY`) or model response parse failure. |
