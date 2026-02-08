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
- The `rain` effect renders layered storm rain with turbulence, optional ground splashes, and low mist bands; tune `params` like `intensity`, `wind`, `speed`, `streakLength`, `splash`, `hue`, `storm`, `turbulence`, `mist`, and `seed`.
- The `lightning` effect renders brief flash overlays with optional bolt branches; tune `params` like `trigger`, `chancePerSecond`, `cooldown`, `flashDuration`, `bolt`, `branches`, and `seed`.
- The `treegrowth` effect renders a stylized, audio-reactive tree that grows branches outward; tune `params` like `speed`, `levels`, `trunkHeight`, `branchScale`, `branchAngle`, `trunkWidth`, `sway`, `leafSize`, `jitter`, `seed`, and `growth`.
- The `amiga_showcase` effect layers copperbars, shadebobs, a twister ribbon, and optional glenz vectors for a 16-bit demo part; tune `params` like `barCount`, `barSpeed`, `barWaveAmp`, `barWaveFreq`, `barSaturation`, `bobCount`, `bobRadius`, `bobTrail`, `bobIntensity`, `twistWidth`, `twistAmp`, `twistSpeed`, `twistSlices`, `twistHueSpeed`, `twistX`, `glenz`, and `audioReact`.
- The `chess` effect renders a deterministic, self-playing chess match driven by the timeline; tune pacing with `params.speed` or anchor with `params.startTime`.
- The `gl_fractal_tunnel` effect renders a WebGL2 raymarched tunnel with audio-reactive pulses and bloom; tune `params` like `quality`, `warp`, `hueShift`, `exposure`, and `seed`. It falls back to the `tunnel` effect when WebGL2 is unavailable.
- The `physics_pile` effect simulates a stack of 2D rigid bodies; tune `params` like `count`, `restitution`, `friction`, `gravity`, `kickImpulse`/`beatImpulse`, `kickRadius`, `scatterAngleDeg`, `scatterJitter`, `kickUpBias`, `kickTorque`, `loosenDuration`, `loosenFrictionMult`, `loosenRestitutionAdd`, `loosenPosCorrMult`, `loosenExtraSlop`, `maxLinVel`, `maxAngVel`, `kickOrigin`, `kickOriginY`, `sepBiasDeg`, `spawnMode`, `trail`, `seed`, `wreckingCue` (swings in a heavy ball), and `shatter` (freezes and dissolves the stack into particles).
- The `gl_impossible_corridor` effect renders a WebGL2 raymarched impossible corridor with bass-driven breathing, beat kicks, and treble shimmer; tune `params` like `quality`, `warp`, `hueShift`, `exposure`, `seed`, and `speed`. It falls back to the `tunnel` effect when WebGL2 is unavailable.
- The `neon_alley` effect renders a WebGL2 raymarched neon alley with audio-reactive shimmer; tune `params` like `quality`, `speed`, `exposure`, `hueShift`, and `seed`. It falls back to the `neon` effect when WebGL2 is unavailable.
- The `space_hangar` effect renders a WebGL2 raymarched sci-fi hangar flythrough with bass-driven camera shake; tune `params` like `quality`, `speed`, `exposure`, `hueShift`, and `seed`. It falls back to the `tunnel` effect when WebGL2 is unavailable.
- The `raymarch_fractal` effect renders a WebGL2 raymarched fractal emerging from a ground plane with audio-reactive palette shifts; tune `params` like `quality`, `fractal`, `cameraRadius`, `cameraHeight`, `cameraOrbitSpeed`, `paletteSpeed`, `audioReact`, `beatKick`, and `fractalScale`. It falls back to the `fractal` effect when WebGL2 is unavailable.
- The `wireframeRide` effect renders a WebGL2 wireframe terrain flythrough with neon gradients, fog, and audio-reactive pulses; tune `params` like `speed`, `gridWidth`, `gridDepth`, `gridResX`, `gridResZ`, `amplitude`, `noiseFreq`, `cameraHeight`, `fov`, `fog`, `neon`, `bassReactive`, `rmsReactive`, and `sun`. It falls back to the `isogrid` effect when WebGL2 is unavailable.
- The `roadDrive` effect renders a WebGL2 night highway drive with dashed lane markers, guardrail glow, and horizon fog; tune `params` like `speed`, `roadWidth`, `laneDashLength`, `laneGap`, `fog`, `glow`, `cameraBob`, `curveStrength`, `curveFrequency`, `bassReactive`, and `rmsReactive`. It falls back to the `isogrid` effect when WebGL2 is unavailable.
- The `portrait` effect pulls in `img/94B53814-80C3-4851-A6D3-A590FBB6022F.png` for a full-frame image glow; replace that file if you want a different portrait.
- The `intro` block controls the terminal presentation from `t=0` until `intro.end`; the first section must start exactly at the same time so the colour pipeline can take over. Script events are time-coded, so you can align story lines with audio or prior text cue timings.
- Visuals include subtle camera zoom and panning that respond to audio energy.
- Post-intro effects render on a 16:9 base canvas; landscape uses letterboxing, while portrait screens scale to fill the height and crop the sides.
- Append `?release=1` to the URL to load the release timeline and disable the debug overlay/keybinds.
- Rendering quality can be tuned via URL query params:
  - `?baseScale=2` multiplies the base canvas size (default `1`, clamped to `1`-`4`).
  - `?baseW=640&baseH=360` overrides the base canvas dimensions (must be 16:9 and between `320×180` and `1920×1080`).
  - `?quality=0.85` scales the effective base resolution for performance (default `1.0`, clamped to `0.65`-`1.0`).
  - `?autoQuality=1` enables dynamic quality scaling based on frame time (adjusts by `0.05` at most once per second).
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

