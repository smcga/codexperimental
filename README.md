# Demoscene AI 2022 Demo

Single-page demoscene-style web demo built with Vite + TypeScript, Canvas 2D, and Web Audio API.

## Requirements

- Node.js 18+ recommended

## Audio + timeline configuration

- Place an MP3 at `public/song.mp3` (replace the placeholder file).
- Edit `public/timeline.json` to change the intro terminal script, section timings, transitions, or text cues. Use `mm:ss` or `mm:ss.s` time strings for section and cue start/end values (for example, `01:44.5`).
- `public/timeline.release.json` is a release-cut timeline that adds per-section era presets and a curated arc for the graphics-history progression. Load it with the release URL flag described below.
- The bundled timeline includes lyric-style overlays in `textCues`; adjust or replace those cues to change the on-screen callouts synced to the music.
- Transition types include `fade`, `wipe`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `iris`, `flash`, `shatter`, `signal-collapse`, `camera-punch-through`, and `bitplane-wipe` (vertical VGA-style bands with staggered timing).
- Effect sections can include a `params` object to tune effect-specific settings such as starfield speed, warp, or turning intensity.
- Effects can animate numeric params with an `automation` array on a section or a layer; entries are applied in array order (last wins) and ease over absolute demo time.
- Sections can optionally define `layers` to mix multiple effects together, with `blend` modes like `screen` or `overlay` and per-layer `opacity`.
- The timeline includes two 3D showcase effects: `proper3d` (perspective projection + lighting) and `fake3d` (2D skew/shading tricks). The `sphere3d` effect renders a rotating lit point sphere with orbiting satellites.
- The `spherecloud` effect renders a glowing point-cloud sphere with subtle audio-reactive rotation and lighting.
- The `infinitycloud` effect renders a glowing point-cloud infinity loop with audio-reactive pulses and lighting.
- The `volumetric_clouds` effect renders layered procedural cloud banks with parallax depth and audio-reactive density pulses; tune `params` like `density`, `layers`, `windSpeed`, `cloudScale`, `detail`, `sunlight`, `haze`, and `audioReact`.
- The `flyover` effect renders a sky/sea flythrough with distant islands; tune `params` like `speed`, `horizon`, `seaDetail`, `islandSeed`, and `palette`.
- The `synthwaveSunset` effect renders an outrun sunset with a striped sun, neon sky, and reflective sea; tune `params` like `horizon`, `sunRadius`, `stripeHeight`, `stripeGap`, and `seaSpeed`.
- The `border_multiplex` effect fakes border-breaking sprites and multiplexed raster reuse; tune `params` like `hwSprites`, `totalSprites`, `bandHeight`, `spriteSize`, `speed`, `rasterJitter`, `borderMaskStrength`, `audioReact`, and `seed`.
- The `rain` effect renders layered storm rain with turbulence, optional ground splashes, and low mist bands; tune `params` like `intensity`, `wind`, `speed`, `streakLength`, `splash`, `hue`, `storm`, `turbulence`, `mist`, and `seed`.
- The `lightning` effect renders brief flash overlays with optional bolt branches; tune `params` like `trigger`, `chancePerSecond`, `cooldown`, `flashDuration`, `bolt`, `branches`, and `seed`.
- The `treegrowth` effect renders a more organic, audio-reactive tree that grows its structure over multiple years while foliage cycles through seasons; tune `params` like `speed`, `levels`, `trunkHeight`, `branchScale`, `branchAngle`, `trunkWidth`, `sway`, `leafSize`, `jitter`, `seed`, and `growth` (`-1` keeps the seasonal auto-cycle enabled).
- The `amiga_showcase` effect layers copperbars, shadebobs, a twister ribbon, and optional glenz vectors for a 16-bit demo part; tune `params` like `barCount`, `barSpeed`, `barWaveAmp`, `barWaveFreq`, `barSaturation`, `bobCount`, `bobRadius`, `bobTrail`, `bobIntensity`, `twistWidth`, `twistAmp`, `twistSpeed`, `twistSlices`, `twistHueSpeed`, `twistX`, `glenz`, and `audioReact`.
- The `chess` effect renders a deterministic, self-playing chess match with clearer, silhouette-driven pieces that better read as crowns, crosses, mitres, battlements, and horse heads; tune pacing with `params.speed` or anchor with `params.startTime`.
- The `gl_fractal_tunnel` effect renders a WebGL2 raymarched tunnel with audio-reactive pulses and bloom; tune `params` like `quality`, `warp`, `hueShift`, `exposure`, and `seed`. It falls back to the `tunnel` effect when WebGL2 is unavailable.
- The `physics_pile` effect simulates a stack of 2D rigid bodies; tune `params` like `count`, `restitution`, `friction`, `gravity`, `kickImpulse`/`beatImpulse`, `kickRadius`, `scatterAngleDeg`, `scatterJitter`, `kickUpBias`, `kickTorque`, `loosenDuration`, `loosenFrictionMult`, `loosenRestitutionAdd`, `loosenPosCorrMult`, `loosenExtraSlop`, `maxLinVel`, `maxAngVel`, `kickOrigin`, `kickOriginY`, `sepBiasDeg`, `spawnMode`, `trail`, `seed`, `wreckingCue` (swings in a heavy ball), and `shatter` (freezes and dissolves the stack into particles).
- The `gl_impossible_corridor` effect renders a WebGL2 raymarched impossible corridor with bass-driven breathing, beat kicks, and treble shimmer; tune `params` like `quality`, `warp`, `hueShift`, `exposure`, `seed`, and `speed`. It falls back to the `tunnel` effect when WebGL2 is unavailable.
- The `neon_alley` effect renders a WebGL2 raymarched neon alley with audio-reactive shimmer; tune `params` like `quality`, `speed`, `exposure`, `hueShift`, and `seed`. It falls back to the `neon` effect when WebGL2 is unavailable.
- The `space_hangar` effect renders a WebGL2 raymarched sci-fi hangar flythrough with bass-driven camera shake; tune `params` like `quality`, `speed`, `exposure`, `hueShift`, and `seed`. It falls back to the `tunnel` effect when WebGL2 is unavailable.
- The `raymarch_fractal` effect renders a WebGL2 raymarched fractal emerging from a ground plane with audio-reactive palette shifts; tune `params` like `quality`, `fractal`, `cameraRadius`, `cameraHeight`, `cameraOrbitSpeed`, `paletteSpeed`, `audioReact`, `beatKick`, and `fractalScale`. It falls back to the `fractal` effect when WebGL2 is unavailable.
- The `explicitpixels` effect can switch between a generated assignment-only static frame (`mode: "explicit"`) and an audio-reactive procedural animation (`mode: "procedural"`).
- The `wireframeRide` effect renders a WebGL2 wireframe terrain flythrough with neon gradients, fog, and audio-reactive pulses; tune `params` like `speed`, `gridWidth`, `gridDepth`, `gridResX`, `gridResZ`, `amplitude`, `noiseFreq`, `cameraHeight`, `fov`, `fog`, `neon`, `bassReactive`, `rmsReactive`, and `sun`. It falls back to the `isogrid` effect when WebGL2 is unavailable.
- The `roadDrive` effect renders a WebGL2 night highway drive with dashed lane markers, guardrail glow, and horizon fog; tune `params` like `speed`, `roadWidth`, `laneDashLength`, `laneGap`, `fog`, `glow`, `cameraBob`, `curveStrength`, `curveFrequency`, `bassReactive`, and `rmsReactive`. It falls back to the `isogrid` effect when WebGL2 is unavailable.
- The `lemmings_march` effect simulates a tiny colony spilling from a hatch, traversing deformable terrain, using contextual abilities, and scoring rescues through a goal portal; tune `params` like `spawnInterval`, `colonySize`, `worldLength`, `hilliness`, `wallRate`, `digRate`, `bashRate`, `bridgeRate`, `floatiness`, `scrollFollow`, and `seed`.
- The `prism_bloom` effect renders painterly spectral petals, soft bloom clouds, and drifting dust for a lush AI-art tableau; tune `params` like `bloom`, `flow`, `petalCount`, `smear`, `prismShift`, `vignette`, `audioReact`, and `seed`.
- The `velvet_dreamscape` effect renders flowing silk ribbons, luminous gallery blooms, and subtle film grain for an unabashedly tasteful AI-art hero shot; tune `params` like `bloom`, `flow`, `ribbonCount`, `grain`, `hueDrift`, `focus`, `audioReact`, and `seed`.
- The `tetris_matrix` effect renders a self-playing falling-block match with a monochrome handheld LCD vibe; tune `params` like `speed`, `level`, `glow`, `contrast`, `ghost`, and `seed`.
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
| `spectrum_analyzer` | `bands`, `smoothing`, `curve`, `tilt`, `peakHold`, `grid`, `glow` | Parametric-EQ-style spectrum trace with log-spaced bins and peak-hold markers. |
| `isogrid` | `opacity`, `lineWidth`, `spacing`, `wave`, `speed` |  |
| `neon` | `shapes`, `radius`, `radiusStep`, `speed`, `glow`, `lineWidth` |  |
| `particles` | `trail`, `burst`, `burstAudio`, `force`, `forceAudio` |  |
| `border_multiplex` | `hwSprites`, `totalSprites`, `bandHeight`, `spriteSize`, `speed`, `rasterJitter`, `borderMaskStrength`, `audioReact`, `seed` |  |
| `fluid` | `speed`, `dissipation`, `splatCount`, `splatSize`, `turbulence`, `hueShift`, `seed` |  |
| `smoke_simulation` | `density`, `flowSpeed`, `turbulence`, `swirl`, `diffusion`, `softness`, `emission`, `emitMode`, `scale`, `colorMode`, `hueShift`, `audioReactive`, `bassInfluence`, `midInfluence`, `trebleInfluence`, `seed`, `highlights` | `emitMode` supports `centre`, `bottom`, `random`; `colorMode` supports `mono` or `tinted`. |
| `boids_simulation` | `count`, `speed`, `cohesion`, `alignment`, `separation`, `neighborRadius`, `separationRadius`, `trail`, `size`, `seed` | Audio-reactive flocking simulation with wraparound space and neon boid trails. |
| `finale` | `trail`, `starSpeed`, `starWarp`, `starTurn`, `particleCount`, `particleForce`, `bars`, `barHeight` |  |
| `proper3d` | `speed` |  |
| `fake3d` | `speed` |  |
| `textured_cube` | `scale`, `camDist`, `focalMul`, `rotXSpeed`, `rotYSpeed`, `rotZSpeed`, `backfaceCull`, `perspectiveCorrect`, `edge`, `edgeAlpha`, `shadeStrength`, `audioReact`, `beatKick`, `textureAnim` | Software-textured cube with optional affine/perspective mapping. |
| `portrait` | `zoom`, `drift` |  |
| `sphere3d` | `speed` |  |
| `spherecloud` | `speed` |  |
| `infinitycloud` | `speed` |  |
| `volumetric_clouds` | `density`, `layers`, `windSpeed`, `cloudScale`, `detail`, `sunlight`, `haze`, `audioReact` | Layered procedural cloudscape with parallax and soft haze. |
| `torus_orbit_3d` | `ringCount`, `pointsPerRing`, `majorRadius`, `minorRadius`, `spinSpeed`, `wobbleSpeed`, `depth`, `glow`, `palette`, `audioReact` | Orbiting 3D torus points; `palette` supports `teal`, `violet`, or `amber`. |
| `raytrace_spheres` | `quality`, `bufW`, `bufH`, `sphereCount`, `maxDepth`, `floorReflect`, `shininess`, `diffuseStrength`, `specStrength`, `ambient`, `fov`, `cellSize`, `adaptive`, `refineThreshold`, `refineGrow`, `aa`, `aaMode`, `outputSmoothing`, `forceAA`, `audioReact`, `beatKick`, `scanlines`, `seed` | Low-res software raytraced spheres with reflections. |
| `chess` | `speed`, `showHighlights`, `startTime` | Deterministic self-playing chess match with clearer silhouette-led pieces, distinctive major-piece markers, and move highlights. |
| `flyover` | `speed`, `horizon`, `seaDetail`, `waveSpeed`, `waveIntensity`, `islandCount`, `islandSeed`, `fog`, `palette`, `audioReactive` | `palette` supports `day`, `sunset`, `night`. |
| `voxel_landscape` | `bufW`, `bufH`, `speed`, `turnRate`, `turnWobble`, `camH`, `heightBob`, `beatBump`, `fov`, `horizon`, `scale`, `maxDist`, `stepBase`, `stepGrow`, `fogStrength`, `audioReact`, `beatKick`, `scanlines`, `seed` | Heightfield voxel landscape flyover with portrait-aware camera framing. |
| `voxel_world_builder` | `buildProgress`, `cityDensity`, `glow`, `cameraLift`, `seed` | WebGL2 instanced voxel city assembler (64x64 cubes); falls back to Canvas2D isometric voxels when WebGL2 is unavailable. |
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
| `taco_meteor_shower` | `shellCount`, `fallSpeed`, `swirl`, `burst`, `stardust`, `toppingSpread`, `audioReact`, `seed` | Luminescent taco shells cascade like meteors, shed sparkling stardust, and splat into avocado/cilantro/salsa confetti. |
| `rain` | `intensity`, `wind`, `speed`, `streakLength`, `splash`, `hue`, `storm`, `turbulence`, `mist`, `seed` | `storm` controls downpour density/velocity, `turbulence` adds sideways sway, and `mist` controls near-ground fog bands. |
| `rainbow_cat` | `speed`, `rainbowLength`, `bounce`, `sparkle`, `trailAlpha`, `catScale`, `starDensity`, `seed` | Synth-night rainbow cat silhouette with swishing tail, trotting paws, glitter stars, and a configurable six-colour trail. |
| `water_drops` | `dropCount`, `minRadius`, `maxRadius`, `fallSpeed`, `distortion`, `trail`, `audioReact`, `tint`, `refraction`, `microDrops`, `rivulets`, `seed` | Stylized droplets on glass with dark/bright refractive edges, tiny bead clusters, and optional rivulet streaks. |
| `fireworks_display` | `shellRate`, `burstSize`, `glitter`, `trail`, `gravity`, `hueShift`, `audioReact`, `launchSpread`, `seed` | Audio-reactive fireworks with ember launch tails, deterministic shell timing, sparkling burst spokes, and smoky bloom rings. |
| `cosmic_voyage` | `speed`, `warp`, `starDensity`, `galaxyGlow`, `nebula`, `asteroidDensity`, `planetCount`, `parallax`, `bloom`, `seed` | Cinematic deep-space flythrough with layered galaxies, planets, and asteroid belts. |
| `lemmings_march` | `spawnInterval`, `colonySize`, `worldLength`, `hilliness`, `wallRate`, `digRate`, `bashRate`, `bridgeRate`, `floatiness`, `scrollFollow`, `seed` | Tiny colony sim with contextual climber/digger/basher/builder/floater behaviour, deformable terrain, and a rescue portal score. |
| `prism_bloom` | `bloom`, `flow`, `petalCount`, `smear`, `prismShift`, `vignette`, `audioReact`, `seed` | Painterly prism petals and spectral bloom clouds for a tasteful AI-art showcase beat. |
| `velvet_dreamscape` | `bloom`, `flow`, `ribbonCount`, `grain`, `hueDrift`, `focus`, `audioReact`, `seed` | Layered silk ribbons, luminous blooms, and gallery grain for a tasteful AI-art statement shot. |
| `platformerScroll` | `speed`, `seed`, `tileSize`, `groundRatio`, `parallaxFar`, `parallaxMid`, `parallaxFront`, `audioReact`, `beatKick`, `platformRate`, `platformMaxSteps` | Deterministic side-scrolling platformer parallax scene with looping platforms and a colorful cobalt mascot runner. |
| `tetris_matrix` | `speed`, `level`, `glow`, `contrast`, `ghost`, `seed` | Self-playing falling-block match with chunky monochrome shading and a dot-matrix handheld screen vibe. |
| `matrix_rain` | `speed`, `density`, `fontSize`, `trail`, `glow`, `brightness`, `jitter`, `audioReact`, `glyphSet`, `seed` | Matrix-style falling code rain tuned for slower, smoother descent with smaller glyphs and subtle default jitter. |
| `greets_wall` | `names`, `layout`, `transitionStyle`, `cycleSeconds`, `columns`, `padding`, `highlightPulse`, `beatPulseDecay`, `audioReact`, `title` | `layout` supports `grid` or `carousel`; `transitionStyle` supports `slide`, `fade`, or `pop`. |
| `doodle_greetz_wall` | `layout`, `transitionStyle`, `cycleSeconds`, `columns`, `padding`, `highlightPulse`, `beatPulseDecay`, `audioReact`, `title` | Pulls approved PNG doodles from the doodle API and renders them in `grid` or `carousel` layouts. |
| `lightning` | `trigger`, `chancePerSecond`, `cooldown`, `flashDuration`, `bolt`, `branches`, `seed` | `trigger` supports `beat`, `random`, `both`. |
| `effect_evolution` | `density`, `motion`, `warp`, `trail`, `seed` | Reinterprets the same lattice across eras. |
| `treegrowth` | `speed`, `levels`, `trunkHeight`, `branchScale`, `branchAngle`, `trunkWidth`, `sway`, `leafSize`, `jitter`, `seed`, `growth` | Tree structure grows continuously across years while foliage cycles by season; set `growth` to `-1` for auto or `0-1` to override. |
| `amiga_showcase` | `barCount`, `barSpeed`, `barWaveAmp`, `barWaveFreq`, `barSaturation`, `bobCount`, `bobRadius`, `bobTrail`, `bobIntensity`, `twistWidth`, `twistAmp`, `twistSpeed`, `twistSlices`, `twistHueSpeed`, `twistX`, `glenz`, `audioReact` |  |
| `twister` | `x`, `baseWidth`, `amplitude`, `turns`, `speed`, `sliceH`, `sat`, `hueSpeed`, `minWidthScale`, `maxWidthScale`, `minAlpha`, `maxAlpha`, `edgeShade`, `background`, `trailFade`, `texture`, `audioReact`, `beatKick` | `x` accepts pixels or normalized 0-1; `background` supports `clear` or `fade`; `texture` supports `solid` or `pattern`. |
| `sine_scroller_logo` | `message`, `fontSize`, `speed`, `waveAmp`, `waveSpeed`, `wavePhaseStep`, `scrollerY`, `scrollerX`, `layer2`, `layer2Speed`, `layer2FontSize`, `layer2Y`, `logoText`, `logoFontSize`, `logoY`, `scanlineStep`, `logoWaveAmp`, `logoWaveSpeed`, `logoWaveFreq`, `audioReact`, `beatBoost` | Scroll + sine wave + scanline logo wobble. |
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

- Click anywhere or use the stylized **Start demo** control to begin playback (audio + visuals).
- The start overlay and end overlay now pair that demoscene-styled call-to-action with a **Spread the signal** share control. On supported devices it opens the native share sheet; otherwise it reveals quick-share links for LinkedIn, X, Facebook, Reddit, email, plus a copy-link fallback.
- `R` to restart
- At the end screen, use **Add a doodle** to draw and submit a doodle for moderation; the modal now includes multiple brush colours plus an adjustable brush size slider, and approved doodles only appear in `doodle_greetz_wall` after someone opens the review page and approves them.
- `F` to toggle fullscreen (if supported)
- `D` to toggle the debug overlay (timestamp, skip intro, skip to second half, transition selection, effect overrides, monochrome toggle)
- The debug overlay shows WebGL status as `OK` or `FALLBACK` when available.
- When the debug overlay is visible, selecting an effect reveals a secondary panel with effect-specific controls (or a note when none are available).
- The serverless view/doodle APIs accept either the legacy `KV_*` Upstash variables or the newer `DB2_KV_*` prefixed variants. If any `DB2_*` variable is present, the API locks to the DB2 configuration and ignores legacy `KV_*` values. Use the REST URL/token variables (`*_KV_REST_API_URL`, `*_KV_REST_API_TOKEN`, and optionally `*_KV_REST_API_READ_ONLY_TOKEN`); copied values are trimmed, and raw `redis://` URLs are ignored by the REST client.
- Doodle submissions now land in a pending moderation queue. The public doodle wall only reads approved doodles, while pending doodles stay hidden until approved via the signed review flow. Set `DOODLE_MODERATION_TOKEN` (or legacy `DOODLE_ADMIN_TOKEN`) to enable the review page at `/review.html?id=...&token=...`, direct moderation actions through `/api/doodles?action=approve|reject&id=...&token=...`, and queue inspection through `/api/doodles?includePending=1&token=...`.
- To get fast phone notifications for new doodles, set `DOODLE_MODERATION_BASE_URL` to your public site URL and configure either `DOODLE_MODERATION_WEBHOOK_URL` for a custom JSON webhook payload or `DOODLE_MODERATION_NTFY_URL` (plus optional `DOODLE_MODERATION_NTFY_TOKEN`) to push a message through ntfy. The webhook payload includes the review URL plus direct moderation endpoints, while the ntfy notification sets a default click action that opens the signed doodle review page.
- Run `npm run test:integration` in an environment with the DB2 secrets set to verify the live Upstash database exists and can be read/written. If the DB2 URL is malformed, the APIs now fail closed instead of crashing with a 500 during Redis client creation. The serverless API modules also use explicit `.js` ESM imports so Vercel can resolve the emitted files correctly.
- Append `?editor=1` in dev builds to open the Scene + Timeline Editor (or toggle "Editor mode" in the debug overlay). The editor shows a live preview, edits hot-apply to the running demo, and changes persist to localStorage.
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