### Timeline data schema

`public/timeline.json` and `public/timeline.release.json` follow this top-level shape:

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
      "transition": { "in": "fade", "out": "flash", "duration": 0.8 },
      "params": { "speed": 1.2 },
      "automation": [
        { "param": "speed", "from": 0.8, "to": 1.4, "t0": "00:54.15", "t1": "01:10.00", "ease": "linear" }
      ],
      "layers": [
        { "effect": "rain", "opacity": 0.5, "blend": "screen", "params": { "intensity": 0.9 } }
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
- `sections`: ordered effect schedule with IDs, timing, effect key, optional era preset (`8bit`, `16bit`, `ps1`, `pcdemo`, `future`), transitions, parameter overrides, optional automations, and optional layered effects.
- `textCues`: optional overlay callouts with timing, position, typography, and optional per-cue visual effects (glitch, shadow, scanline mask, and typewriter speed).
- Time fields accept either seconds (`number`) or timeline strings (`mm:ss` / `mm:ss.s`).

### Effect catalog

Each timeline section `effect` maps to one of the entries below. Include any of the parameters in a section `params` object; omit or set to defaults to use the built-in values.

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
| `textmode_charset` | `cols`, `rows`, `glyphSet`, `mode`, `speed`, `palette`, `scanlines`, `seed` | Coarse character-grid renderer with glyph ramps (` .:-=+*#%@`) and palette-indexed tinting. |
| `rotozoom` | `speed` |  |
| `blobs` | `count`, `radius`, `orbit`, `speed`, `glow` |  |
| `metaballs` | `bufW`, `bufH`, `count`, `baseRadius`, `radiusVar`, `baseThreshold`, `edgeSoftness`, `normalZ`, `ambient`, `diffuse`, `specStrength`, `shininess`, `rimStrength`, `palette`, `hueSpeed`, `smoothing`, `glow`, `audioReact`, `beatKick`, `seed` | Implicit surface metaballs with chrome/neon lighting; `palette` supports `chrome` or `neon`. |
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
| `textured_cube` | `scale`, `camDist`, `focalMul`, `rotXSpeed`, `rotYSpeed`, `rotZSpeed`, `backfaceCull`, `perspectiveCorrect`, `edge`, `edgeAlpha`, `shadeStrength`, `audioReact`, `beatKick`, `textureAnim` | Software-textured cube with optional affine/perspective mapping. |
| `portrait` | `zoom`, `drift` |  |
| `sphere3d` | `speed` |  |
| `spherecloud` | `speed` |  |
| `infinitycloud` | `speed` |  |
| `torus_orbit_3d` | `ringCount`, `pointsPerRing`, `majorRadius`, `minorRadius`, `spinSpeed`, `wobbleSpeed`, `depth`, `glow`, `palette`, `audioReact` | Orbiting 3D torus points; `palette` supports `teal`, `violet`, or `amber`. |
| `raytrace_spheres` | `quality`, `bufW`, `bufH`, `sphereCount`, `maxDepth`, `floorReflect`, `shininess`, `diffuseStrength`, `specStrength`, `ambient`, `fov`, `cellSize`, `adaptive`, `refineThreshold`, `refineGrow`, `aa`, `aaMode`, `outputSmoothing`, `forceAA`, `audioReact`, `beatKick`, `scanlines`, `seed` | Low-res software raytraced spheres with reflections. |
| `chess` | `speed`, `showHighlights`, `startTime` |  |
| `flyover` | `speed`, `horizon`, `seaDetail`, `waveSpeed`, `waveIntensity`, `islandCount`, `islandSeed`, `fog`, `palette`, `audioReactive` | `palette` supports `day`, `sunset`, `night`. |
| `voxel_landscape` | `bufW`, `bufH`, `speed`, `turnRate`, `turnWobble`, `camH`, `heightBob`, `beatBump`, `fov`, `horizon`, `scale`, `maxDist`, `stepBase`, `stepGrow`, `fogStrength`, `audioReact`, `beatKick`, `scanlines`, `seed` | Heightfield voxel landscape flyover. |
| `gl_fractal_tunnel` | `quality`, `warp`, `hueShift`, `exposure`, `seed` | Falls back to `tunnel` when WebGL2 is unavailable. |
| `physics_pile` | `count`, `restitution`, `friction`, `gravity`, `kickImpulse`, `beatImpulse`, `kickRadius`, `scatterAngleDeg`, `scatterJitter`, `kickUpBias`, `kickTorque`, `loosenDuration`, `loosenFrictionMult`, `loosenRestitutionAdd`, `loosenPosCorrMult`, `loosenExtraSlop`, `maxLinVel`, `maxAngVel`, `kickOrigin`, `kickOriginY`, `sepBiasDeg`, `spawnMode`, `trail`, `seed`, `wreckingCue`, `shatter` | `spawnMode` supports `pile` or `rain`. |
| `gl_impossible_corridor` | `quality`, `warp`, `hueShift`, `exposure`, `seed`, `speed`, `internalScale` | Falls back to `tunnel` when WebGL2 is unavailable. |
| `neon_alley` | `quality`, `speed`, `exposure`, `hueShift`, `seed` | Falls back to `neon` when WebGL2 is unavailable. |
| `space_hangar` | `quality`, `speed`, `exposure`, `hueShift`, `seed` | Falls back to `tunnel` when WebGL2 is unavailable. |
| `wireframeRide` | `speed`, `gridWidth`, `gridDepth`, `gridResX`, `gridResZ`, `amplitude`, `noiseFreq`, `cameraHeight`, `fov`, `fog`, `neon`, `bassReactive`, `rmsReactive`, `sun` | Falls back to `isogrid` when WebGL2 is unavailable. |
| `roadDrive` | `speed`, `roadWidth`, `laneDashLength`, `laneGap`, `fog`, `glow`, `cameraBob`, `curveStrength`, `curveFrequency`, `bassReactive`, `rmsReactive` | Falls back to `isogrid` when WebGL2 is unavailable. |
| `vector3d_balls` | `model`, `pointCount`, `wireframe`, `roundDots`, `baseDotSize`, `dotDepthScale`, `lineWidth`, `camDist`, `rotXSpeed`, `rotYSpeed`, `rotZSpeed`, `trail`, `stripeFreq`, `stripeSpeed`, `stripeStrength`, `palette`, `audioReact`, `beatKick`, `seed` | `model` supports `cube`, `sphere`, `torus`. `palette` supports `c64`, `spectrum`, `rainbow`. |
| `envmap_donut` | `bufW`, `bufH`, `segmentsU`, `segmentsV`, `R`, `r`, `camDist`, `focalMul`, `rotXSpeed`, `rotYSpeed`, `rotZSpeed`, `fresnelStrength`, `specStrength`, `shininess`, `chromeDesat`, `backfaceCull`, `scanlines`, `edge`, `audioReact`, `beatKick`, `seed` | Software environment-mapped chrome torus. |
| `poly_morph_showcase` | `lat`, `lon`, `morphSpeed`, `styleSpeed`, `style`, `camDist`, `focalMul`, `rotXSpeed`, `rotYSpeed`, `rotZSpeed`, `sat`, `baseHue`, `hueSpeed`, `solidAlpha`, `glenzAlpha`, `shadedAlpha`, `edge`, `edgeAlpha`, `sortSolid`, `sortShaded`, `sortGlenz`, `audioReact`, `beatKick`, `seed` | `style` supports `auto`, `solid`, `glenz`, `shaded`. |
| `glenz_vectors` | `model`, `instances`, `camDist`, `focal`, `rotXSpeed`, `rotYSpeed`, `rotZSpeed`, `baseHue`, `hueSpeed`, `sat`, `lightness`, `faceAlpha`, `edge`, `edgeAlpha`, `lineWidth`, `trailFade`, `sortFaces`, `audioReact`, `beatKick`, `seed` | `model` supports `cube`, `octa`, `icosa`; `sortFaces` supports `none` or `backToFront`. |
| `synthwaveSunset` | `horizon`, `sunRadius`, `stripeHeight`, `stripeGap`, `seaSpeed`, `starCount`, `glow`, `scanlines`, `audioReactive` |  |
| `rain` | `intensity`, `wind`, `speed`, `streakLength`, `splash`, `hue`, `storm`, `turbulence`, `mist`, `seed` | `storm` controls downpour density/velocity, `turbulence` adds sideways sway, and `mist` controls near-ground fog bands. |
| `platformerScroll` | `speed`, `seed`, `tileSize`, `groundRatio`, `parallaxFar`, `parallaxMid`, `parallaxFront`, `audioReact`, `beatKick`, `platformRate`, `platformMaxSteps` | Deterministic side-scrolling platformer parallax scene with looping platforms and runner silhouette. |
| `greets_wall` | `names`, `layout`, `transitionStyle`, `cycleSeconds`, `columns`, `padding`, `highlightPulse`, `beatPulseDecay`, `audioReact`, `title` | `layout` supports `grid` or `carousel`; `transitionStyle` supports `slide`, `fade`, or `pop`. |
| `lightning` | `trigger`, `chancePerSecond`, `cooldown`, `flashDuration`, `bolt`, `branches`, `seed` | `trigger` supports `beat`, `random`, `both`. |
| `effect_evolution` | `density`, `motion`, `warp`, `trail`, `seed` | Reinterprets the same lattice across eras. |
| `treegrowth` | `speed`, `levels`, `trunkHeight`, `branchScale`, `branchAngle`, `trunkWidth`, `sway`, `leafSize`, `jitter`, `seed`, `growth` | `growth` overrides the automatic growth cycle (0-1). |
| `amiga_showcase` | `barCount`, `barSpeed`, `barWaveAmp`, `barWaveFreq`, `barSaturation`, `bobCount`, `bobRadius`, `bobTrail`, `bobIntensity`, `twistWidth`, `twistAmp`, `twistSpeed`, `twistSlices`, `twistHueSpeed`, `twistX`, `glenz`, `audioReact` |  |
| `twister` | `x`, `baseWidth`, `amplitude`, `turns`, `speed`, `sliceH`, `sat`, `hueSpeed`, `minWidthScale`, `maxWidthScale`, `minAlpha`, `maxAlpha`, `edgeShade`, `background`, `trailFade`, `texture`, `audioReact`, `beatKick` | `x` accepts pixels or normalized 0-1; `background` supports `clear` or `fade`; `texture` supports `solid` or `pattern`. |
| `sine_scroller_logo` | `message`, `fontSize`, `speed`, `waveAmp`, `waveSpeed`, `wavePhaseStep`, `scrollerY`, `scrollerX`, `layer2`, `layer2Speed`, `layer2FontSize`, `layer2Y`, `logoText`, `logoFontSize`, `logoY`, `scanlineStep`, `logoWaveAmp`, `logoWaveSpeed`, `logoWaveFreq`, `audioReact`, `beatBoost` | Scroll + sine wave + scanline logo wobble. |
| `lens_wobbler` | `bufW`, `bufH`, `rotSpeed`, `baseScale`, `zoomAmp`, `zoomSpeed`, `scrollU`, `scrollV`, `lensRadius`, `lensStrength`, `invertRing`, `wobble`, `wobbleAmp`, `wobbleFreq`, `wobbleSpeed`, `wobbleSlice`, `audioReact`, `beatKick`, `seed`, `lensPath` | Bubble lens warp with optional jelly wobble. |
| `shadebobs_bobs` | `mode`, `shadeCount`, `bobCount`, `shadeScale`, `blobRadius`, `trailFade`, `blend`, `hueSpeed`, `steer`, `maxSpeed`, `spriteSize`, `boingCheckers`, `bobAlpha`, `fastBlob`, `audioReact`, `beatPulseStrength`, `dirtyRects`, `seed` | Amiga-style bobs mixed with shadebobs interference. |
| `sine_distorter` | `mode`, `amp`, `freq`, `speed`, `slice`, `phase`, `sourceScale`, `edges`, `source`, `logoText`, `audioReact`, `beatBoost`, `glow` | Wavy glass distorter (scanline or column sine shifts). |
| `fractal_zoomer` | `setType`, `zoom`, `centerX`, `centerY`, `iterations`, `paletteSpeed`, `audioReact` | `setType` supports `mandelbrot`, `julia`, or `burningShip`. |
| `raymarch_fractal` | `quality`, `fractal`, `cameraRadius`, `cameraHeight`, `cameraOrbitSpeed`, `paletteSpeed`, `audioReact`, `beatKick`, `fractalScale` | `fractal` supports `mandelbulb` or `mandelbox`. |

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

- Click to start (audio + visuals)
- `R` to restart
- `F` to toggle fullscreen (if supported)
- `D` to toggle the debug overlay (timestamp, skip intro, skip to second half, transition selection, effect overrides, monochrome toggle)
- The debug overlay shows WebGL status as `OK` or `FALLBACK` when available.
- When the debug overlay is visible, selecting an effect reveals a secondary panel with effect-specific controls (or a note when none are available).
- Append `?editor=1` in dev builds to open the Scene + Timeline Editor (or toggle "Editor mode" in the debug overlay). The editor shows a live preview, edits hot-apply to the running demo, and changes persist to localStorage.
- On touch devices, two floating buttons appear in the lower-right corner: `DBG` toggles the debug overlay and `⛶` toggles fullscreen.
