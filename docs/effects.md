# Effects Reference

Generated from `src/renderer/effects/manifest/index.ts`.

Total effects: **99**.

## Table of contents

- [Effect: amiga_showcase](#effect-amiga-showcase)
- [Effect: blobs](#effect-blobs)
- [Effect: boids_simulation](#effect-boids-simulation)
- [Effect: bokeh](#effect-bokeh)
- [Effect: border_multiplex](#effect-border-multiplex)
- [Effect: bumpmap_plane](#effect-bumpmap-plane)
- [Effect: caustics](#effect-caustics)
- [Effect: chess](#effect-chess)
- [Effect: cloth_sim](#effect-cloth-sim)
- [Effect: copper_gradient_splits](#effect-copper-gradient-splits)
- [Effect: cosmic_voyage](#effect-cosmic-voyage)
- [Effect: doodle_greetz_wall](#effect-doodle-greetz-wall)
- [Effect: dotTunnel](#effect-dotTunnel)
- [Effect: effect_evolution](#effect-effect-evolution)
- [Effect: envmap_donut](#effect-envmap-donut)
- [Effect: equalizer](#effect-equalizer)
- [Effect: explicitpixels](#effect-explicitpixels)
- [Effect: explosionBurst](#effect-explosionBurst)
- [Effect: fake3d](#effect-fake3d)
- [Effect: feedback](#effect-feedback)
- [Effect: finale](#effect-finale)
- [Effect: fireworks_display](#effect-fireworks-display)
- [Effect: fluid](#effect-fluid)
- [Effect: flyover](#effect-flyover)
- [Effect: fractal](#effect-fractal)
- [Effect: fractal_zoomer](#effect-fractal-zoomer)
- [Effect: gameOfLife](#effect-gameOfLife)
- [Effect: gl_fractal_tunnel](#effect-gl-fractal-tunnel)
- [Effect: gl_impossible_corridor](#effect-gl-impossible-corridor)
- [Effect: glenz_vectors](#effect-glenz-vectors)
- [Effect: glitch](#effect-glitch)
- [Effect: god_rays](#effect-god-rays)
- [Effect: greets_wall](#effect-greets-wall)
- [Effect: hexGridPulse](#effect-hexGridPulse)
- [Effect: infiniteMirror](#effect-infiniteMirror)
- [Effect: infinite_zoom_droste](#effect-infinite-zoom-droste)
- [Effect: infinitycloud](#effect-infinitycloud)
- [Effect: isogrid](#effect-isogrid)
- [Effect: kaleidoscope_symmetry](#effect-kaleidoscope-symmetry)
- [Effect: kefrens_bars](#effect-kefrens-bars)
- [Effect: lens_flare](#effect-lens-flare)
- [Effect: lens_wobbler](#effect-lens-wobbler)
- [Effect: lightning](#effect-lightning)
- [Effect: lissajous](#effect-lissajous)
- [Effect: marble](#effect-marble)
- [Effect: matrix_rain](#effect-matrix-rain)
- [Effect: metaballs](#effect-metaballs)
- [Effect: moire_grid](#effect-moire-grid)
- [Effect: moving_shadow_map](#effect-moving-shadow-map)
- [Effect: neon](#effect-neon)
- [Effect: neon_alley](#effect-neon-alley)
- [Effect: particleAttractors](#effect-particleAttractors)
- [Effect: particles](#effect-particles)
- [Effect: physics_pile](#effect-physics-pile)
- [Effect: plasma](#effect-plasma)
- [Effect: platformerScroll](#effect-platformerScroll)
- [Effect: polar_tunnel](#effect-polar-tunnel)
- [Effect: poly_morph_showcase](#effect-poly-morph-showcase)
- [Effect: prism_bloom](#effect-prism-bloom)
- [Effect: proper3d](#effect-proper3d)
- [Effect: rain](#effect-rain)
- [Effect: raster_bars](#effect-raster-bars)
- [Effect: raymarch_fractal](#effect-raymarch-fractal)
- [Effect: raytrace_spheres](#effect-raytrace-spheres)
- [Effect: reactionDiffusion](#effect-reactionDiffusion)
- [Effect: recursiveFracture](#effect-recursiveFracture)
- [Effect: ribbons](#effect-ribbons)
- [Effect: roadDrive](#effect-roadDrive)
- [Effect: rotozoom](#effect-rotozoom)
- [Effect: shadebobs_bobs](#effect-shadebobs-bobs)
- [Effect: sine_distorter](#effect-sine-distorter)
- [Effect: sine_scroller_logo](#effect-sine-scroller-logo)
- [Effect: skeletal_ribbon](#effect-skeletal-ribbon)
- [Effect: skyboxTransition](#effect-skyboxTransition)
- [Effect: smoke_simulation](#effect-smoke-simulation)
- [Effect: soft_shadows](#effect-soft-shadows)
- [Effect: space_hangar](#effect-space-hangar)
- [Effect: spectrum_analyzer](#effect-spectrum-analyzer)
- [Effect: sphere3d](#effect-sphere3d)
- [Effect: spherecloud](#effect-spherecloud)
- [Effect: starfield](#effect-starfield)
- [Effect: synthwaveSunset](#effect-synthwaveSunset)
- [Effect: taco_meteor_shower](#effect-taco-meteor-shower)
- [Effect: tetris_matrix](#effect-tetris-matrix)
- [Effect: textmode_charset](#effect-textmode-charset)
- [Effect: textured_cube](#effect-textured-cube)
- [Effect: tilingMorph](#effect-tilingMorph)
- [Effect: torus_orbit_3d](#effect-torus-orbit-3d)
- [Effect: tunnel](#effect-tunnel)
- [Effect: twister](#effect-twister)
- [Effect: vector3d_balls](#effect-vector3d-balls)
- [Effect: velvet_dreamscape](#effect-velvet-dreamscape)
- [Effect: vga_fire](#effect-vga-fire)
- [Effect: volumetric_clouds](#effect-volumetric-clouds)
- [Effect: voronoi_cells](#effect-voronoi-cells)
- [Effect: voxel_landscape](#effect-voxel-landscape)
- [Effect: voxel_world_builder](#effect-voxel-world-builder)
- [Effect: water_drops](#effect-water-drops)
- [Effect: wireframeRide](#effect-wireframeRide)

## Cross-reference

### Blend modes (layers)

- `source-over`
- `screen`
- `overlay`
- `lighter`
- `multiply`
- `soft-light`
- `hard-light`
- `color-dodge`
- `difference`
- `exclusion`
- `xor`

### Common parameter patterns

- `speed` (used in 48 effects)
- `seed` (used in 46 effects)
- `audioReact` (used in 35 effects)
- `glow` (used in 19 effects)
- `beatKick` (used in 14 effects)
- `audioReactive` (used in 13 effects)
- `trail` (used in 10 effects)
- `scale` (used in 10 effects)
- `palette` (used in 10 effects)
- `hueShift` (used in 9 effects)
- `lineWidth` (used in 9 effects)
- `count` (used in 8 effects)

## Demoscene chronology (inferred)

The full chronology table is maintained in `docs/effect-chronology.md` and summarised below.

Best-effort chronology by effect style/approach lineage as inferred from each implementation.
Years are approximate "first-fit" dates in demoscene practice and not strict claims of first-ever appearance.

| Effect | Year fit | Confidence | Lineage anchor |
| --- | ---: | --- | --- |
| `raster_bars` | 1982 | high |  |
| `starfield` | 1982 | high |  |
| `sine_scroller_logo` | 1983 | high |  |
| `textmode_charset` | 1983 | high |  |
| `explicitpixels` | 1985 | low |  |
| `lissajous` | 1985 | medium |  |
| `moire_grid` | 1985 | medium |  |
| `doodle_greetz_wall` | 1986 | low | greets-wall presentation |
| `greets_wall` | 1986 | low | greets-wall presentation |
| `fake3d` | 1987 | medium |  |
| `gameOfLife` | 1987 | high | cellular automata part |
| `proper3d` | 1987 | medium |  |
| `kaleidoscope_symmetry` | 1988 | medium |  |
| `kefrens_bars` | 1988 | high |  |
| `plasma` | 1988 | high |  |
| `shadebobs_bobs` | 1988 | high |  |
| `sine_distorter` | 1988 | low |  |
| `sphere3d` | 1988 | low |  |
| `twister` | 1988 | high |  |
| `blobs` | 1989 | low |  |
| `isogrid` | 1989 | medium |  |
| `rotozoom` | 1989 | high |  |
| `tetris_matrix` | 1989 | medium | retro game homage part |
| `tunnel` | 1989 | high |  |
| `amiga_showcase` | 1990 | low | amiga megademo composite |
| `bokeh` | 1990 | low |  |
| `bumpmap_plane` | 1990 | medium |  |
| `copper_gradient_splits` | 1990 | low |  |
| `dotTunnel` | 1990 | medium |  |
| `envmap_donut` | 1990 | medium |  |
| `fractal` | 1990 | medium |  |
| `fractal_zoomer` | 1990 | medium |  |
| `glenz_vectors` | 1990 | high |  |
| `glitch` | 1990 | low |  |
| `lens_flare` | 1990 | low |  |
| `metaballs` | 1990 | high |  |
| `neon` | 1990 | low |  |
| `polar_tunnel` | 1990 | low |  |
| `poly_morph_showcase` | 1990 | low |  |
| `raytrace_spheres` | 1990 | high |  |
| `skeletal_ribbon` | 1990 | low |  |
| `textured_cube` | 1990 | high |  |
| `vector3d_balls` | 1990 | medium |  |
| `voronoi_cells` | 1990 | low |  |
| `voxel_landscape` | 1990 | medium | heightfield voxel flyover |
| `chess` | 1991 | low |  |
| `equalizer` | 1991 | medium |  |
| `feedback` | 1991 | medium |  |
| `finale` | 1991 | low |  |
| `particles` | 1991 | medium |  |
| `platformerScroll` | 1991 | medium | retro sidescroller homage |
| `soft_shadows` | 1991 | low |  |
| `spectrum_analyzer` | 1991 | medium |  |
| `cosmic_voyage` | 1992 | low |  |
| `flyover` | 1992 | medium |  |
| `infiniteMirror` | 1992 | medium | feedback mirror recursion |
| `marble` | 1992 | low |  |
| `particleAttractors` | 1992 | low |  |
| `vga_fire` | 1992 | high |  |
| `border_multiplex` | 1993 | low | sprite multiplex/border-break |
| `explosionBurst` | 1993 | low |  |
| `fireworks_display` | 1993 | low |  |
| `infinite_zoom_droste` | 1993 | medium | droste recursion zoom |
| `lightning` | 1993 | low |  |
| `rain` | 1993 | low |  |
| `recursiveFracture` | 1993 | low |  |
| `lens_wobbler` | 1994 | low |  |
| `ribbons` | 1994 | low |  |
| `tilingMorph` | 1995 | low |  |
| `matrix_rain` | 1999 | medium |  |
| `fluid` | 2001 | medium | fluid simulation |
| `reactionDiffusion` | 2001 | medium | reaction-diffusion simulation |
| `boids_simulation` | 2002 | medium | boids flocking simulation |
| `cloth_sim` | 2003 | medium | verlet cloth simulation |
| `smoke_simulation` | 2003 | medium | advection smoke simulation |
| `caustics` | 2004 | low | refractive caustics procedural |
| `physics_pile` | 2004 | medium | rigid-body simulation part |
| `torus_orbit_3d` | 2006 | low |  |
| `moving_shadow_map` | 2008 | low |  |
| `water_drops` | 2009 | low |  |
| `hexGridPulse` | 2010 | low |  |
| `raymarch_fractal` | 2010 | medium | raymarching fractal shader |
| `gl_fractal_tunnel` | 2011 | medium | raymarched tunnel shader |
| `gl_impossible_corridor` | 2011 | medium | raymarched corridor shader |
| `infinitycloud` | 2012 | low |  |
| `neon_alley` | 2012 | low | raymarched neon city shader |
| `space_hangar` | 2012 | low | raymarched sci-fi shader |
| `spherecloud` | 2012 | low |  |
| `roadDrive` | 2013 | medium | shader road flythrough |
| `synthwaveSunset` | 2013 | medium | retrowave sunset tableau |
| `wireframeRide` | 2013 | medium | shader wireframe flythrough |
| `volumetric_clouds` | 2014 | medium |  |
| `voxel_world_builder` | 2014 | medium | instanced voxel builder |
| `god_rays` | 2015 | medium |  |
| `skyboxTransition` | 2015 | low |  |
| `prism_bloom` | 2018 | low | painterly bloom composition |
| `velvet_dreamscape` | 2018 | low | painterly bloom composition |
| `effect_evolution` | 2020 | low | meta era-recap composition |
| `taco_meteor_shower` | 2020 | low | custom themed particle gag |

## Effects

## Effect: amiga_showcase

- **Registry key:** `amiga_showcase`
- **Implementation:** `src/renderer/effects/amigaShowcase.ts` (class `AmigaShowcaseEffect`)
- **Renderer:** Canvas2D
- **Description:** Amiga Showcase
- **Audio features:** bass, beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.7 | min 0, max 1 | Audio React | yes |
| `params.barCount` | number | 8 | min 1, max 12 | Bar Count | yes |
| `params.barSaturation` | number | 0.85 | min 0, max 1 | Bar Saturation | yes |
| `params.barSpeed` | number | 0.9 | min 0, max 4 | Bar Speed | yes |
| `params.barWaveAmp` | number | 18 | min 0, max 120 | Bar Wave Amp | yes |
| `params.barWaveFreq` | number | 1.2 | min 0, max 12 | Bar Wave Freq | yes |
| `params.bobCount` | number | 6 | min 1, max 64 | Bob Count | yes |
| `params.bobIntensity` | number | 1 | min 0, max 1 | Bob Intensity | yes |
| `params.bobRadius` | number | 0.12 | min 1, max 160 | Bob Radius | yes |
| `params.bobTrail` | number | 0.18 | min 0, max 1 | Bob Trail | yes |
| `params.glenz` | boolean | true | unspecified | Glenz | unknown |
| `params.twistAmp` | number | 70 | min 0, max 5 | Twist Amp | yes |
| `params.twistHueSpeed` | number | 55 | min 0, max 180 | Twist Hue Speed | yes |
| `params.twistSlices` | number | 120 | min 1, max 96 | Twist Slices | yes |
| `params.twistSpeed` | number | 1.1 | min 0, max 4 | Twist Speed | yes |
| `params.twistWidth` | number | 180 | min 0.05, max 0.8 | Twist Width | yes |
| `params.twistX` | number | 0.5 | min 0, max 1 | Twist X | yes |

### Minimal layer usage

```json
{
  "effect": "amiga_showcase",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: blobs

- **Registry key:** `blobs`
- **Implementation:** `src/renderer/effects/blobsEffect.ts` (class `BlobsEffect`)
- **Renderer:** Canvas2D
- **Description:** Blobs
- **Audio features:** bass, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.count` | number | 6 | min 1, max 12 | Count | yes |
| `params.glow` | number | 0.8 | min 0, max 1.5 | Glow | yes |
| `params.orbit` | number | 0.25 | min 0, max 0.6 | Orbit | yes |
| `params.radius` | number | 0.12 | min 0.05, max 0.3 | Radius | yes |
| `params.speed` | number | 0.6 | min 0, max ? | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "blobs",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: boids_simulation

- **Registry key:** `boids_simulation`
- **Implementation:** `src/renderer/effects/boidsSimulationEffect.ts` (class `BoidsSimulationEffect`)
- **Renderer:** Canvas2D
- **Description:** Audio-reactive flocking simulation with wraparound space and neon boid trails.
- **Audio features:** bass, beat, beatStrength, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.alignment` | number | 0.2 | min 0, max 1.2 | Alignment | yes |
| `params.cohesion` | number | 0.22 | min 0, max 1.2 | Cohesion | yes |
| `params.count` | number | 90 | min 8, max 240 | Count | yes |
| `params.neighborRadius` | number | 54 | min 8, max 160 | Neighbor Radius | yes |
| `params.seed` | number | 0 | min 0, max 999 | Seed | yes |
| `params.separation` | number | 0.45 | min 0, max 1.6 | Separation | yes |
| `params.separationRadius` | number | 18 | min 4, max 120 | Separation Radius | yes |
| `params.size` | number | 2 | min 1, max 5 | Size | yes |
| `params.speed` | number | 1 | min 0.1, max 3 | Speed | yes |
| `params.trail` | number | 0.18 | min 0.02, max 0.5 | Trail | yes |

### Minimal layer usage

```json
{
  "effect": "boids_simulation",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: bokeh

- **Registry key:** `bokeh`
- **Implementation:** `src/renderer/effects/bokehEffect.ts` (class `BokehEffect`)
- **Renderer:** Canvas2D
- **Description:** Bokeh
- **Audio features:** bass, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.alpha` | number | 0.15 | min 0.05, max 0.8 | Alpha | yes |
| `params.count` | number | 40 | min 10, max 120 | Count | yes |
| `params.hueShift` | number | 0 | min -180, max 180 | Hue Shift | yes |
| `params.radius` | number | 30 | min 4, max 80 | Radius | yes |
| `params.speed` | number | 0.7 | min 0, max 2 | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "bokeh",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: border_multiplex

- **Registry key:** `border_multiplex`
- **Implementation:** `src/renderer/effects/borderMultiplexEffect.ts` (class `BorderMultiplexEffect`)
- **Renderer:** Canvas2D
- **Description:** Border Multiplex
- **Audio features:** bass, beat, beatStrength
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.6 | min 0, max 1 | Audio React | yes |
| `params.bandHeight` | number | 24 | min 12, max 64 | Band Height | yes |
| `params.borderMaskStrength` | number | 0.3 | min 0, max 1 | Border Mask | yes |
| `params.hwSprites` | number | 8 | min 4, max 16 | HW Sprites | yes |
| `params.rasterJitter` | number | 1.5 | min 0, max 6 | Raster Jitter | yes |
| `params.seed` | number | 0 | min 0, max 999 | Seed | yes |
| `params.speed` | number | 60 | min 20, max 200 | Speed | yes |
| `params.spriteSize` | number | 12 | min 6, max 24 | Sprite Size | yes |
| `params.totalSprites` | number | 96 | min 16, max 160 | Total Sprites | yes |

### Minimal layer usage

```json
{
  "effect": "border_multiplex",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: bumpmap_plane

- **Registry key:** `bumpmap_plane`
- **Implementation:** `src/renderer/effects/bumpmapPlane.ts` (class `BumpmapPlaneEffect`)
- **Renderer:** Canvas2D
- **Description:** CPU bump-mapped plane with moving light and optional embossed text.
- **Audio features:** bass, beat
- **Performance notes:** Uses ImageData per frame; CPU cost scales with resolution.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.ambient` | number | 0.2 | min 0, max 1 | Ambient | yes |
| `params.animateBumps` | boolean | true | unspecified | Animate Bumps | unknown |
| `params.audioReact` | number | 0.7 | min 0, max 1 | Audio React | yes |
| `params.baseHue` | number | 200 | min 0, max 360 | Base Hue | yes |
| `params.beatKick` | number | 0.7 | min 0, max 1 | Beat Kick | yes |
| `params.bufH` | number | 180 | min 90, max 360 | Buffer Height | yes |
| `params.bufW` | number | 240 | min 120, max 480 | Buffer Width | yes |
| `params.bumpStrength` | number | 0.035 | min 0, max 0.1 | Bump Strength | yes |
| `params.diffuseStrength` | number | 1.05 | min 0, max 2 | Diffuse Strength | yes |
| `params.embossStrength` | number | 70 | min 0, max 200 | Emboss Strength | yes |
| `params.embossText` | string | "BUMP" | options: BUMP, SMCGA,  | Emboss Text | no |
| `params.lightSpeed` | number | 1 | min 0, max 3 | Light Speed | yes |
| `params.lightZ` | number | 120 | min 40, max 240 | Light Height | yes |
| `params.paletteMode` | string | "ramp" | options: ramp, hsl | Palette Mode | no |
| `params.scanlines` | boolean | false | unspecified | Scanlines | unknown |
| `params.seed` | number | 0 | min 0, max 999 | Seed | yes |
| `params.shininess` | number | 24 | min 2, max 80 | Shininess | yes |
| `params.specStrength` | number | 0.35 | min 0, max 1.5 | Spec Strength | yes |
| `params.waveAmp` | number | 18 | min 0, max 40 | Wave Amp | yes |
| `params.waveFreqX` | number | 0.08 | min 0, max 0.3 | Wave Freq X | yes |
| `params.waveFreqY` | number | 0.06 | min 0, max 0.3 | Wave Freq Y | yes |

### Minimal layer usage

```json
{
  "effect": "bumpmap_plane",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: caustics

- **Registry key:** `caustics`
- **Implementation:** `src/renderer/effects/causticsEffect.ts` (class `CausticsEffect`)
- **Renderer:** Canvas2D
- **Description:** Procedural water/glass caustics rendered on a low-resolution buffer with warped intersecting ridges, evolving bright convergence patches, and optional bloom glow.
- **Audio features:** bass, beat, rms
- **Performance notes:** Uses ImageData per frame; CPU cost scales with resolution.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReactive` | number | 0.35 | min 0, max 1 | Audio Reactive | yes |
| `params.background` | string | "#071018" | min 0, max 1 | Background | no |
| `params.color` | string | "#8fd6ff" | unspecified | Used in effect render logic. | no |
| `params.contrast` | number | 1 | min 0.2, max 3 | Contrast | yes |
| `params.detail` | number | 0.55 | min 0, max 1.5 | Detail | yes |
| `params.driftX` | number | 0.015 | min -1, max 1 | Drift X | yes |
| `params.driftY` | number | 0.01 | min -1, max 1 | Drift Y | yes |
| `params.glow` | number | 0.42 | min 0, max 1.5 | Glow | yes |
| `params.intensity` | number | 1 | min 0, max 3 | Intensity | yes |
| `params.scale` | number | 1 | min 0.35, max 3 | Scale | yes |
| `params.seed` | number | 1 | min 0, max 9999 | Seed | yes |
| `params.speed` | number | 1 | min 0, max 3 | Speed | yes |
| `params.warp` | number | 0.45 | min 0, max 2 | Warp | yes |

### Minimal layer usage

```json
{
  "effect": "caustics",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: chess

- **Registry key:** `chess`
- **Implementation:** `src/renderer/effects/chessEffect.ts` (class `ChessEffect`)
- **Renderer:** Canvas2D
- **Description:** Deterministic self-playing chess match with clearer silhouette-led pieces, distinctive major-piece markers, and move highlights.
- **Audio features:** beatStrength
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.showHighlights` | boolean | 1 | unspecified | Show Highlights | unknown |
| `params.speed` | number | 1 | min 0.1, max ? | Speed | yes |
| `params.startTime` | number | 0 | min 0, max ? | Start Time | yes |

### Minimal layer usage

```json
{
  "effect": "chess",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: cloth_sim

- **Registry key:** `cloth_sim`
- **Implementation:** `src/renderer/effects/clothSimEffect.ts` (class `ClothSimEffect`)
- **Renderer:** Canvas2D
- **Description:** Canvas2D verlet cloth mesh with pinned anchors, gust-driven folds, beat billows, and era-aware shading that can run as base or composited layer.
- **Audio features:** bass, beat, beatStrength, mid, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReactive` | number | 0.62 | min 0, max 1 | Audio Reactive | yes |
| `params.backgroundAlpha` | number | 0.18 | min 0, max 1 | Background Alpha | yes |
| `params.cols` | number | 24 | min 8, max 52 | Columns | yes |
| `params.damping` | number | 0.984 | min 0.85, max 0.999 | Damping | yes |
| `params.driftX` | number | 0 | min -1, max 1 | Drift X | yes |
| `params.driftY` | number | -0.1 | min -1, max 1 | Drift Y | yes |
| `params.flutter` | number | 0.35 | min 0, max 1.4 | Flutter | yes |
| `params.gravity` | number | 0.58 | min 0, max 2 | Gravity | yes |
| `params.height` | number | 0.58 | min 0.2, max 1 | Cloth Height | yes |
| `params.iterations` | number | 4 | min 1, max 10 | Iterations | yes |
| `params.mobileQuality` | number | 0.82 | min 0.35, max 1 | Mobile Quality | yes |
| `params.obstacle` | string | "none" | options: none, sphere, pillar | Obstacle | no |
| `params.obstacleSize` | number | 0.18 | min 0.08, max 0.45 | Obstacle Size | yes |
| `params.paletteMode` | string | "era" | options: era, mono, neon | Palette | no |
| `params.pinMode` | string | "corners" | options: corners, top | Pin Mode | no |
| `params.rows` | number | 16 | min 6, max 36 | Rows | yes |
| `params.seamAlpha` | number | 0.24 | min 0, max 0.7 | Seam Alpha | yes |
| `params.shading` | number | 0.8 | min 0, max 1.5 | Shading | yes |
| `params.stiffness` | number | 0.9 | min 0.35, max 1 | Stiffness | yes |
| `params.width` | number | 0.74 | min 0.2, max 1 | Cloth Width | yes |
| `params.wind` | number | 0.58 | min 0, max 2 | Wind | yes |

### Minimal layer usage

```json
{
  "effect": "cloth_sim",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: copper_gradient_splits

- **Registry key:** `copper_gradient_splits`
- **Implementation:** `src/renderer/effects/copperGradientSplits.ts` (class `CopperGradientSplitsEffect`)
- **Renderer:** Canvas2D
- **Description:** Copper bar gradients with optional pseudo-high-colour splits.
- **Audio features:** bass, beat, rms
- **Performance notes:** Uses ImageData per frame; CPU cost scales with resolution.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.7 | min 0, max 1 | Audio React | yes |
| `params.barCount` | number | 10 | min 4, max 24 | Bar Count | yes |
| `params.barHueStep` | number | 22 | min 0, max 120 | Bar Hue Step | yes |
| `params.barWobble` | number | 28 | min 0, max 80 | Bar Wobble | yes |
| `params.beatKick` | number | 0.7 | min 0, max 1 | Beat Kick | yes |
| `params.gradientRowStep` | number | 16 | min 4, max 64 | Gradient Row Step | yes |
| `params.hamish` | boolean | true | unspecified | Hamish | unknown |
| `params.hamishStrength` | number | 0.35 | min 0, max 1 | Hamish Strength | yes |
| `params.hueWobble` | number | 18 | min 0, max 120 | Hue Wobble | yes |
| `params.lightnessBase` | number | 0.35 | min 0, max 1 | Lightness Base | yes |
| `params.lightnessPeak` | number | 0.68 | min 0, max 1 | Lightness Peak | yes |
| `params.paletteClamp` | boolean | false | unspecified | Palette Clamp | unknown |
| `params.paletteClampSteps` | number | 32 | min 2, max 64 | Palette Clamp Steps | yes |
| `params.regions` | number | 0 | unspecified | Regions Override (advanced) | yes |
| `params.saturation` | number | 0.9 | min 0, max 1 | Saturation | yes |
| `params.scanStep` | number | 2 | min 1, max 6 | Scan Step | yes |
| `params.speed` | number | 0.7 | min 0, max 3 | Speed | yes |
| `params.splits` | number | 3 | min 1, max 6 | Splits | yes |

### Minimal layer usage

```json
{
  "effect": "copper_gradient_splits",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: cosmic_voyage

- **Registry key:** `cosmic_voyage`
- **Implementation:** `src/renderer/effects/cosmicVoyageEffect.ts` (class `CosmicVoyageEffect`)
- **Renderer:** Canvas2D
- **Description:** Cinematic deep-space flythrough with layered galaxies, planets, and asteroid belts.
- **Audio features:** bass, beatStrength, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.asteroidDensity` | number | 0.65 | min 0, max 2 | Asteroid Density | yes |
| `params.bloom` | number | 0.8 | min 0, max 1.6 | Bloom | yes |
| `params.galaxyGlow` | number | 0.85 | min 0, max 1.5 | Galaxy Glow | yes |
| `params.nebula` | number | 0.7 | min 0, max 1.5 | Nebula | yes |
| `params.parallax` | number | 0.75 | min 0, max 1 | Parallax | yes |
| `params.planetCount` | number | 3 | min 1, max 8 | Planet Count | yes |
| `params.seed` | number | 7 | min 0, max 9999 | Seed | yes |
| `params.speed` | number | 1.2 | min 0, max 3 | Speed | yes |
| `params.starDensity` | number | 1 | min 0.2, max 2.5 | Star Density | yes |
| `params.warp` | number | 0.7 | min 0, max 2.4 | Warp | yes |

### Minimal layer usage

```json
{
  "effect": "cosmic_voyage",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: doodle_greetz_wall

- **Registry key:** `doodle_greetz_wall`
- **Implementation:** `src/renderer/effects/doodleGreetzWall.ts` (class `DoodleGreetzWallEffect`)
- **Renderer:** Canvas2D
- **Description:** Pulls approved PNG doodles from the doodle API and renders them in `grid` or `carousel` layouts.
- **Audio features:** beat, impactStrength, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.45 | min 0, max 1 | Audio React | yes |
| `params.beatPulseDecay` | number | 2.2 | min 0.2, max 8 | Beat Decay | yes |
| `params.columns` | number | 3 | min 1, max 8 | Columns | yes |
| `params.cycleSeconds` | number | 1.5 | min 0.35, max 6 | Cycle Seconds | yes |
| `params.highlightPulse` | number | 0.65 | min 0, max 1.5 | Highlight Pulse | yes |
| `params.layout` | string | "grid" | options: grid, carousel | Layout | no |
| `params.padding` | number | 0.08 | min 0.02, max 0.18 | Padding | yes |
| `params.title` | string | "DOODLE GREETZ WALL" | options: DOODLE GREETZ WALL | Title | no |
| `params.transitionStyle` | string | "slide" | options: slide, fade, pop | Transition | no |

### Minimal layer usage

```json
{
  "effect": "doodle_greetz_wall",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: dotTunnel

- **Registry key:** `dotTunnel`
- **Implementation:** `src/renderer/effects/dotTunnel.ts` (class `DotTunnelEffect`)
- **Renderer:** Canvas2D
- **Description:** Depth-sorted sprite/ring tunnel; `palette` selects built-in color ramps.
- **Audio features:** bass, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.dotsPerRing` | number | 40 | min 6, max 160 | Dots Per Ring | yes |
| `params.fov` | number | 72 | min 40, max 125 | FOV | yes |
| `params.glow` | number | 0.7 | min 0, max 1.5 | Glow | yes |
| `params.palette` | number | 0 | min 0, max 12 | Palette | yes |
| `params.ringCount` | number | 52 | min 8, max 180 | Ring Count | yes |
| `params.seed` | number | 1 | min 0, max 9999 | Seed | yes |
| `params.speed` | number | 1 | min 0.05, max 3.5 | Speed | yes |
| `params.twist` | number | 0.9 | min -4, max 4 | Twist | yes |

### Minimal layer usage

```json
{
  "effect": "dotTunnel",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: effect_evolution

- **Registry key:** `effect_evolution`
- **Implementation:** `src/renderer/effects/effectEvolution.ts` (class `EffectEvolution`)
- **Renderer:** Canvas2D
- **Description:** Reinterprets the same lattice across eras.
- **Audio features:** bass, beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.density` | number | 1 | min 0.4, max 2.5 | Density | yes |
| `params.motion` | number | 0.6 | min 0, max 1 | Motion | yes |
| `params.seed` | number | 13 | min 0, max 9999 | Seed | yes |
| `params.trail` | number | 0.15 | min 0, max 0.92 | Trail | yes |
| `params.warp` | number | 0.4 | min 0, max 1 | Warp | yes |

### Minimal layer usage

```json
{
  "effect": "effect_evolution",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: envmap_donut

- **Registry key:** `envmap_donut`
- **Implementation:** `src/renderer/effects/envmapDonut.ts` (class `EnvmapDonutEffect`)
- **Renderer:** Canvas2D
- **Description:** Software environment-mapped chrome torus.
- **Audio features:** bass, beat
- **Performance notes:** Uses ImageData per frame; CPU cost scales with resolution.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.R` | number | 1.2 | min 0.6, max 2 | Major Radius | yes |
| `params.audioReact` | number | 0.0005 | min 0, max 1 | Audio React | yes |
| `params.backfaceCull` | boolean | false | unspecified | Backface Cull | unknown |
| `params.beatKick` | number | 0 | min 0, max 1 | Beat Kick | yes |
| `params.bufH` | number | 180 | min 90, max 240 | Buffer Height | yes |
| `params.bufW` | number | 240 | min 120, max 320 | Buffer Width | yes |
| `params.camDist` | number | 5 | min 2, max 15 | Camera Distance | yes |
| `params.chromeDesat` | number | 0.14 | min 0, max 1 | Chrome Desat | yes |
| `params.edge` | boolean | false | unspecified | Edge Overlay | unknown |
| `params.focalMul` | number | 1.2 | min 0.6, max 2 | Focal Multiplier | yes |
| `params.fresnelStrength` | number | 0.05 | min 0, max 1.5 | Fresnel | yes |
| `params.r` | number | 0.55 | min 0.25, max 1 | Minor Radius | yes |
| `params.rotXSpeed` | number | 0.15 | min 0, max 2 | Rotate X | yes |
| `params.rotYSpeed` | number | 0.75 | min 0, max 2 | Rotate Y | yes |
| `params.rotZSpeed` | number | 0.15 | min 0, max 2 | Rotate Z | yes |
| `params.scanlines` | boolean | false | unspecified | Scanlines | unknown |
| `params.seed` | number | 0 | min 0, max 50 | Seed | yes |
| `params.segmentsU` | number | 64 | min 16, max 128 | Segments U | yes |
| `params.segmentsV` | number | 32 | min 12, max 96 | Segments V | yes |
| `params.shininess` | number | 5 | min 2, max 64 | Shininess | yes |
| `params.specStrength` | number | 0.8 | min 0, max 1.5 | Specular | yes |

### Minimal layer usage

```json
{
  "effect": "envmap_donut",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: equalizer

- **Registry key:** `equalizer`
- **Implementation:** `src/renderer/effects/equalizerEffect.ts` (class `EqualizerEffect`)
- **Renderer:** Canvas2D
- **Description:** Equalizer
- **Audio features:** bass, frequency
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.alpha` | number | 0.8 | min 0.1, max 1 | Alpha | yes |
| `params.barWidth` | number | 0.8 | min 0.2, max 1 | Bar Width | yes |
| `params.bars` | number | 48 | min 8, max 128 | Bars | yes |
| `params.bassBoost` | number | 10 | min 0, max 60 | Bass Boost | yes |
| `params.height` | number | 0.8 | min 0.2, max 1 | Height | yes |

### Minimal layer usage

```json
{
  "effect": "equalizer",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: explicitpixels

- **Registry key:** `explicitpixels`
- **Implementation:** `src/renderer/effects/explicitPixelsEffect.ts` (class `ExplicitPixelsEffect`)
- **Renderer:** Canvas2D
- **Description:** `mode` supports `explicit` (generated wall of byte assignments) or `procedural` (loop-driven animation).
- **Audio features:** bass, beatStrength, energy, rms
- **Performance notes:** Uses ImageData per frame; CPU cost scales with resolution.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.7 | min 0, max 2 | Audio React | yes |
| `params.mode` | string | "explicit" | options: explicit, procedural | Mode | no |
| `params.speed` | number | 1 | min 0, max 3 | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "explicitpixels",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: explosionBurst

- **Registry key:** `explosionBurst`
- **Implementation:** `src/renderer/effects/explosionBurst.ts` (class `ExplosionBurstEffect`)
- **Renderer:** Canvas2D
- **Description:** One-shot seeded explosion burst with flash ignition, turbulent flames, debris streaks, and lingering smoke dissipation.
- **Audio features:** beatStrength
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReactive` | boolean | 1 | unspecified | Audio Reactive | unknown |
| `params.debrisCount` | number | 60 | min 0, max 180 | Debris Count | yes |
| `params.drag` | number | 0.985 | min 0.8, max 0.999 | Drag | yes |
| `params.duration` | number | 5 | min 1, max 8 | Duration | yes |
| `params.fade` | number | 0.98 | min 0.8, max 0.999 | Fade | yes |
| `params.gravity` | number | 0.02 | min 0, max 0.2 | Gravity | yes |
| `params.intensity` | number | 1 | min 0.5, max 2 | Intensity | yes |
| `params.particleCount` | number | 180 | min 0, max 300 | Fire Count | yes |
| `params.radius` | number | 72 | min 12, max 420 | Radius | yes |
| `params.seed` | number | 1 | min 0, max 9999 | Seed | yes |
| `params.smokeCount` | number | 120 | min 0, max 300 | Smoke Count | yes |
| `params.startTime` | number | 0 | min 0, max 600 | Start Time | yes |
| `params.turbulence` | number | 0.6 | min 0, max 2 | Turbulence | yes |
| `params.turbulenceScale` | number | 0.002 | min 0.0005, max 0.01 | Turbulence Scale | yes |

### Minimal layer usage

```json
{
  "effect": "explosionBurst",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: fake3d

- **Registry key:** `fake3d`
- **Implementation:** `src/renderer/effects/fake3dEffect.ts` (class `Fake3DEffect`)
- **Renderer:** Canvas2D
- **Description:** Fake 3D
- **Audio features:** mid, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.speed` | number | 1 | min 0, max ? | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "fake3d",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: feedback

- **Registry key:** `feedback`
- **Implementation:** `src/renderer/effects/feedbackEffect.ts` (class `FeedbackEffect`)
- **Renderer:** Canvas2D
- **Description:** Feedback
- **Audio features:** bass, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.glow` | number | 0.2 | min 0.05, max 0.6 | Glow | yes |
| `params.rotation` | number | 0.02 | min 0, max 0.1 | Rotation | yes |
| `params.scale` | number | 0.02 | min 0, max 0.2 | Scale | yes |
| `params.trail` | number | 0.96 | min 0.85, max 0.99 | Trail | yes |
| `params.wobble` | number | 0.01 | min 0, max 0.05 | Wobble | yes |

### Minimal layer usage

```json
{
  "effect": "feedback",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: finale

- **Registry key:** `finale`
- **Implementation:** `src/renderer/effects/finaleEffect.ts` (class `FinaleEffect`)
- **Renderer:** Canvas2D
- **Description:** Finale
- **Audio features:** bass, beat, beatStrength, frequency, mid, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.barHeight` | number | 0.6 | min 0.2, max 1 | Bar Height | yes |
| `params.bars` | number | 32 | min 8, max 64 | Bars | yes |
| `params.particleCount` | number | 40 | min 10, max 120 | Particle Count | yes |
| `params.particleForce` | number | 3 | min 0.5, max 6 | Particle Force | yes |
| `params.starSpeed` | number | 1.2 | min 0, max 4 | Star Speed | yes |
| `params.starTurn` | number | 0.35 | min 0, max 1.5 | Star Turn | yes |
| `params.starWarp` | number | 0.9 | min 0, max 2 | Star Warp | yes |
| `params.trail` | number | 0.4 | min 0.05, max 0.8 | Trail | yes |

### Minimal layer usage

```json
{
  "effect": "finale",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: fireworks_display

- **Registry key:** `fireworks_display`
- **Implementation:** `src/renderer/effects/fireworksDisplayEffect.ts` (class `FireworksDisplayEffect`)
- **Renderer:** Canvas2D
- **Description:** Audio-reactive fireworks with ember launch tails, deterministic shell timing, sparkling burst spokes, and smoky bloom rings.
- **Audio features:** beat, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.7 | min 0, max 1 | Audio React | yes |
| `params.burstSize` | number | 0.78 | min 0.2, max 1.4 | Burst Size | yes |
| `params.glitter` | number | 0.62 | min 0, max 1 | Glitter | yes |
| `params.gravity` | number | 0.58 | min 0.1, max 1.2 | Gravity | yes |
| `params.hueShift` | number | 0 | min -180, max 180 | Hue Shift | yes |
| `params.launchSpread` | number | 0.82 | min 0.2, max 1 | Launch Spread | yes |
| `params.seed` | number | 0 | min 0, max 999 | Seed | yes |
| `params.shellRate` | number | 0.55 | min 0.1, max 1.5 | Shell Rate | yes |
| `params.trail` | number | 0.28 | min 0, max 0.92 | Trail | yes |

### Minimal layer usage

```json
{
  "effect": "fireworks_display",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: fluid

- **Registry key:** `fluid`
- **Implementation:** `src/renderer/effects/fluidSimEffect.ts` (class `FluidSimEffect`)
- **Renderer:** Canvas2D
- **Description:** Fluid Simulation
- **Audio features:** bass, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.dissipation` | number | 0.985 | min 0.9, max 0.999 | Dissipation | yes |
| `params.hueShift` | number | 0 | min -180, max 180 | Hue Shift | yes |
| `params.seed` | number | 0 | min 0, max 999 | Seed | yes |
| `params.speed` | number | 1 | min 0, max 3 | Speed | yes |
| `params.splatCount` | number | 3 | min 0, max 8 | Splat Count | yes |
| `params.splatSize` | number | 6 | min 2, max 12 | Splat Size | yes |
| `params.turbulence` | number | 1.1 | min 0, max 3 | Turbulence | yes |

### Minimal layer usage

```json
{
  "effect": "fluid",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: flyover

- **Registry key:** `flyover`
- **Implementation:** `src/renderer/effects/flyoverEffect.ts` (class `FlyoverEffect`)
- **Renderer:** Canvas2D
- **Description:** `palette` supports `day`, `sunset`, `night`.
- **Audio features:** bass, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReactive` | number | 0.35 | min 0, max 1 | Audio Reactive | yes |
| `params.fog` | number | 0.65 | min 0, max 1 | Fog | yes |
| `params.horizon` | number | 0.45 | min 0, max 1 | Horizon | yes |
| `params.islandCount` | number | 4 | min 1, max ? | Island Count | yes |
| `params.islandSeed` | number | 1 | unspecified | Island Seed | yes |
| `params.palette` | string | "sunset" | options: day, sunset, night | Palette | no |
| `params.seaDetail` | number | 1 | min 0.5, max ? | Sea Detail | yes |
| `params.speed` | number | 1 | min 0, max ? | Speed | yes |
| `params.waveIntensity` | number | 1 | min 0, max ? | Wave Intensity | yes |
| `params.waveSpeed` | number | 1 | min 0, max ? | Wave Speed | yes |

### Minimal layer usage

```json
{
  "effect": "flyover",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: fractal

- **Registry key:** `fractal`
- **Implementation:** `src/renderer/effects/fractalEffect.ts` (class `FractalEffect`)
- **Renderer:** Canvas2D
- **Description:** Fractal
- **Audio features:** rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.alpha` | number | 0.1 | min 0.05, max 0.8 | Alpha | yes |
| `params.iterations` | number | 600 | min 200, max 1400 | Iterations | yes |
| `params.scale` | number | 0.25 | min 0.1, max 0.4 | Scale | yes |
| `params.speed` | number | 1 | min 0, max 3 | Speed | yes |
| `params.trebleBoost` | number | 400 | min 0, max 800 | Treble Boost | yes |

### Minimal layer usage

```json
{
  "effect": "fractal",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: fractal_zoomer

- **Registry key:** `fractal_zoomer`
- **Implementation:** `src/renderer/effects/fractalZoomer.ts` (class `FractalZoomerEffect`)
- **Renderer:** Canvas2D
- **Description:** `setType` supports `mandelbrot`, `julia`, or `burningShip`.
- **Audio features:** bass, beat, beatStrength, rms
- **Performance notes:** Uses ImageData per frame; CPU cost scales with resolution.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.55 | min 0, max 1 | Audio React | yes |
| `params.centerX` | number | -0.72 | min -2.5, max 1.5 | Center X | yes |
| `params.centerY` | number | 0 | min -1.8, max 1.8 | Center Y | yes |
| `params.iterations` | number | 140 | min 24, max 600 | Iterations | yes |
| `params.paletteSpeed` | number | 0.18 | min 0, max 2 | Palette Speed | yes |
| `params.setType` | string | "mandelbrot" | options: mandelbrot, julia, burningShip | Set | no |
| `params.zoom` | number | 1.6 | min 0.4, max 8 | Zoom | yes |

### Minimal layer usage

```json
{
  "effect": "fractal_zoomer",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: gameOfLife

- **Registry key:** `gameOfLife`
- **Implementation:** `src/renderer/effects/gameOfLifeEffect.ts` (class `GameOfLifeEffect`)
- **Renderer:** Canvas2D
- **Description:** Conway-style cellular automata with deterministic seeding, curated pattern inserts, optional wrap, and restrained beat-triggered bursts/gliders.
- **Audio features:** beat, beatStrength, impactStrength, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.burstOnBeat` | number | 0.25 | min 0, max 1 | Burst On Beat | yes |
| `params.cellSize` | number | 8 | min 4, max 24 | Cell Size | yes |
| `params.density` | number | 0.22 | min 0.01, max 0.9 | Density | yes |
| `params.fadeTrails` | number | 0.12 | min 0, max 1 | Fade Trails | yes |
| `params.gliderRate` | number | 0 | min 0, max 1 | Glider Rate | yes |
| `params.gridLines` | boolean | false | unspecified | Grid Lines | unknown |
| `params.paletteMode` | string | "mono" | options: mono, heat, era | Palette | no |
| `params.patternMode` | string | "mixed" | options: random, curated, mixed | Pattern Mode | no |
| `params.safeFit` | boolean | true | unspecified | Safe Fit | unknown |
| `params.seed` | string | "auto" | min 0, max 999999 | Seed | no |
| `params.stepRate` | number | 8 | min 1, max 30 | Step Rate | yes |
| `params.survivalTint` | number | 0.42 | min 0, max 1 | Survival Tint | yes |
| `params.wrap` | boolean | true | unspecified | Wrap | unknown |

### Minimal layer usage

```json
{
  "effect": "gameOfLife",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: gl_fractal_tunnel

- **Registry key:** `gl_fractal_tunnel`
- **Implementation:** `src/renderer/effects/gl/fractalTunnelEffect.ts` (class `FractalTunnelEffect`)
- **Renderer:** WebGL2
- **Description:** Falls back to `tunnel` when WebGL2 is unavailable.
- **Audio features:** bass, beat, beatStrength, mid, rms, treble
- **Performance notes:** WebGL2 shader pipeline; performance depends on GPU.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.exposure` | number | 1.2 | min 0.5, max 2 | Exposure | yes |
| `params.hueShift` | number | 0.15 | min 0, max 1 | Hue Shift | yes |
| `params.quality` | number | 2 | min 1, max 3 | Quality | yes |
| `params.seed` | number | 7 | unspecified | Seed | yes |
| `params.warp` | number | 1.1 | min 0, max 2 | Warp | yes |

### Minimal layer usage

```json
{
  "effect": "gl_fractal_tunnel",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: gl_impossible_corridor

- **Registry key:** `gl_impossible_corridor`
- **Implementation:** `src/renderer/effects/gl/impossibleCorridorEffect.ts` (class `ImpossibleCorridorEffect`)
- **Renderer:** WebGL2
- **Description:** Falls back to `tunnel` when WebGL2 is unavailable.
- **Audio features:** bass, beat, beatStrength, mid, rms, treble
- **Performance notes:** WebGL2 shader pipeline; performance depends on GPU.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.exposure` | number | 1.15 | min 0.5, max 2 | Exposure | yes |
| `params.hueShift` | number | 0.12 | min 0, max 1 | Hue Shift | yes |
| `params.internalScale` | number | 0.8 | min 0.4, max 1.2 | Internal Scale | yes |
| `params.quality` | number | 2 | min 1, max 3 | Quality | yes |
| `params.seed` | number | 7 | min 0, max 9999 | Seed | yes |
| `params.speed` | number | 0.6 | min 0.1, max 2 | Speed | yes |
| `params.warp` | number | 1.15 | min 0, max 2 | Warp | yes |

### Minimal layer usage

```json
{
  "effect": "gl_impossible_corridor",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: glenz_vectors

- **Registry key:** `glenz_vectors`
- **Implementation:** `src/renderer/effects/glenzVectors.ts` (class `GlenzVectorsEffect`)
- **Renderer:** Canvas2D
- **Description:** `model` supports `cube`, `octa`, `icosa`; `sortFaces` supports `none` or `backToFront`.
- **Audio features:** bass, beat
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.7 | min 0, max 1 | Audio React | yes |
| `params.baseHue` | number | 200 | min 0, max 360 | Base Hue | yes |
| `params.beatKick` | number | 0.7 | min 0, max 1 | Beat Kick | yes |
| `params.camDist` | number | 3 | min 2.2, max 6.5 | Camera Distance | yes |
| `params.edge` | boolean | true | unspecified | Edges | unknown |
| `params.edgeAlpha` | number | 0.22 | min 0, max 1 | Edge Alpha | yes |
| `params.faceAlpha` | number | 0.1 | min 0, max 0.6 | Face Alpha | yes |
| `params.focal` | number | 0 | min 0, max 1200 | Focal Length | yes |
| `params.hueSpeed` | number | 35 | min -120, max 120 | Hue Speed | yes |
| `params.instances` | number | 2 | min 1, max 6 | Instances | yes |
| `params.lightness` | number | 55 | min 0, max 100 | Lightness | yes |
| `params.lineWidth` | number | 2 | min 0.5, max 6 | Line Width | yes |
| `params.model` | string | "octa" | options: cube, octa, icosa | Model | no |
| `params.rotXSpeed` | number | 0.6 | min 0, max 2.5 | Rotate X Speed | yes |
| `params.rotYSpeed` | number | 0.85 | min 0, max 2.5 | Rotate Y Speed | yes |
| `params.rotZSpeed` | number | 0.25 | min 0, max 2 | Rotate Z Speed | yes |
| `params.sat` | number | 85 | min 0, max 100 | Saturation | yes |
| `params.seed` | number | 0 | min 0, max 999 | Seed | yes |
| `params.sortFaces` | string | "none" | options: none, backToFront | Sort Faces | no |
| `params.trailFade` | number | 0 | min 0, max 1 | Trail Fade | yes |

### Minimal layer usage

```json
{
  "effect": "glenz_vectors",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: glitch

- **Registry key:** `glitch`
- **Implementation:** `src/renderer/effects/glitchEffect.ts` (class `GlitchEffect`)
- **Renderer:** Canvas2D
- **Description:** Glitch
- **Audio features:** bass, beatStrength, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.maxShake` | number | 5 | min 0.5, max 12 | Max Shake | yes |
| `params.offset` | number | 0.08 | min 0, max 0.3 | Offset | yes |
| `params.shake` | number | 4 | min 0, max 10 | Shake | yes |
| `params.sliceBoost` | number | 10 | min 0, max 20 | Slice Boost | yes |
| `params.sliceCount` | number | 3 | min 1, max 10 | Slice Count | yes |
| `params.sliceHeight` | number | 4 | min 1, max 12 | Slice Height | yes |
| `params.sliceVariance` | number | 18 | min 0, max 30 | Slice Variance | yes |
| `params.sparkleSize` | number | 2 | min 1, max 6 | Sparkle Size | yes |
| `params.sparkles` | number | 60 | min 10, max 200 | Sparkles | yes |

### Minimal layer usage

```json
{
  "effect": "glitch",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: god_rays

- **Registry key:** `god_rays`
- **Implementation:** `src/renderer/effects/godRaysEffect.ts` (class `GodRaysEffect`)
- **Renderer:** Canvas2D
- **Description:** Atmospheric volumetric-style shafts with drifting haze, procedural occluders, and style variants (`sunbreak`, `window`, `cathedral`).
- **Audio features:** bass, beat, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.drift` | number | 0.25 | min 0, max 2 | Drift | yes |
| `params.dust` | number | 0.25 | min 0, max 1 | Dust | yes |
| `params.haze` | number | 0.6 | min 0, max 1.2 | Haze | yes |
| `params.intensity` | number | 1 | min 0, max 3 | Intensity | yes |
| `params.occlusion` | number | 0.5 | min 0, max 1 | Occlusion | yes |
| `params.pulse` | number | 0.35 | min 0, max 1.5 | Pulse | yes |
| `params.rayCount` | number | 24 | min 8, max 56 | Ray Count | yes |
| `params.seed` | number | 0 | min 0, max 9999 | Seed | yes |
| `params.shadowBands` | number | 0.5 | min 0, max 1 | Shadow Bands | yes |
| `params.sourceDriftX` | number | 0 | min -1, max 1 | Source Drift X | yes |
| `params.sourceDriftY` | number | 0 | min -1, max 1 | Source Drift Y | yes |
| `params.sourceX` | number | 0.5 | min -0.5, max 1.5 | Source X | yes |
| `params.sourceY` | number | 0.2 | min -0.5, max 1.2 | Source Y | yes |
| `params.spread` | number | 0.55 | min 0.1, max 1 | Spread | yes |
| `params.style` | string | "sunbreak" | options: sunbreak, window, cathedral | Style | no |
| `params.warmth` | number | 0.65 | min 0, max 1 | Warmth | yes |

### Minimal layer usage

```json
{
  "effect": "god_rays",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: greets_wall

- **Registry key:** `greets_wall`
- **Implementation:** `src/renderer/effects/greetsWall.ts` (class `GreetsWallEffect`)
- **Renderer:** Canvas2D
- **Description:** `layout` supports `grid` or `carousel`; `transitionStyle` supports `slide`, `fade`, or `pop`.
- **Audio features:** beat, impactStrength, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.45 | min 0, max 1 | Audio React | yes |
| `params.beatPulseDecay` | number | 2.2 | min 0.2, max 8 | Beat Decay | yes |
| `params.columns` | number | 3 | min 1, max 8 | Columns | yes |
| `params.cycleSeconds` | number | 1.5 | min 0.35, max 6 | Cycle Seconds | yes |
| `params.highlightPulse` | number | 0.65 | min 0, max 1.5 | Highlight Pulse | yes |
| `params.layout` | string | "grid" | options: grid, carousel | Layout | no |
| `params.names` | string | "Fairlight|TRSI|Spaceballs|CNCD|Mercury|TBL" | options: Fairlight|TRSI|Spaceballs|CNCD|Mercury|TBL | Names | no |
| `params.padding` | number | 0.08 | min 0.02, max 0.18 | Padding | yes |
| `params.title` | string | "GREETS" | options: GREETS | Title | no |
| `params.transitionStyle` | string | "slide" | options: slide, fade, pop | Transition | no |

### Minimal layer usage

```json
{
  "effect": "greets_wall",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: hexGridPulse

- **Registry key:** `hexGridPulse`
- **Implementation:** `src/renderer/effects/hexGridPulseEffect.ts` (class `HexGridPulseEffect`)
- **Renderer:** Canvas2D
- **Description:** Hex grid pulse lattice
- **Audio features:** bass, beat, beatStrength, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReactive` | number | 0.5 | min 0, max 1 | Audio Reactive | yes |
| `params.cellSize` | number | 24 | min 8, max 96 | Cell Size | yes |
| `params.fillAlpha` | number | 0.52 | min 0, max 1 | Fill Alpha | yes |
| `params.glowAlpha` | number | 0.35 | min 0, max 1 | Glow Alpha | yes |
| `params.invert` | boolean | 0 | unspecified | Invert | unknown |
| `params.lineWidth` | number | 1.2 | min 0, max 8 | Line Width | yes |
| `params.paletteMix` | number | 0.65 | min 0, max 1 | Palette Mix | yes |
| `params.pulseStrength` | number | 0.55 | min 0, max 1.5 | Pulse Strength | yes |
| `params.rippleStrength` | number | 0.45 | min 0, max 1.5 | Ripple Strength | yes |
| `params.speed` | number | 1 | min 0, max 4 | Speed | yes |
| `params.waveScale` | number | 1.1 | min 0.1, max 4 | Wave Scale | yes |

### Minimal layer usage

```json
{
  "effect": "hexGridPulse",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: infiniteMirror

- **Registry key:** `infiniteMirror`
- **Implementation:** `src/renderer/effects/infiniteMirror.ts` (class `InfiniteMirrorEffect`)
- **Renderer:** Canvas2D
- **Description:** Self-referential portal recursion using a persistent feedback canvas and procedural base scenes.
- **Audio features:** bass, beat, beatStrength, mid, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.baseScene` | string | "grid" | options: grid, rings, checker, bars, void | Base Scene | no |
| `params.depth` | number | 18 | min 1, max 48 | Depth | yes |
| `params.feedbackMix` | number | 0.82 | min 0.3, max 0.98 | Feedback Mix | yes |
| `params.glow` | number | 0.35 | min 0, max 1.5 | Glow | yes |
| `params.mirrorFrames` | boolean | 1 | unspecified | Mirror Frames | unknown |
| `params.monochrome` | number | 0 | min 0, max 1 | Monochrome | yes |
| `params.offsetX` | number | 0 | min -0.5, max 0.5 | Offset X | yes |
| `params.offsetY` | number | 0 | min -0.5, max 0.5 | Offset Y | yes |
| `params.pulse` | number | 0.2 | min 0, max 2 | Pulse | yes |
| `params.rotation` | number | 0.08 | min -1.5, max 1.5 | Rotation | yes |
| `params.scale` | number | 0.88 | min 0.6, max 0.98 | Scale | yes |
| `params.softness` | number | 0.08 | min 0, max 0.5 | Softness | yes |
| `params.strobeOnBeat` | number | 0.15 | min 0, max 1 | Strobe Beat | yes |
| `params.symmetry` | number | 0 | min 0, max 1 | Symmetry | yes |
| `params.twist` | number | 0.02 | min -0.5, max 0.5 | Twist | yes |
| `params.vignette` | number | 0.2 | min 0, max 1 | Vignette | yes |

### Minimal layer usage

```json
{
  "effect": "infiniteMirror",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: infinite_zoom_droste

- **Registry key:** `infinite_zoom_droste`
- **Implementation:** `src/renderer/effects/infiniteZoomDroste.ts` (class `InfiniteZoomDrosteEffect`)
- **Renderer:** Canvas2D
- **Description:** Infinite nested portal recursion with continuous logarithmic zoom and layered geometric accents.
- **Audio features:** bass, beat, beatStrength, mid, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.detail` | number | 0.75 | min 0.1, max 1 | Detail | yes |
| `params.fitMode` | string | "auto" | options: auto, safe | Fit Mode | no |
| `params.glow` | number | 0.6 | min 0, max 1.2 | Glow | yes |
| `params.pulse` | number | 0.5 | min 0, max 1 | Pulse | yes |
| `params.rotationSpeed` | number | 0.18 | min -1.2, max 1.2 | Rotation Speed | yes |
| `params.scaleBase` | number | 2 | min 1.2, max 3.8 | Scale Base | yes |
| `params.seed` | number | 1 | min 0, max 9999 | Seed | yes |
| `params.shape` | string | "portal" | options: portal, rings, grid | Shape | no |
| `params.speed` | number | 0.35 | min -1.8, max 1.8 | Speed | yes |
| `params.twist` | number | 0.25 | min -1, max 1 | Twist | yes |

### Minimal layer usage

```json
{
  "effect": "infinite_zoom_droste",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: infinitycloud

- **Registry key:** `infinitycloud`
- **Implementation:** `src/renderer/effects/infinityCloudEffect.ts` (class `InfinityCloudEffect`)
- **Renderer:** Canvas2D
- **Description:** Infinity Cloud
- **Audio features:** bass, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.speed` | number | 1 | min 0, max ? | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "infinitycloud",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: isogrid

- **Registry key:** `isogrid`
- **Implementation:** `src/renderer/effects/isoGridEffect.ts` (class `IsoGridEffect`)
- **Renderer:** Canvas2D
- **Description:** Isogrid
- **Audio features:** bass, mid
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.lineWidth` | number | 1 | min 0.5, max 4 | Line Width | yes |
| `params.opacity` | number | 0.2 | min 0.05, max 0.8 | Opacity | yes |
| `params.spacing` | number | 18 | min 8, max 40 | Spacing | yes |
| `params.speed` | number | 0.8 | min 0, max 3 | Speed | yes |
| `params.wave` | number | 8 | min 0, max 20 | Wave | yes |

### Minimal layer usage

```json
{
  "effect": "isogrid",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: kaleidoscope_symmetry

- **Registry key:** `kaleidoscope_symmetry`
- **Implementation:** `src/renderer/effects/kaleidoscopeSymmetry.ts` (class `KaleidoscopeSymmetryEffect`)
- **Renderer:** Canvas2D
- **Description:** Kaleidoscope Symmetry
- **Audio features:** bass, beat, beatStrength, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.audioReactive` | number | 1 | min 0, max 1 | Audio Reactive | yes |
| `params.bassInfluence` | number | 0.8 | min 0, max 1.5 | Bass Influence | yes |
| `params.centreX` | number | 0.5 | min 0, max 1 | Centre X | yes |
| `params.centreY` | number | 0.5 | min 0, max 1 | Centre Y | yes |
| `params.colorShift` | number | 0.4 | min 0, max 1 | Color Shift | yes |
| `params.glow` | number | 0.2 | min 0, max 1 | Glow | yes |
| `params.mirror` | boolean | 1 | unspecified | Mirror | unknown |
| `params.patternScale` | number | 1 | min 0.35, max 3 | Pattern Scale | yes |
| `params.patternWarp` | number | 0.5 | min 0, max 1.6 | Pattern Warp | yes |
| `params.radialZoom` | number | 1 | min 0.45, max 2.8 | Radial Zoom | yes |
| `params.ringDensity` | number | 0.5 | min 0.2, max 1.2 | Ring Density | yes |
| `params.rotationSpeed` | number | 0.15 | min -1, max 1 | Rotation Speed | yes |
| `params.slices` | number | 8 | min 3, max 24 | Slices | yes |
| `params.spinOnBeat` | number | 0.35 | min 0, max 1.5 | Spin On Beat | yes |
| `params.trebleInfluence` | number | 0.6 | min 0, max 1.5 | Treble Influence | yes |

### Minimal layer usage

```json
{
  "effect": "kaleidoscope_symmetry",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: kefrens_bars

- **Registry key:** `kefrens_bars`
- **Implementation:** `src/renderer/effects/kefrensBars.ts` (class `KefrensBarsEffect`)
- **Renderer:** Canvas2D
- **Description:** `palette` supports `rainbow`, `c64`, or `amiga`.
- **Audio features:** None detected
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.amp` | number | 64 | min 0, max 480 | Amplitude | yes |
| `params.barCount` | number | 18 | min 1, max 128 | Bar Count | yes |
| `params.barWidth` | number | 12 | min 1, max 160 | Bar Width | yes |
| `params.freq` | number | 2.2 | min 0, max 20 | Frequency | yes |
| `params.palette` | string | "rainbow" | options: rainbow, c64, amiga | Palette | no |
| `params.phaseOffset` | number | 0.55 | min -6.28, max 6.28 | Phase Offset | yes |
| `params.speed` | number | 1.4 | min -10, max 10 | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "kefrens_bars",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: lens_flare

- **Registry key:** `lens_flare`
- **Implementation:** `src/renderer/effects/lensFlareEffect.ts` (class `LensFlareEffect`)
- **Renderer:** Canvas2D
- **Description:** Cinematic lens flare
- **Audio features:** beat, beatStrength, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReactive` | number | 0.6 | min 0, max 1 | Audio Reactive | yes |
| `params.bgDim` | number | 0 | min 0, max 1 | Background Dim | yes |
| `params.blendBias` | number | 1 | min 0, max 2 | Blend Bias | yes |
| `params.chromatic` | number | 0.3 | min 0, max 1.2 | Chromatic | yes |
| `params.ghostCount` | number | 6 | min 2, max 12 | Ghost Count | yes |
| `params.ghostSpread` | number | 1.2 | min 0.3, max 2.4 | Ghost Spread | yes |
| `params.haloRadius` | number | 0.18 | min 0.05, max 0.8 | Halo Radius | yes |
| `params.intensity` | number | 1 | min 0, max 4 | Intensity | yes |
| `params.ringStrength` | number | 0.35 | min 0, max 1.5 | Ring Strength | yes |
| `params.seed` | number | 0 | min 0, max 999 | Seed | yes |
| `params.shimmer` | number | 0.25 | min 0, max 1 | Shimmer | yes |
| `params.sourceX` | number | 0.52 | min 0, max 1 | Source X | yes |
| `params.sourceY` | number | 0.46 | min 0, max 1 | Source Y | yes |
| `params.streakStrength` | number | 0.5 | min 0, max 2 | Streak Strength | yes |

### Minimal layer usage

```json
{
  "effect": "lens_flare",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: lens_wobbler

- **Registry key:** `lens_wobbler`
- **Implementation:** `src/renderer/effects/lensWobbler.ts` (class `LensWobblerEffect`)
- **Renderer:** Canvas2D
- **Description:** Bubble lens warp with optional jelly wobble.
- **Audio features:** bass, beat
- **Performance notes:** Uses ImageData per frame; CPU cost scales with resolution.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.7 | min 0, max 1 | Audio React | yes |
| `params.baseScale` | number | 0.9 | min 0.4, max 1.6 | Base Scale | yes |
| `params.beatKick` | number | 0.7 | min 0, max 1 | Beat Kick | yes |
| `params.bufH` | number | 150 | min 90, max 360 | Buffer Height | yes |
| `params.bufW` | number | 240 | min 120, max 480 | Buffer Width | yes |
| `params.invertRing` | boolean | true | unspecified | Invert Ring | unknown |
| `params.lensPath` | string | "circle" | options: circle, lissajous | Lens Path | no |
| `params.lensRadius` | number | 33 | min 10, max 120 | Lens Radius | yes |
| `params.lensStrength` | number | 0.75 | min 0, max 1.5 | Lens Strength | yes |
| `params.rotSpeed` | number | 0.25 | min 0, max 2 | Rotation Speed | yes |
| `params.scrollU` | number | 30 | min -120, max 120 | Scroll U | yes |
| `params.scrollV` | number | 18 | min -120, max 120 | Scroll V | yes |
| `params.seed` | number | 0 | min 0, max 999 | Seed | yes |
| `params.wobble` | boolean | true | unspecified | Wobble | unknown |
| `params.wobbleAmp` | number | 6 | min 0, max 16 | Wobble Amplitude | yes |
| `params.wobbleFreq` | number | 0.1 | min 0, max 0.4 | Wobble Frequency | yes |
| `params.wobbleSlice` | number | 2 | min 1, max 8 | Wobble Slice | yes |
| `params.wobbleSpeed` | number | 3 | min 0, max 8 | Wobble Speed | yes |
| `params.zoomAmp` | number | 0.15 | min 0, max 0.6 | Zoom Amplitude | yes |
| `params.zoomSpeed` | number | 0.6 | min 0, max 3 | Zoom Speed | yes |

### Minimal layer usage

```json
{
  "effect": "lens_wobbler",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: lightning

- **Registry key:** `lightning`
- **Implementation:** `src/renderer/effects/lightningEffect.ts` (class `LightningEffect`)
- **Renderer:** Canvas2D
- **Description:** `trigger` supports `beat`, `random`, `both`.
- **Audio features:** beat, beatStrength, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.bolt` | boolean | true | unspecified | Bolt | unknown |
| `params.branches` | number | 1 | min 1, max 8 | Branches | yes |
| `params.chancePerSecond` | number | 0.25 | min 0, max 3 | Chance / second | yes |
| `params.cooldown` | number | 1.5 | min 0, max 5 | Cooldown | yes |
| `params.flashDuration` | number | 0.12 | min 0.05, max 2 | Flash Duration | yes |
| `params.seed` | number | 0 | min 0, max 9999 | Seed | yes |
| `params.trigger` | number | 0 | min 0, max 1 | Trigger | yes |

### Minimal layer usage

```json
{
  "effect": "lightning",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: lissajous

- **Registry key:** `lissajous`
- **Implementation:** `src/renderer/effects/lissajousEffect.ts` (class `LissajousEffect`)
- **Renderer:** Canvas2D
- **Description:** Lissajous
- **Audio features:** rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.a` | number | 3 | min 1, max 6 | A Frequency | yes |
| `params.b` | number | 2 | min 1, max 6 | B Frequency | yes |
| `params.lineWidth` | number | 1.5 | min 0.5, max 6 | Line Width | yes |
| `params.points` | number | 320 | min 80, max 800 | Points | yes |
| `params.radius` | number | 0.35 | min 0.1, max 0.5 | Radius | yes |
| `params.speed` | number | 1 | min 0, max 3 | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "lissajous",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: marble

- **Registry key:** `marble`
- **Implementation:** `src/renderer/effects/marbleEffect.ts` (class `MarbleEffect`)
- **Renderer:** Canvas2D
- **Description:** Animated marble veins using turbulent sine domain warping
- **Audio features:** bass, energy, mid, rms
- **Performance notes:** Uses ImageData per frame; CPU cost scales with resolution.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.brightness` | number | 1 | min 0.2, max 2.5 | Brightness | yes |
| `params.contrast` | number | 1.2 | min 0.2, max 4 | Contrast | yes |
| `params.layers` | number | 4 | min 1, max 7 | Layers | yes |
| `params.scale` | number | 3 | min 0.4, max 8 | Scale | yes |
| `params.speed` | number | 0.15 | min 0, max 2 | Speed | yes |
| `params.turbulence` | number | 0.8 | min 0, max 2.5 | Turbulence | yes |
| `params.veinScale` | number | 2.5 | min 0.2, max 8 | Vein Scale | yes |

### Minimal layer usage

```json
{
  "effect": "marble",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: matrix_rain

- **Registry key:** `matrix_rain`
- **Implementation:** `src/renderer/effects/matrixRainEffect.ts` (class `MatrixRainEffect`)
- **Renderer:** Canvas2D
- **Description:** Matrix-style falling code rain tuned for slower, smoother descent with smaller glyphs and subtle default jitter.
- **Audio features:** beat, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.7 | min 0, max 1 | Audio React | yes |
| `params.brightness` | number | 0.92 | min 0.25, max 1.4 | Brightness | yes |
| `params.density` | number | 0.66 | min 0.1, max 1 | Density | yes |
| `params.fontSize` | number | 13 | min 8, max 28 | Font Size | yes |
| `params.glow` | number | 0.7 | min 0, max 1.5 | Glow | yes |
| `params.glyphSet` | number | 0 | min 0, max 2 | Glyph Set | yes |
| `params.jitter` | number | 0.03 | min 0, max 1 | Jitter | yes |
| `params.seed` | number | 1337 | min 0, max 9999 | Seed | yes |
| `params.speed` | number | 0.9 | min 0.2, max 4 | Speed | yes |
| `params.trail` | number | 0.84 | min 0.2, max 1 | Trail | yes |

### Minimal layer usage

```json
{
  "effect": "matrix_rain",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: metaballs

- **Registry key:** `metaballs`
- **Implementation:** `src/renderer/effects/metaballs.ts` (class `MetaballsEffect`)
- **Renderer:** Canvas2D
- **Description:** Implicit surface metaballs with chrome/neon lighting; `palette` supports `chrome` or `neon`.
- **Audio features:** bass, beat
- **Performance notes:** Uses ImageData per frame; CPU cost scales with resolution.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.ambient` | number | 0.15 | min 0, max 1 | Ambient | yes |
| `params.audioReact` | number | 0.7 | min 0, max 1 | Audio React | yes |
| `params.baseRadius` | number | 34 | min 8, max 80 | Base Radius | yes |
| `params.baseThreshold` | number | 1.2 | min 0.5, max 2 | Base Threshold | yes |
| `params.beatKick` | number | 0.7 | min 0, max 1 | Beat Kick | yes |
| `params.bufH` | number | 180 | min 90, max 360 | Buffer Height | yes |
| `params.bufW` | number | 240 | min 120, max 480 | Buffer Width | yes |
| `params.count` | number | 6 | min 2, max 12 | Ball Count | yes |
| `params.diffuse` | number | 1 | min 0, max 2 | Diffuse | yes |
| `params.edgeSoftness` | number | 0.08 | min 0.01, max 0.2 | Edge Softness | yes |
| `params.glow` | number | 0.25 | min 0, max 1 | Glow | yes |
| `params.hueSpeed` | number | 22 | min 0, max 60 | Hue Speed | yes |
| `params.normalZ` | number | 220 | min 40, max 400 | Normal Z | yes |
| `params.palette` | string | "chrome" | options: chrome, neon | Palette | no |
| `params.radiusVar` | number | 10 | min 0, max 30 | Radius Variance | yes |
| `params.rimStrength` | number | 0.25 | min 0, max 1.5 | Rim Strength | yes |
| `params.seed` | number | 1 | min 0, max 999 | Seed | yes |
| `params.shininess` | number | 24 | min 1, max 64 | Shininess | yes |
| `params.smoothing` | boolean | 1 | unspecified | Smoothing | unknown |
| `params.specStrength` | number | 0.35 | min 0, max 1.5 | Specular Strength | yes |

### Minimal layer usage

```json
{
  "effect": "metaballs",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: moire_grid

- **Registry key:** `moire_grid`
- **Implementation:** `src/renderer/effects/moireGridEffect.ts` (class `MoireGridEffect`)
- **Renderer:** Canvas2D
- **Description:** Warped interference grid; `palette` supports `cyan`, `magenta`, or `amber`.
- **Audio features:** bass, beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.35 | min 0, max 1 | Audio React | yes |
| `params.intensity` | number | 0.7 | min 0.1, max 1 | Intensity | yes |
| `params.lineWidth` | number | 1.5 | min 0.5, max 12 | Line Width | yes |
| `params.palette` | string | "cyan" | options: cyan, magenta, amber | Palette | no |
| `params.spacing` | number | 18 | min 6, max 80 | Spacing | yes |
| `params.speed` | number | 1 | min -6, max 6 | Speed | yes |
| `params.warp` | number | 14 | min 0, max 120 | Warp | yes |

### Minimal layer usage

```json
{
  "effect": "moire_grid",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: moving_shadow_map

- **Registry key:** `moving_shadow_map`
- **Implementation:** `src/renderer/effects/movingShadowMap.ts` (class `MovingShadowMapEffect`)
- **Renderer:** Canvas2D
- **Description:** Canvas2D faux-3D scene with orbiting lights and projected moving shadows.
- **Audio features:** bass, beat, beatStrength, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.colorA` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.colorB` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.contrast` | number | 1 | min 0.6, max 1.8 | Contrast | yes |
| `params.floorGrid` | number | 1 | min 0, max 1 | Floor Grid | yes |
| `params.haze` | number | 0.24 | min 0, max 1 | Haze | yes |
| `params.lightColor` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.lightCount` | number | 1 | min 1, max 2 | Light Count | yes |
| `params.lightHeightMax` | number | 4.4 | min 1.2, max 9 | Light Height Max | yes |
| `params.lightHeightMin` | number | 1.6 | min 0.8, max 7 | Light Height Min | yes |
| `params.lightSpeed` | number | 0.75 | min 0.1, max 3 | Light Speed | yes |
| `params.objectCount` | number | 6 | min 4, max 8 | Object Count | yes |
| `params.orbitRadius` | number | 4.2 | min 1.8, max 8 | Orbit Radius | yes |
| `params.paletteMode` | string | "dusk" | options: dusk, mono, neon | Palette | no |
| `params.seed` | number | 7 | min 0, max 9999 | Seed | yes |
| `params.shadowLength` | number | 1.35 | min 0.4, max 3 | Shadow Length | yes |
| `params.shadowSoftness` | number | 0.45 | min 0, max 1 | Shadow Softness | yes |

### Minimal layer usage

```json
{
  "effect": "moving_shadow_map",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: neon

- **Registry key:** `neon`
- **Implementation:** `src/renderer/effects/neonShapesEffect.ts` (class `NeonShapesEffect`)
- **Renderer:** Canvas2D
- **Description:** Neon
- **Audio features:** bass, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.glow` | number | 18 | min 4, max 40 | Glow | yes |
| `params.lineWidth` | number | 2 | min 0.5, max 6 | Line Width | yes |
| `params.radius` | number | 30 | min 10, max 80 | Radius | yes |
| `params.radiusStep` | number | 24 | min 5, max 60 | Radius Step | yes |
| `params.shapes` | number | 4 | min 1, max 8 | Shapes | yes |
| `params.speed` | number | 0.6 | min 0, max 2 | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "neon",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: neon_alley

- **Registry key:** `neon_alley`
- **Implementation:** `src/renderer/effects/gl/neonAlleyEffect.ts` (class `NeonAlleyEffect`)
- **Renderer:** WebGL2
- **Description:** Falls back to `neon` when WebGL2 is unavailable.
- **Audio features:** bass, beat, beatStrength, mid, rms, treble
- **Performance notes:** WebGL2 shader pipeline; performance depends on GPU.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.exposure` | number | 1.1 | min 0.6, max 2 | Exposure | yes |
| `params.hueShift` | number | 0.1 | min 0, max 1 | Hue Shift | yes |
| `params.quality` | number | 2 | min 1, max 3 | Quality | yes |
| `params.seed` | number | 12 | unspecified | Seed | yes |
| `params.speed` | number | 0.6 | min 0.2, max 1.6 | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "neon_alley",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: particleAttractors

- **Registry key:** `particleAttractors`
- **Implementation:** `src/renderer/effects/particleAttractors.ts` (class `ParticleAttractorsEffect`)
- **Renderer:** Canvas2D
- **Description:** Canvas2D gravity wells that pull and swirl particles into readable cosmic flow fields with tasteful audio pulse modulation.
- **Audio features:** bass, beat, beatStrength, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.absorbRadius` | number | 10 | min 0, max 80 | Absorb Radius | yes |
| `params.attractorCount` | number | 2 | min 1, max 4 | Attractor Count | yes |
| `params.audioReactive` | number | 0.5 | min 0, max 1 | Audio Reactive | yes |
| `params.backgroundFade` | number | 0.12 | min 0, max 0.5 | Background Fade | yes |
| `params.beatPulse` | number | 0.7 | min 0, max 2 | Beat Pulse | yes |
| `params.colorMode` | string | "era" | options: mono, era, heat | Color Mode | no |
| `params.count` | number | 600 | min 50, max 3000 | Count | yes |
| `params.damping` | number | 0.985 | min 0.85, max 0.9999 | Damping | yes |
| `params.glow` | number | 0.8 | min 0, max 2.5 | Glow | yes |
| `params.motion` | number | 0.35 | min 0, max 1.5 | Motion | yes |
| `params.particleSize` | number | 1.6 | min 0.5, max 4 | Particle Size | yes |
| `params.seed` | number | 1337 | min 0, max 999999 | Seed | yes |
| `params.softening` | number | 24 | min 2, max 160 | Softening | yes |
| `params.spawnMode` | string | "edges" | options: edges, ring, random | Spawn Mode | no |
| `params.speedLimit` | number | 240 | min 30, max 900 | Speed Limit | yes |
| `params.strength` | number | 1800 | min 100, max 6000 | Strength | yes |
| `params.swirl` | number | 0.65 | min -2.5, max 2.5 | Swirl | yes |
| `params.trailAlpha` | number | 0.14 | min 0.01, max 0.6 | Trail Alpha | yes |
| `params.vignette` | number | 0.16 | min 0, max 0.6 | Vignette | yes |

### Minimal layer usage

```json
{
  "effect": "particleAttractors",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: particles

- **Registry key:** `particles`
- **Implementation:** `src/renderer/effects/particleFieldEffect.ts` (class `ParticleFieldEffect`)
- **Renderer:** Canvas2D
- **Description:** Particle Field
- **Audio features:** bass, beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.burst` | number | 24 | min 4, max 80 | Burst | yes |
| `params.burstAudio` | number | 20 | min 0, max 60 | Burst Audio | yes |
| `params.force` | number | 1 | min 0.2, max 4 | Force | yes |
| `params.forceAudio` | number | 2 | min 0, max 6 | Force Audio | yes |
| `params.trail` | number | 0.2 | min 0, max 0.6 | Trail | yes |

### Minimal layer usage

```json
{
  "effect": "particles",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: physics_pile

- **Registry key:** `physics_pile`
- **Implementation:** `src/renderer/effects/physicsPile.ts` (class `PhysicsPileEffect`)
- **Renderer:** Canvas2D
- **Description:** `spawnMode` supports `pile` or `rain`.
- **Audio features:** bass, beat, beatStrength, impactStrength
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.beatImpulse` | number | 250 | min 0, max 3000 | Beat Impulse | yes |
| `params.count` | number | 18 | min 5, max 120 | Count | yes |
| `params.friction` | number | 0.6 | min 0, max 1 | Friction | yes |
| `params.gravity` | number | 900 | min 0, max 2400 | Gravity | yes |
| `params.kickImpulse` | number | 250 | min 0, max 3000 | Kick Impulse | yes |
| `params.kickOriginY` | number | 0 | unspecified | Kick Origin Y | yes |
| `params.kickRadius` | number | 240 | min 1, max 1000 | Kick Radius | yes |
| `params.kickTorque` | number | 35 | min 0, max 360 | Kick Torque | yes |
| `params.kickUpBias` | number | 0.35 | min 0, max 1 | Kick Up Bias | yes |
| `params.loosenDuration` | number | 0.18 | min 0, max 5 | Loosen Duration | yes |
| `params.loosenExtraSlop` | number | 1.5 | min 0, max 10 | Loosen Extra Slop | yes |
| `params.loosenFrictionMult` | number | 0.25 | min 0, max 1 | Loosen Friction Mult | yes |
| `params.loosenPosCorrMult` | number | 0.35 | min 0, max 1 | Loosen Position Correction Mult | yes |
| `params.loosenRestitutionAdd` | number | 0.35 | min 0, max 1 | Loosen Restitution Add | yes |
| `params.maxAngVel` | number | 18 | min 0, max 360 | Max Angular Velocity | yes |
| `params.maxLinVel` | number | 1800 | min 0, max 5000 | Max Linear Velocity | yes |
| `params.restitution` | number | 0.25 | min 0, max 1 | Restitution | yes |
| `params.scatterAngleDeg` | number | 25 | min 0, max 180 | Scatter Angle | yes |
| `params.scatterJitter` | number | 0.35 | min 0, max 1 | Scatter Jitter | yes |
| `params.seed` | number | 0 | min 0, max 9999 | Seed | yes |
| `params.sepBiasDeg` | number | 10 | min 0, max 180 | Separation Bias | yes |
| `params.shatter` | number | 0 | min 0, max 1 | Shatter | yes |
| `params.trail` | number | 0.2 | min 0, max 1 | Trail | yes |
| `params.wreckingCue` | number | 0 | min 0, max 1 | Wrecking Cue | yes |

### Minimal layer usage

```json
{
  "effect": "physics_pile",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: plasma

- **Registry key:** `plasma`
- **Implementation:** `src/renderer/effects/plasmaEffect.ts` (class `PlasmaEffect`)
- **Renderer:** Canvas2D
- **Description:** Plasma
- **Audio features:** bass, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.speed` | number | 1 | min 0, max ? | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "plasma",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: platformerScroll

- **Registry key:** `platformerScroll`
- **Implementation:** `src/renderer/effects/platformerScroll.ts` (class `PlatformerScrollEffect`)
- **Renderer:** Canvas2D
- **Description:** Deterministic side-scrolling platformer parallax scene with looping platforms and a colorful neon astronaut mascot runner.
- **Audio features:** beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.35 | min 0, max 1 | Audio React | yes |
| `params.beatKick` | number | 0.35 | min 0, max 1 | Beat Kick | yes |
| `params.groundRatio` | number | 0.24 | min 0.2, max 0.3 | Ground Ratio | yes |
| `params.parallaxFar` | number | 0.2 | min 0.05, max 0.6 | Parallax Far | yes |
| `params.parallaxFront` | number | 1 | min 0.7, max 1.4 | Parallax Front | yes |
| `params.parallaxMid` | number | 0.5 | min 0.15, max 0.9 | Parallax Mid | yes |
| `params.platformMaxSteps` | number | 5 | min 1, max 12 | Platform Max Steps | yes |
| `params.platformRate` | number | 0.55 | min 0, max 1 | Platform Rate | yes |
| `params.seed` | number | 1337 | min 0, max 9999 | Seed | yes |
| `params.speed` | number | 140 | min 0, max 8 | Speed | yes |
| `params.tileSize` | number | 16 | min 8, max 64 | Tile Size | yes |

### Minimal layer usage

```json
{
  "effect": "platformerScroll",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: polar_tunnel

- **Registry key:** `polar_tunnel`
- **Implementation:** `src/renderer/effects/polarTunnelEffect.ts` (class `PolarTunnelEffect`)
- **Renderer:** Canvas2D
- **Description:** Center-relative polar tunnel with angle/radius wobble and a sine palette for demoscene-style concentric motion.
- **Audio features:** bass, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.angularFrequency` | number | 6 | min 0, max 24 | Angular Frequency | yes |
| `params.audioReact` | number | 0.35 | min 0, max 1 | Audio React | yes |
| `params.colorCycles` | number | 6.2831 | min 0.5, max 16 | Color Cycles | yes |
| `params.radialFrequency` | number | 30 | min 1, max 80 | Radial Frequency | yes |
| `params.radialWobbleAmount` | number | 0.03 | min 0, max 0.2 | Radial Wobble Amt | yes |
| `params.radialWobbleFrequency` | number | 8 | min 0, max 24 | Radial Wobble Freq | yes |
| `params.radialWobbleSpeed` | number | 1.5 | min -8, max 8 | Radial Wobble Speed | yes |
| `params.rotateSpeed` | number | 0.8 | min -4, max 4 | Rotate Speed | yes |
| `params.wobbleAmount` | number | 0.8 | min 0, max 2 | Wobble Amount | yes |
| `params.wobbleFrequency` | number | 12 | min 0, max 40 | Wobble Frequency | yes |
| `params.wobbleSpeed` | number | 2 | min -8, max 8 | Wobble Speed | yes |

### Minimal layer usage

```json
{
  "effect": "polar_tunnel",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: poly_morph_showcase

- **Registry key:** `poly_morph_showcase`
- **Implementation:** `src/renderer/effects/polyMorphShowcase.ts` (class `PolyMorphShowcaseEffect`)
- **Renderer:** Canvas2D
- **Description:** `style` supports `auto`, `solid`, `glenz`, `shaded`.
- **Audio features:** bass, beat
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.7 | min 0, max 1 | Audio React | yes |
| `params.baseHue` | number | 200 | min 0, max 360 | Base Hue | yes |
| `params.beatKick` | number | 0.7 | min 0, max 1 | Beat Kick | yes |
| `params.camDist` | number | 3.6 | min 2.5, max 6 | Camera Distance | yes |
| `params.edge` | boolean | true | unspecified | Edge Overlay | unknown |
| `params.edgeAlpha` | number | 0.18 | min 0, max 0.6 | Edge Alpha | yes |
| `params.focalMul` | number | 0.9 | min 0.5, max 1.2 | Focal Multiplier | yes |
| `params.glenzAlpha` | number | 0.13 | min 0, max 0.4 | Glenz Alpha | yes |
| `params.hueSpeed` | number | 25 | min -90, max 90 | Hue Speed | yes |
| `params.lat` | number | 16 | min 8, max 28 | Latitude Segments | yes |
| `params.lon` | number | 24 | min 12, max 40 | Longitude Segments | yes |
| `params.morphSpeed` | number | 0.08 | min 0, max 0.3 | Morph Speed | yes |
| `params.rotXSpeed` | number | 0.5 | min -2, max 2 | Rotate X Speed | yes |
| `params.rotYSpeed` | number | 0.8 | min -2, max 2 | Rotate Y Speed | yes |
| `params.rotZSpeed` | number | 0.2 | min -2, max 2 | Rotate Z Speed | yes |
| `params.sat` | number | 85 | min 0, max 100 | Saturation | yes |
| `params.seed` | number | 0 | min 0, max 999 | Seed | yes |
| `params.shadedAlpha` | number | 0.95 | min 0, max 1 | Shaded Alpha | yes |
| `params.solidAlpha` | number | 0.9 | min 0, max 1 | Solid Alpha | yes |
| `params.sortGlenz` | boolean | false | unspecified | Sort Glenz Faces | unknown |
| `params.sortShaded` | boolean | true | unspecified | Sort Shaded Faces | unknown |
| `params.sortSolid` | boolean | true | unspecified | Sort Solid Faces | unknown |
| `params.style` | string | "auto" | options: auto, solid, glenz, shaded | Style | no |
| `params.styleSpeed` | number | 0.1 | min 0, max 0.5 | Style Speed | yes |

### Minimal layer usage

```json
{
  "effect": "poly_morph_showcase",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: prism_bloom

- **Registry key:** `prism_bloom`
- **Implementation:** `src/renderer/effects/prismBloomEffect.ts` (class `PrismBloomEffect`)
- **Renderer:** Canvas2D
- **Description:** Painterly prism petals and spectral bloom clouds for a tasteful AI-art showcase beat.
- **Audio features:** beat, beatStrength, mid, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.72 | min 0, max 1 | Audio React | yes |
| `params.bloom` | number | 0.82 | min 0, max 1.4 | Bloom | yes |
| `params.flow` | number | 0.58 | min 0, max 1.5 | Flow | yes |
| `params.petalCount` | number | 18 | min 6, max 36 | Petal Count | yes |
| `params.prismShift` | number | 0.18 | min -1, max 1 | Prism Shift | yes |
| `params.seed` | number | 3 | min 0, max 9999 | Seed | yes |
| `params.smear` | number | 0.44 | min 0, max 1.1 | Smear | yes |
| `params.vignette` | number | 0.52 | min 0, max 1 | Vignette | yes |

### Minimal layer usage

```json
{
  "effect": "prism_bloom",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: proper3d

- **Registry key:** `proper3d`
- **Implementation:** `src/renderer/effects/proper3dEffect.ts` (class `Proper3DEffect`)
- **Renderer:** Canvas2D
- **Description:** Proper 3D
- **Audio features:** bass, mid
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.speed` | number | 1 | min 0, max ? | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "proper3d",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: rain

- **Registry key:** `rain`
- **Implementation:** `src/renderer/effects/rainEffect.ts` (class `RainEffect`)
- **Renderer:** Canvas2D
- **Description:** `storm` controls downpour density/velocity, `turbulence` adds sideways sway, and `mist` controls near-ground fog bands.
- **Audio features:** beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.hue` | number | 205 | min 0, max 360 | Hue | yes |
| `params.intensity` | number | 0.5 | min 0, max 1 | Intensity | yes |
| `params.mist` | number | 0.35 | min 0, max 1 | Mist | yes |
| `params.seed` | number | 0 | min 0, max 999 | Seed | yes |
| `params.speed` | number | 1 | min 0, max 3 | Speed | yes |
| `params.splash` | boolean | false | unspecified | Splash | unknown |
| `params.storm` | number | 0.5 | min 0, max 1 | Storm | yes |
| `params.streakLength` | number | 1 | min 0.25, max 2.5 | Streak Length | yes |
| `params.turbulence` | number | 0.35 | min 0, max 1 | Turbulence | yes |
| `params.wind` | number | 0.1 | min -1, max 1 | Wind | yes |

### Minimal layer usage

```json
{
  "effect": "rain",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: raster_bars

- **Registry key:** `raster_bars`
- **Implementation:** `src/renderer/effects/rasterBars.ts` (class `RasterBarsEffect`)
- **Renderer:** Canvas2D
- **Description:** `orientation` supports `horizontal` or `vertical`; `palette` supports `c64`, `atari`, `spectrum`, or `rainbow`.
- **Audio features:** bass, beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.7 | min 0, max 1 | Audio React | yes |
| `params.barCount` | number | 10 | min 1, max 24 | Bar Count | yes |
| `params.barThickness` | number | 18 | min 1, max 120 | Bar Thickness | yes |
| `params.beatThump` | number | 0.6 | min 0, max 1 | Beat Thump | yes |
| `params.border` | boolean | false | min 0, max 1 | Border | unknown |
| `params.borderSize` | number | 48 | min 0, max 0.5 | Border Size | yes |
| `params.orientation` | number | 0 | min 0, max 1 | Orientation | yes |
| `params.palette` | number | 0 | min 0, max 8 | Palette | yes |
| `params.scanlineStep` | number | 2 | min 1, max 6 | Scanline Step | yes |
| `params.speed` | number | 0.8 | min 0, max 4 | Speed | yes |
| `params.splitStrength` | number | 0.65 | min 0, max 1 | Split Strength | yes |
| `params.waveAmp` | number | 22 | min 0, max 120 | Wave Amp | yes |
| `params.waveFreq` | number | 1.2 | min 0, max 16 | Wave Freq | yes |

### Minimal layer usage

```json
{
  "effect": "raster_bars",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: raymarch_fractal

- **Registry key:** `raymarch_fractal`
- **Implementation:** `src/renderer/effects/raymarchFractal.ts` (class `RaymarchFractalEffect`)
- **Renderer:** hybrid
- **Description:** `fractal` supports `mandelbulb` or `mandelbox`.
- **Audio features:** bass, beat, beatStrength, mid, rms, treble
- **Performance notes:** Hybrid WebGL2 rendering with Canvas2D blitting.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.6 | min 0, max 1 | Audio React | yes |
| `params.beatKick` | number | 0.5 | min 0, max 1 | Beat Kick | yes |
| `params.cameraHeight` | number | 0 | min -2, max 2 | Camera Height | yes |
| `params.cameraOrbitSpeed` | number | 0.2 | min 0, max 1 | Camera Orbit Speed | yes |
| `params.cameraRadius` | number | 4 | min 2, max 8 | Camera Radius | yes |
| `params.fractal` | string | "mandelbulb" | options: mandelbulb, mandelbox | Fractal | no |
| `params.fractalScale` | number | 1 | min 0.4, max 2.2 | Fractal Scale | yes |
| `params.paletteSpeed` | number | 0.15 | min 0, max 0.6 | Palette Speed | yes |
| `params.quality` | number | 1 | min 0.5, max 1.5 | Quality | yes |

### Minimal layer usage

```json
{
  "effect": "raymarch_fractal",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: raytrace_spheres

- **Registry key:** `raytrace_spheres`
- **Implementation:** `src/renderer/effects/raytraceSpheres.ts` (class `RaytraceSpheresEffect`)
- **Renderer:** Canvas2D
- **Description:** Low-res software raytraced spheres with reflections.
- **Audio features:** bass, beatStrength
- **Performance notes:** Uses ImageData per frame; CPU cost scales with resolution.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.aa` | number | 1 | min 0, max 2 | Antialiasing | yes |
| `params.aaMode` | string | "refinedOnly" | options: refinedOnly, full | AA Mode | no |
| `params.adaptive` | boolean | 1 | unspecified | Adaptive | unknown |
| `params.ambient` | number | 0.12 | min 0.05, max 0.4 | Ambient | yes |
| `params.audioReact` | number | 0.6 | min 0, max 1 | Audio React | yes |
| `params.beatKick` | number | 0.7 | min 0, max 1 | Beat Kick | yes |
| `params.bufH` | number | 0 | unspecified | Buffer Height | yes |
| `params.bufW` | number | 0 | unspecified | Buffer Width | yes |
| `params.cellSize` | number | 2 | min 1, max 6 | Cell Size | yes |
| `params.diffuseStrength` | number | 1 | min 0.2, max 2 | Diffuse Strength | yes |
| `params.floorReflect` | number | 0.55 | min 0, max 0.9 | Floor Reflect | yes |
| `params.forceAA` | boolean | false | unspecified | Force AA | unknown |
| `params.fov` | number | 60 | min 35, max 90 | FOV | yes |
| `params.maxDepth` | number | 2 | min 1, max 3 | Max Depth | yes |
| `params.outputSmoothing` | boolean | false | unspecified | Output Smoothing | unknown |
| `params.quality` | number | 2 | min 1, max 3 | Quality | yes |
| `params.refineGrow` | boolean | 1 | unspecified | Refine Grow | unknown |
| `params.refineThreshold` | number | 120 | min 20, max 255 | Refine Threshold | yes |
| `params.scanlines` | boolean | 0 | unspecified | Scanlines | unknown |
| `params.seed` | number | 1337 | min 0, max 9999 | Seed | yes |
| `params.shininess` | number | 48 | min 8, max 96 | Shininess | yes |
| `params.specStrength` | number | 0.45 | min 0, max 2 | Spec Strength | yes |
| `params.sphereCount` | number | 3 | min 1, max 8 | Sphere Count | yes |

### Minimal layer usage

```json
{
  "effect": "raytrace_spheres",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: reactionDiffusion

- **Registry key:** `reactionDiffusion`
- **Implementation:** `src/renderer/effects/reactionDiffusion.ts` (class `ReactionDiffusionEffect`)
- **Renderer:** Canvas2D
- **Description:** Reaction Diffusion
- **Audio features:** beat, beatStrength, mid, rms, treble
- **Performance notes:** Uses ImageData per frame; CPU cost scales with resolution.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReactivity` | number | 0.2 | min 0, max 1 | Audio Reactivity | yes |
| `params.beatPulse` | number | 0.15 | min 0, max 1 | Beat Pulse | yes |
| `params.brightness` | number | 1 | min 0.2, max 2.5 | Brightness | yes |
| `params.contrast` | number | 1.4 | min 0.4, max 3.2 | Contrast | yes |
| `params.diffA` | number | 1 | min 0.2, max 1.6 | Diffusion A | yes |
| `params.diffB` | number | 0.5 | min 0.1, max 1.2 | Diffusion B | yes |
| `params.drift` | number | 0.05 | min 0, max 0.5 | Drift | yes |
| `params.feed` | number | 0.042 | min 0.01, max 0.09 | Feed | yes |
| `params.invert` | boolean | 0 | unspecified | Invert | unknown |
| `params.kill` | number | 0.06 | min 0.03, max 0.09 | Kill | yes |
| `params.paletteMix` | number | 0.35 | min 0, max 1 | Palette Mix | yes |
| `params.reseedCue` | number | 0 | min 0, max 1 | Reseed Cue | yes |
| `params.scale` | number | 1 | min 0.5, max 3 | Scale | yes |
| `params.seed` | number | 1 | min 0, max 999999 | Seed | yes |
| `params.simScale` | number | 0.25 | min 0.08, max 0.7 | Simulation Scale | yes |
| `params.steps` | number | 6 | min 1, max 18 | Substeps | yes |

### Minimal layer usage

```json
{
  "effect": "reactionDiffusion",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: recursiveFracture

- **Registry key:** `recursiveFracture`
- **Implementation:** `src/renderer/effects/recursiveFracture.ts` (class `RecursiveFractureEffect`)
- **Renderer:** Canvas2D
- **Description:** Deterministic recursive subdivision panes; `progressMode` supports `outward`/`inward`, and `paletteMode` supports `mono`, `era`, or `heat`.
- **Audio features:** bass, beat, beatStrength, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.angleJitter` | number | 0.22 | min 0, max 1 | Angle Jitter | yes |
| `params.angleJitter.toFixed` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.bassInfluence` | number | 0.2 | min 0, max 1 | Bass Influence | yes |
| `params.beatPunch` | number | 0.35 | min 0, max 1.5 | Beat Punch | yes |
| `params.fillAlpha` | number | 0.18 | min 0, max 1 | Fill Alpha | yes |
| `params.gap` | number | 2 | min 0, max 8 | Gap | yes |
| `params.lineAlpha` | number | 0.9 | min 0, max 1 | Line Alpha | yes |
| `params.maxDepth` | number | 6 | min 1, max 8 | Max Depth | yes |
| `params.minFragmentSize` | number | 24 | min 8, max 80 | Min Fragment | yes |
| `params.minFragmentSize.toFixed` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.paletteMode` | string | "heat" | options: heat, era, mono | Palette | no |
| `params.progressMode` | string | "outward" | options: outward, inward | Progress Mode | no |
| `params.progressSpeed` | number | 0.11 | min 0.01, max 0.8 | Progress Speed | yes |
| `params.seed` | number | 7 | min 0, max 9999 | Seed | yes |
| `params.shapeCount` | number | 3 | min 1, max 6 | Shape Count | yes |
| `params.splitBias` | number | 0.65 | min 0, max 1 | Split Bias | yes |
| `params.splitBias.toFixed` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.strokeWidth` | number | 1.25 | min 0.2, max 4 | Stroke Width | yes |
| `params.trebleDetail` | number | 0.3 | min 0, max 1 | Treble Detail | yes |

### Minimal layer usage

```json
{
  "effect": "recursiveFracture",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: ribbons

- **Registry key:** `ribbons`
- **Implementation:** `src/renderer/effects/ribbonEffect.ts` (class `RibbonEffect`)
- **Renderer:** Canvas2D
- **Description:** Ribbon
- **Audio features:** bass, mid, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.amplitude` | number | 0.15 | min 0.05, max 0.4 | Amplitude | yes |
| `params.audioBoost` | number | 0.2 | min 0, max 0.5 | Audio Boost | yes |
| `params.count` | number | 5 | min 1, max 12 | Count | yes |
| `params.offset` | number | 0.3 | min 0, max 0.8 | Offset | yes |
| `params.spacing` | number | 0.08 | min 0, max 0.3 | Spacing | yes |
| `params.speed` | number | 0.8 | min 0, max ? | Speed | yes |
| `params.thickness` | number | 2 | min 0.5, max 6 | Thickness | yes |

### Minimal layer usage

```json
{
  "effect": "ribbons",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: roadDrive

- **Registry key:** `roadDrive`
- **Implementation:** `src/renderer/effects/roadDrive.ts` (class `RoadDriveEffect`)
- **Renderer:** hybrid
- **Description:** Falls back to `isogrid` when WebGL2 is unavailable.
- **Audio features:** bass, rms
- **Performance notes:** Hybrid WebGL2 rendering with Canvas2D blitting.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.bassReactive` | number | 0.85 | min 0, max 2 | Bass Reactive | yes |
| `params.cameraBob` | number | 0.22 | min 0, max 1.5 | Camera Bob | yes |
| `params.curveFrequency` | number | 0.06 | min 0.015, max 0.2 | Curve Frequency | yes |
| `params.curveStrength` | number | 1.6 | min 0, max 6 | Curve Strength | yes |
| `params.fog` | number | 0.68 | min 0, max 1 | Fog | yes |
| `params.glow` | number | 1 | min 0.1, max 2.5 | Glow | yes |
| `params.laneDashLength` | number | 2.8 | min 0.4, max 10 | Lane Dash Length | yes |
| `params.laneGap` | number | 2.2 | min 0.2, max 10 | Lane Gap | yes |
| `params.rmsReactive` | number | 0.45 | min 0, max 2 | RMS Reactive | yes |
| `params.roadWidth` | number | 8 | min 4, max 20 | Road Width | yes |
| `params.speed` | number | 1 | min 0.2, max 3.2 | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "roadDrive",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: rotozoom

- **Registry key:** `rotozoom`
- **Implementation:** `src/renderer/effects/rotozoomEffect.ts` (class `RotozoomEffect`)
- **Renderer:** Canvas2D
- **Description:** Rotozoom
- **Audio features:** rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.speed` | number | 1 | min 0, max ? | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "rotozoom",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: shadebobs_bobs

- **Registry key:** `shadebobs_bobs`
- **Implementation:** `src/renderer/effects/shadebobsBobs.ts` (class `ShadebobsBobsEffect`)
- **Renderer:** Canvas2D
- **Description:** Amiga-style bobs mixed with shadebobs interference.
- **Audio features:** bass, beat
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.7 | min 0, max 1 | Audio React | yes |
| `params.beatPulseStrength` | number | 0.7 | min 0, max 1 | Beat Pulse | yes |
| `params.blend` | string | "lighter" | options: lighter, screen | Blend Mode | no |
| `params.blobRadius` | number | 70 | min 20, max 160 | Blob Radius | yes |
| `params.bobAlpha` | number | 0.95 | min 0.1, max 1 | Bob Alpha | yes |
| `params.bobCount` | number | 40 | min 4, max 140 | Bob Count | yes |
| `params.boingCheckers` | boolean | true | unspecified | Boing Checkers | unknown |
| `params.dirtyRects` | boolean | false | unspecified | Dirty Rects | unknown |
| `params.fastBlob` | boolean | false | unspecified | Fast Blob | unknown |
| `params.hueSpeed` | number | 40 | min 0, max 120 | Hue Speed | yes |
| `params.maxSpeed` | number | 220 | min 60, max 400 | Max Speed | yes |
| `params.mode` | string | "hybrid" | options: hybrid, shadebobs, bobs | Mode | no |
| `params.seed` | number | 0 | min 0, max 20 | Seed | yes |
| `params.shadeCount` | number | 28 | min 4, max 80 | Shade Count | yes |
| `params.shadeScale` | number | 2 | min 1, max 3 | Shade Scale | yes |
| `params.spriteSize` | number | 48 | min 16, max 96 | Sprite Size | yes |
| `params.steer` | number | 40 | min 0, max 120 | Steer | yes |
| `params.trailFade` | number | 0.12 | min 0, max 0.5 | Trail Fade | yes |

### Minimal layer usage

```json
{
  "effect": "shadebobs_bobs",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: sine_distorter

- **Registry key:** `sine_distorter`
- **Implementation:** `src/renderer/effects/sineDistorter.ts` (class `SineDistorterEffect`)
- **Renderer:** Canvas2D
- **Description:** Wavy glass distorter (scanline or column sine shifts).
- **Audio features:** bass, beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.amp` | number | 28 | min 0, max 80 | Amplitude | yes |
| `params.audioReact` | number | 0.7 | min 0, max 1 | Audio React | yes |
| `params.beatBoost` | number | 0.55 | min 0, max 1 | Beat Boost | yes |
| `params.edges` | string | "wrap" | options: wrap, clamp | Edges | no |
| `params.freq` | number | 0.06 | min 0, max 0.2 | Frequency | yes |
| `params.glow` | number | 0.08 | min 0, max 0.3 | Glow | yes |
| `params.logoText` | string | "DISTORT" | options: DISTORT, WAVE, GLASS | Logo Text | no |
| `params.mode` | string | "horizontal" | options: horizontal, vertical, both | Mode | no |
| `params.phase` | number | 0 | min -6.28, max 6.28 | Phase | yes |
| `params.slice` | number | 2 | min 1, max 8 | Slice Size | yes |
| `params.source` | string | "logo" | options: logo, scene | Source | no |
| `params.sourceScale` | number | 1 | min 1, max 3 | Source Scale | yes |
| `params.speed` | number | 2 | min 0, max 6 | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "sine_distorter",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: sine_scroller_logo

- **Registry key:** `sine_scroller_logo`
- **Implementation:** `src/renderer/effects/sineScrollerLogo.ts` (class `SineScrollerLogoEffect`)
- **Renderer:** Canvas2D
- **Description:** Scroll + sine wave + scanline logo wobble.
- **Audio features:** bass, beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.7 | min 0, max 1 | Audio React | yes |
| `params.beatBoost` | number | 0.6 | min 0, max 1 | Beat Boost | yes |
| `params.fontSize` | number | 22 | min 8, max 160 | Font Size | yes |
| `params.layer2` | boolean | false | unspecified | Layer 2 | unknown |
| `params.layer2FontSize` | number | 16 | min 8, max 120 | Layer2 Font Size | yes |
| `params.layer2Speed` | number | 175 | min 0, max 600 | Layer2 Speed | yes |
| `params.layer2Y` | number | 0 | unspecified | Layer2 Y | yes |
| `params.logoFontSize` | number | 96 | min 8, max 240 | Logo Font Size | yes |
| `params.logoText` | string | "VIBES" | options: SMCGA, CODEX | Logo Text | no |
| `params.logoWaveAmp` | number | 18 | min 0, max 80 | Logo Wave Amp | yes |
| `params.logoWaveFreq` | number | 0.06 | min 0, max 1 | Logo Wave Freq | yes |
| `params.logoWaveSpeed` | number | 2 | min 0, max 20 | Logo Wave Speed | yes |
| `params.logoY` | number | 52 | min 0, max 600 | Logo Y | yes |
| `params.message` | string | "   SOOOOOOO COOOOOOOL   " | options:   CODEX CREW :: 68000 INSIDE :: STAY TUNED   ,   OPENAI PRESENTS :: RETRO FUTURE :: GREETS!    | Message | no |
| `params.scanlineStep` | number | 2 | min 1, max 6 | Scanline Step | yes |
| `params.scrollerX` | number | 0 | unspecified | Scroller X | yes |
| `params.scrollerY` | number | 0 | unspecified | Scroller Y | yes |
| `params.speed` | number | 90 | min 0, max 600 | Speed | yes |
| `params.waveAmp` | number | 10 | min 0, max 120 | Wave Amp | yes |
| `params.wavePhaseStep` | number | 0.55 | min 0, max 2 | Wave Phase Step | yes |
| `params.waveSpeed` | number | 2.2 | min 0, max 20 | Wave Speed | yes |

### Minimal layer usage

```json
{
  "effect": "sine_scroller_logo",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: skeletal_ribbon

- **Registry key:** `skeletal_ribbon`
- **Implementation:** `src/renderer/effects/skeletalRibbon.ts` (class `SkeletalRibbonEffect`)
- **Renderer:** Canvas2D
- **Description:** Articulated spine/tentacle ribbon driven by chained bone kinematics with beat-reactive pulse thickness.
- **Audio features:** bass, beat, mid, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioInfluence` | number | 1 | min 0, max 2 | Audio Influence | yes |
| `params.boneCount` | number | 24 | min 8, max 32 | Bone Count | yes |
| `params.colorMode` | string | "gradient" | options: mono, gradient | Color Mode | no |
| `params.debugSkeleton` | boolean | 0 | unspecified | Debug Skeleton | unknown |
| `params.glow` | number | 0.4 | min 0, max 1 | Glow | yes |
| `params.hueShift` | number | 0.2 | min -1, max 1 | Hue Shift | yes |
| `params.length` | number | 300 | min 80, max 700 | Length | yes |
| `params.stiffness` | number | 0.6 | min 0.05, max 1 | Stiffness | yes |
| `params.thickness` | number | 18 | min 2, max 56 | Thickness | yes |
| `params.waveAmp` | number | 0.6 | min 0, max 2 | Wave Amp | yes |
| `params.waveFreq` | number | 1.5 | min 0.05, max 6 | Wave Freq | yes |

### Minimal layer usage

```json
{
  "effect": "skeletal_ribbon",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: skyboxTransition

- **Registry key:** `skyboxTransition`
- **Implementation:** `src/renderer/effects/skyboxTransition.ts` (class `SkyboxTransitionEffect`)
- **Renderer:** Canvas2D
- **Description:** Evolving panoramic skybox backdrop that glides from day to surreal night with layered haze, silhouettes, and late-phase stars.
- **Audio features:** bass, beat, beatStrength, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReactive` | number | 0.4 | min 0, max 1 | Audio Reactive | yes |
| `params.cloudAmount` | number | 0.55 | min 0, max 1.2 | Cloud Amount | yes |
| `params.horizon` | number | 0.62 | min 0.3, max 0.85 | Horizon | yes |
| `params.intensity` | number | 1 | min 0.3, max 1.8 | Intensity | yes |
| `params.loop` | boolean | 1 | unspecified | Loop | unknown |
| `params.phaseOffset` | number | 0 | min -1, max 1 | Phase Offset | yes |
| `params.silhouetteAmount` | number | 0.5 | min 0, max 1.2 | Silhouette Amount | yes |
| `params.speed` | number | 1 | min 0.05, max 3 | Speed | yes |
| `params.starAmount` | number | 0.7 | min 0, max 1.2 | Star Amount | yes |
| `params.surrealness` | number | 0.35 | min 0, max 1.4 | Surrealness | yes |

### Minimal layer usage

```json
{
  "effect": "skyboxTransition",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: smoke_simulation

- **Registry key:** `smoke_simulation`
- **Implementation:** `src/renderer/effects/smokeSimulation.ts` (class `SmokeSimulationEffect`)
- **Renderer:** Canvas2D
- **Description:** Low-res advection smoke with flow-field feedback and soft composited wisps.
- **Audio features:** bass, beat, mid, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReactive` | number | 1 | min 0, max 1 | Audio Reactive | yes |
| `params.bassInfluence` | number | 0.9 | min 0, max 2 | Bass Influence | yes |
| `params.colorMode` | string | "mono" | options: mono, tinted | Color Mode | no |
| `params.density` | number | 0.8 | min 0, max 1.3 | Density | yes |
| `params.diffusion` | number | 0.92 | min 0, max 1 | Diffusion | yes |
| `params.emission` | number | 0.5 | min 0, max 1.5 | Emission | yes |
| `params.emitMode` | string | "bottom" | options: centre, bottom, random | Emit Mode | no |
| `params.flowSpeed` | number | 0.6 | min 0, max 2 | Flow Speed | yes |
| `params.highlights` | number | 0.45 | min 0, max 1 | Highlights | yes |
| `params.hueShift` | number | 0 | min -180, max 180 | Hue Shift | yes |
| `params.midInfluence` | number | 0.6 | min 0, max 2 | Mid Influence | yes |
| `params.scale` | number | 1 | min 0.5, max 2.2 | Scale | yes |
| `params.seed` | number | 0 | min 0, max 9999 | Seed | yes |
| `params.softness` | number | 0.8 | min 0, max 1 | Softness | yes |
| `params.swirl` | number | 0.8 | min 0, max 2 | Swirl | yes |
| `params.trebleInfluence` | number | 0.5 | min 0, max 2 | Treble Influence | yes |
| `params.turbulence` | number | 0.7 | min 0, max 2 | Turbulence | yes |

### Minimal layer usage

```json
{
  "effect": "smoke_simulation",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: soft_shadows

- **Registry key:** `soft_shadows`
- **Implementation:** `src/renderer/effects/softShadowsEffect.ts` (class `SoftShadowsEffect`)
- **Renderer:** Canvas2D
- **Description:** Canvas2D soft-shadow stage with floating casters and deterministic multi-pass penumbra rendering.
- **Audio features:** bass, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReactive` | number | 0.35 | min 0, max 1 | Audio Reactive | yes |
| `params.contactHardness` | number | 0.7 | min 0, max 1 | Contact Hardness | yes |
| `params.count` | number | 3 | min 1, max 6 | Caster Count | yes |
| `params.floorGlow` | number | 0.2 | min 0, max 1 | Floor Glow | yes |
| `params.height` | number | 0.32 | min 0.05, max 0.9 | Height | yes |
| `params.lightAngle` | number | 0.8 | min -3.14, max 3.14 | Light Angle | yes |
| `params.lightSweep` | number | 0.35 | min 0, max 1 | Light Sweep | yes |
| `params.motion` | number | 0.4 | min 0, max 1.5 | Motion | yes |
| `params.objectSize` | number | 0.12 | min 0.05, max 0.25 | Object Size | yes |
| `params.palette` | string | "studio" | options: studio, sunset, mono | Palette | no |
| `params.passCount` | number | 6 | min 1, max 12 | Pass Count | yes |
| `params.shadowLength` | number | 1.2 | min 0.2, max 2.2 | Shadow Length | yes |
| `params.softness` | number | 0.6 | min 0, max 1.5 | Softness | yes |

### Minimal layer usage

```json
{
  "effect": "soft_shadows",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: space_hangar

- **Registry key:** `space_hangar`
- **Implementation:** `src/renderer/effects/gl/spaceHangarEffect.ts` (class `SpaceHangarEffect`)
- **Renderer:** WebGL2
- **Description:** Falls back to `tunnel` when WebGL2 is unavailable.
- **Audio features:** beat, mid, treble
- **Performance notes:** WebGL2 shader pipeline; performance depends on GPU.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.exposure` | number | 1.1 | min 0.6, max 2 | Exposure | yes |
| `params.hueShift` | number | 0.08 | min 0, max 1 | Hue Shift | yes |
| `params.quality` | number | 2 | min 1, max 3 | Quality | yes |
| `params.seed` | number | 17 | unspecified | Seed | yes |
| `params.speed` | number | 0.9 | min 0.2, max 2 | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "space_hangar",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: spectrum_analyzer

- **Registry key:** `spectrum_analyzer`
- **Implementation:** `src/renderer/effects/spectrumAnalyzerEffect.ts` (class `SpectrumAnalyzerEffect`)
- **Renderer:** Canvas2D
- **Description:** Parametric-EQ-style spectrum analyzer
- **Audio features:** bass, beatStrength, frequency, mid, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.bands` | number | 96 | min 24, max 192 | Bands | yes |
| `params.curve` | number | 1.18 | min 0.4, max 2.5 | Curve | yes |
| `params.glow` | number | 0.85 | min 0, max 1 | Glow | yes |
| `params.grid` | number | 0.55 | min 0, max 1 | Grid | yes |
| `params.peakHold` | number | 0.78 | min 0, max 1 | Peak Hold | yes |
| `params.smoothing` | number | 0.72 | min 0, max 0.95 | Smoothing | yes |
| `params.tilt` | number | 0.18 | min -1, max 1 | Tilt | yes |

### Minimal layer usage

```json
{
  "effect": "spectrum_analyzer",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: sphere3d

- **Registry key:** `sphere3d`
- **Implementation:** `src/renderer/effects/sphereEffect.ts` (class `SphereEffect`)
- **Renderer:** Canvas2D
- **Description:** Sphere
- **Audio features:** bass, mid
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.speed` | number | 1 | min 0, max ? | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "sphere3d",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: spherecloud

- **Registry key:** `spherecloud`
- **Implementation:** `src/renderer/effects/sphereCloudEffect.ts` (class `SphereCloudEffect`)
- **Renderer:** Canvas2D
- **Description:** Sphere Cloud
- **Audio features:** bass, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.speed` | number | 1 | min 0, max ? | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "spherecloud",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: starfield

- **Registry key:** `starfield`
- **Implementation:** `src/renderer/effects/starfieldEffect.ts` (class `StarfieldEffect`)
- **Renderer:** Canvas2D
- **Description:** Warp/turn adjust flight feel; drift/sparkle/colorShift add richer motion and chroma variation.
- **Audio features:** bass, beatStrength, mid, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.colorShift` | number | 0 | min -1, max 1 | Color Shift | yes |
| `params.drift` | number | 0.14 | min 0, max 1 | Drift | yes |
| `params.sparkle` | number | 0.55 | min 0, max 2 | Sparkle | yes |
| `params.speed` | number | 1 | min 0, max ? | Speed | yes |
| `params.turnRate` | number | 0.7 | min 0, max ? | Turn Rate | yes |
| `params.turnStrength` | number | 0.35 | min 0, max 1 | Turn Strength | yes |
| `params.warp` | number | 0.3 | min 0, max 1 | Warp | yes |

### Minimal layer usage

```json
{
  "effect": "starfield",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: synthwaveSunset

- **Registry key:** `synthwaveSunset`
- **Implementation:** `src/renderer/effects/synthwaveSunset.ts` (class `SynthwaveSunsetEffect`)
- **Renderer:** Canvas2D
- **Description:** Synthwave Sunset
- **Audio features:** rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReactive` | number | 0.3 | min 0, max 1 | Audio Reactive | yes |
| `params.glow` | number | 0.35 | min 0, max 1 | Glow | yes |
| `params.horizon` | number | 0.52 | min 0.35, max 0.75 | Horizon | yes |
| `params.scanlines` | number | 0.25 | min 0, max 1 | Scanlines | yes |
| `params.seaSpeed` | number | 1 | min 0, max 3 | Sea Speed | yes |
| `params.starCount` | number | 200 | min 0, max 500 | Star Count | yes |
| `params.stripeGap` | number | 4 | min 1, max 12 | Stripe Gap | yes |
| `params.stripeHeight` | number | 6 | min 2, max 16 | Stripe Height | yes |
| `params.sunRadius` | number | 0.25 | min 0.1, max 0.5 | Sun Radius | yes |

### Minimal layer usage

```json
{
  "effect": "synthwaveSunset",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: taco_meteor_shower

- **Registry key:** `taco_meteor_shower`
- **Implementation:** `src/renderer/effects/tacoMeteorShowerEffect.ts` (class `TacoMeteorShowerEffect`)
- **Renderer:** Canvas2D
- **Description:** Luminescent taco shells cascade like meteors, shed sparkling stardust, and splat into avocado/cilantro/salsa confetti.
- **Audio features:** beat, beatStrength, mid, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.68 | min 0, max 1 | Audio React | yes |
| `params.burst` | number | 0.78 | min 0.2, max 1.4 | Burst | yes |
| `params.fallSpeed` | number | 0.62 | min 0.2, max 1.6 | Fall Speed | yes |
| `params.seed` | number | 7 | min 0, max 9999 | Seed | yes |
| `params.shellCount` | number | 16 | min 6, max 32 | Shell Count | yes |
| `params.stardust` | number | 0.72 | min 0, max 1.4 | Stardust | yes |
| `params.swirl` | number | 0.7 | min 0, max 1.4 | Swirl | yes |
| `params.toppingSpread` | number | 0.7 | min 0.2, max 1.4 | Topping Spread | yes |

### Minimal layer usage

```json
{
  "effect": "taco_meteor_shower",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: tetris_matrix

- **Registry key:** `tetris_matrix`
- **Implementation:** `src/renderer/effects/tetrisMatrixEffect.ts` (class `TetrisMatrixEffect`)
- **Renderer:** Canvas2D
- **Description:** Self-playing falling-block match with chunky monochrome shading and a dot-matrix handheld screen vibe.
- **Audio features:** beat, beatStrength, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.contrast` | number | 0.88 | min 0.35, max 1.3 | Contrast | yes |
| `params.ghost` | number | 1 | min 0, max 1 | Ghost | yes |
| `params.glow` | number | 0.78 | min 0, max 1.5 | Glow | yes |
| `params.level` | number | 8 | min 1, max 20 | Level | yes |
| `params.seed` | number | 1989 | min 0, max 9999 | Seed | yes |
| `params.speed` | number | 1 | min 0.35, max 3 | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "tetris_matrix",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: textmode_charset

- **Registry key:** `textmode_charset`
- **Implementation:** `src/renderer/effects/textmodeCharset.ts` (class `TextmodeCharsetEffect`)
- **Renderer:** Canvas2D
- **Description:** Coarse character-grid renderer with glyph ramps (` .:-=+*#%@`) and palette-indexed tinting.
- **Audio features:** bass, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.cols` | number | 64 | min 12, max 180 | Columns | yes |
| `params.glyphSet` | number | 0 | min 0, max 8 | Glyph Set | yes |
| `params.mode` | number | 0 | min 0, max 8 | Mode | yes |
| `params.palette` | number | 0 | min 0, max 8 | Palette | yes |
| `params.rows` | number | 36 | min 8, max 120 | Rows | yes |
| `params.scanlines` | number | 0.2 | min 0, max 1 | Scanlines | yes |
| `params.seed` | number | 1 | min 0, max 999 | Seed | yes |
| `params.speed` | number | 1 | min 0, max 6 | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "textmode_charset",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: textured_cube

- **Registry key:** `textured_cube`
- **Implementation:** `src/renderer/effects/texturedCube.ts` (class `TexturedCubeEffect`)
- **Renderer:** Canvas2D
- **Description:** Software-textured cube with optional affine/perspective mapping.
- **Audio features:** bass, beat
- **Performance notes:** Uses ImageData per frame; CPU cost scales with resolution.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.7 | min 0, max 1 | Audio React | yes |
| `params.backfaceCull` | boolean | 1 | unspecified | Backface Cull | unknown |
| `params.beatKick` | number | 0.7 | min 0, max 1 | Beat Kick | yes |
| `params.camDist` | number | 4 | min 2.5, max 8 | Camera Distance | yes |
| `params.edge` | boolean | 1 | unspecified | Edge Highlight | unknown |
| `params.edgeAlpha` | number | 0.25 | min 0, max 1 | Edge Alpha | yes |
| `params.focalMul` | number | 0.9 | min 0.4, max 1.6 | Focal Multiplier | yes |
| `params.perspectiveCorrect` | boolean | 0 | unspecified | Perspective Correct | unknown |
| `params.rotXSpeed` | number | 0.5 | min 0, max 2 | Rotate X Speed | yes |
| `params.rotYSpeed` | number | 0.8 | min 0, max 2 | Rotate Y Speed | yes |
| `params.rotZSpeed` | number | 0.15 | min 0, max 2 | Rotate Z Speed | yes |
| `params.scale` | number | 3 | min 1, max 6 | Scale | yes |
| `params.shadeStrength` | number | 0.55 | min 0, max 1.2 | Shade Strength | yes |
| `params.textureAnim` | boolean | 0 | unspecified | Texture Animate | unknown |

### Minimal layer usage

```json
{
  "effect": "textured_cube",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: tilingMorph

- **Registry key:** `tilingMorph`
- **Implementation:** `src/renderer/effects/tilingMorph.ts` (class `TilingMorphEffect`)
- **Renderer:** Canvas2D
- **Description:** Seam-safe lattice tiling morph that cycles square, diamond, skewed, and rounded-interlocking phases; `mode` supports `mono`, `palette`, `neon`.
- **Audio features:** bass, beat, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReactive` | number | 1 | min 0, max 1 | Audio Reactive | yes |
| `params.backgroundAlpha` | number | 1 | min 0, max 1 | Background Alpha | yes |
| `params.cellJitter` | number | 0.15 | min 0, max 0.45 | Cell Jitter | yes |
| `params.contrast` | number | 1 | min 0.5, max 2.5 | Contrast | yes |
| `params.fillAlpha` | number | 0.85 | min 0, max 1 | Fill Alpha | yes |
| `params.lineWidth` | number | 1.5 | min 0.25, max 8 | Line Width | yes |
| `params.mode` | string | "palette" | options: palette, mono, neon | Mode | no |
| `params.morphAmount` | number | 0.85 | min 0, max 1 | Morph Amount | yes |
| `params.morphSpeed` | number | 1 | min 0.1, max 4 | Morph Speed | yes |
| `params.paletteShift` | number | 0 | min -2, max 2 | Palette Shift | yes |
| `params.rotationSpeed` | number | 0.08 | min -1, max 1 | Rotation Speed | yes |
| `params.roundedness` | number | 0.35 | min 0, max 1 | Roundedness | yes |
| `params.scale` | number | 1 | min 0.35, max 3 | Scale | yes |
| `params.seed` | number | 1 | min 0, max 9999 | Seed | yes |

### Minimal layer usage

```json
{
  "effect": "tilingMorph",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: torus_orbit_3d

- **Registry key:** `torus_orbit_3d`
- **Implementation:** `src/renderer/effects/torusOrbit3d.ts` (class `TorusOrbit3dEffect`)
- **Renderer:** Canvas2D
- **Description:** Orbiting 3D torus points; `palette` supports `teal`, `violet`, or `amber`.
- **Audio features:** bass, beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.5 | min 0, max 1 | Audio React | yes |
| `params.depth` | number | 3.4 | min 2, max 8 | Depth | yes |
| `params.glow` | number | 0.65 | min 0, max 1 | Glow | yes |
| `params.majorRadius` | number | 0.9 | min 0.2, max 1.8 | Major Radius | yes |
| `params.minorRadius` | number | 0.34 | min 0.05, max 1.2 | Minor Radius | yes |
| `params.palette` | string | "teal" | options: teal, violet, amber | Palette | no |
| `params.pointsPerRing` | number | 48 | min 8, max 240 | Points Per Ring | yes |
| `params.ringCount` | number | 9 | min 3, max 24 | Ring Count | yes |
| `params.spinSpeed` | number | 0.85 | min -4, max 4 | Spin Speed | yes |
| `params.wobbleSpeed` | number | 0.55 | min -3, max 3 | Wobble Speed | yes |

### Minimal layer usage

```json
{
  "effect": "torus_orbit_3d",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: tunnel

- **Registry key:** `tunnel`
- **Implementation:** `src/renderer/effects/tunnelEffect.ts` (class `TunnelEffect`)
- **Renderer:** Canvas2D
- **Description:** Tunnel
- **Audio features:** mid
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.speed` | number | 1.1 | min 0, max ? | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "tunnel",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: twister

- **Registry key:** `twister`
- **Implementation:** `src/renderer/effects/twister.ts` (class `TwisterEffect`)
- **Renderer:** Canvas2D
- **Description:** `x` accepts pixels or normalized 0-1; `background` supports `clear` or `fade`; `texture` supports `solid` or `pattern`.
- **Audio features:** bass, beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.amplitude` | number | 90 | min 0, max 240 | Amplitude | yes |
| `params.audioReact` | number | 0.7 | min 0, max 1 | Audio React | yes |
| `params.background` | string | "clear" | options: clear, fade | Background | no |
| `params.baseWidth` | number | 220 | min 40, max 600 | Base Width | yes |
| `params.beatKick` | number | 0.7 | min 0, max 1 | Beat Kick | yes |
| `params.edgeShade` | number | 0.35 | min 0, max 1 | Edge Shade | yes |
| `params.hueSpeed` | number | 55 | min 0, max 180 | Hue Speed | yes |
| `params.maxAlpha` | number | 0.95 | min 0.05, max 1 | Max Alpha | yes |
| `params.maxWidthScale` | number | 1 | min 0.1, max 1.5 | Max Width Scale | yes |
| `params.minAlpha` | number | 0.25 | min 0.05, max 1 | Min Alpha | yes |
| `params.minWidthScale` | number | 0.55 | min 0.1, max 1 | Min Width Scale | yes |
| `params.sat` | number | 90 | min 0, max 100 | Saturation | yes |
| `params.sliceH` | number | 2 | min 1, max 8 | Slice Height | yes |
| `params.speed` | number | 2.2 | min 0, max 6 | Speed | yes |
| `params.texture` | string | "solid" | options: solid, pattern | Texture | no |
| `params.trailFade` | number | 0.08 | min 0, max 0.3 | Trail Fade | yes |
| `params.turns` | number | 3 | min 0.5, max 8 | Turns | yes |
| `params.x` | number | 0.5 | min 0, max 1 | Center X (0-1 or px) | yes |

### Minimal layer usage

```json
{
  "effect": "twister",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: vector3d_balls

- **Registry key:** `vector3d_balls`
- **Implementation:** `src/renderer/effects/vector3dBalls.ts` (class `Vector3dBallsEffect`)
- **Renderer:** Canvas2D
- **Description:** `model` supports `cube`, `sphere`, `torus`. `palette` supports `c64`, `spectrum`, `rainbow`.
- **Audio features:** bass, beat
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.45 | min 0, max 1 | Audio React | yes |
| `params.baseDotSize` | number | 1.8 | min 0.5, max 6 | Base Dot Size | yes |
| `params.beatKick` | number | 0.45 | min 0, max 1 | Beat Kick | yes |
| `params.camDist` | number | 3.2 | min 2.4, max 6 | Camera Distance | yes |
| `params.dotDepthScale` | number | 2 | min 0, max 6 | Dot Depth Scale | yes |
| `params.lineWidth` | number | 1.6 | min 0.5, max 6 | Line Width | yes |
| `params.model` | string | "cube" | options: cube, sphere, torus | Model | no |
| `params.palette` | string | "c64" | options: c64, spectrum, rainbow | Palette | no |
| `params.pointCount` | number | 420 | min 80, max 2000 | Point Count | yes |
| `params.rotXSpeed` | number | 0.35 | min 0, max 2.5 | Rot X Speed | yes |
| `params.rotYSpeed` | number | 0.5 | min 0, max 2.5 | Rot Y Speed | yes |
| `params.rotZSpeed` | number | 0.08 | min 0, max 1.5 | Rot Z Speed | yes |
| `params.roundDots` | boolean | 0 | unspecified | Round Dots | unknown |
| `params.seed` | number | 11 | min 0, max 9999 | Seed | yes |
| `params.stripeFreq` | number | 5 | min 1, max 14 | Stripe Freq | yes |
| `params.stripeSpeed` | number | 0.18 | min -2, max 2 | Stripe Speed | yes |
| `params.stripeStrength` | number | 0.75 | min 0, max 1 | Stripe Strength | yes |
| `params.trail` | number | 0 | min 0, max 0.85 | Trail | yes |
| `params.wireframe` | boolean | 1 | unspecified | Wireframe | unknown |

### Minimal layer usage

```json
{
  "effect": "vector3d_balls",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: velvet_dreamscape

- **Registry key:** `velvet_dreamscape`
- **Implementation:** `src/renderer/effects/velvetDreamscapeEffect.ts` (class `VelvetDreamscapeEffect`)
- **Renderer:** Canvas2D
- **Description:** Layered silk ribbons, luminous blooms, and gallery grain for a tasteful AI-art statement shot.
- **Audio features:** beat, beatStrength, mid, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.68 | min 0, max 1 | Audio React | yes |
| `params.bloom` | number | 0.78 | min 0, max 1.6 | Bloom | yes |
| `params.flow` | number | 0.62 | min 0, max 1.8 | Flow | yes |
| `params.focus` | number | 0.58 | min 0, max 1.2 | Focus | yes |
| `params.grain` | number | 0.32 | min 0, max 1 | Grain | yes |
| `params.hueDrift` | number | 0.08 | min -1, max 1 | Hue Drift | yes |
| `params.ribbonCount` | number | 11 | min 4, max 24 | Ribbon Count | yes |
| `params.seed` | number | 5 | min 0, max 9999 | Seed | yes |

### Minimal layer usage

```json
{
  "effect": "velvet_dreamscape",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: vga_fire

- **Registry key:** `vga_fire`
- **Implementation:** `src/renderer/effects/vgaFire.ts` (class `VgaFireEffect`)
- **Renderer:** Canvas2D
- **Description:** Classic VGA/DOS fire with optional logo mask.
- **Audio features:** bass, beat
- **Performance notes:** Uses ImageData per frame; CPU cost scales with resolution.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.7 | min 0, max 1 | Audio React | yes |
| `params.baseHeat` | number | 160 | min 0, max 255 | Base Heat | yes |
| `params.decay` | number | 3 | min 1, max 8 | Decay | yes |
| `params.fireH` | number | 120 | min 40, max 300 | Fire Height | yes |
| `params.fireW` | number | 160 | min 40, max 400 | Fire Width | yes |
| `params.glowStrength` | number | 0 | min 0, max 2 | Glow Strength | yes |
| `params.gustOnBeat` | number | 0.8 | min 0, max 1 | Gust on Beat | yes |
| `params.logoSize` | number | 48 | min 10, max 160 | Logo Size | yes |
| `params.logoText` | string | "SMCGA" | options: SMCGA, FIRE,  | Logo Text | no |
| `params.logoY` | number | 0 | unspecified | Logo Y | yes |
| `params.scanlines` | boolean | false | min 0, max 1 | Scanlines | unknown |
| `params.sparkChance` | number | 0.55 | min 0, max 1 | Spark Chance | yes |
| `params.stepsPerFrame` | number | 1 | min 1, max 4 | Steps / frame | yes |
| `params.turbulence` | number | 1.2 | min 0, max 3 | Turbulence | yes |
| `params.wind` | number | 0 | min -1, max 1 | Wind | yes |
| `params.windWave` | number | 0.6 | min 0, max 2 | Wind Wave | yes |

### Minimal layer usage

```json
{
  "effect": "vga_fire",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: volumetric_clouds

- **Registry key:** `volumetric_clouds`
- **Implementation:** `src/renderer/effects/volumetricCloudsEffect.ts` (class `VolumetricCloudsEffect`)
- **Renderer:** Canvas2D
- **Description:** Layered procedural cloudscape with parallax and soft haze.
- **Audio features:** bass, beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.4 | min 0, max 1 | Audio React | yes |
| `params.cloudScale` | number | 1 | min 0.4, max 2.5 | Cloud Scale | yes |
| `params.density` | number | 0.62 | min 0.15, max 1 | Density | yes |
| `params.detail` | number | 0.7 | min 0.1, max 1 | Detail | yes |
| `params.haze` | number | 0.24 | min 0, max 0.8 | Haze | yes |
| `params.layers` | number | 4 | min 2, max 8 | Layers | yes |
| `params.sunlight` | number | 0.55 | min 0, max 1 | Sunlight | yes |
| `params.windSpeed` | number | 0.35 | min -2, max 2 | Wind Speed | yes |

### Minimal layer usage

```json
{
  "effect": "volumetric_clouds",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: voronoi_cells

- **Registry key:** `voronoi_cells`
- **Implementation:** `src/renderer/effects/voronoiCells.ts` (class `VoronoiCellsEffect`)
- **Renderer:** Canvas2D
- **Description:** Animated Voronoi-style cellular mosaic with era-aware palette bias; `paletteMode` supports `mono`, `neon`, `heat`, or `era`.
- **Audio features:** beat, beatStrength, rms
- **Performance notes:** Uses ImageData per frame; CPU cost scales with resolution.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.beatPulse` | number | 0.55 | min 0, max 1.5 | Beat Pulse | yes |
| `params.cellCount` | number | 24 | min 6, max 96 | Cell Count | yes |
| `params.chromatic` | number | 0.2 | min 0, max 1 | Chromatic | yes |
| `params.contrast` | number | 1 | min 0.4, max 2.5 | Contrast | yes |
| `params.drift` | number | 0.55 | min 0, max 2 | Drift | yes |
| `params.fillAlpha` | number | 0.7 | min 0, max 1 | Fill Alpha | yes |
| `params.jitter` | number | 0.12 | min 0, max 1.5 | Jitter | yes |
| `params.lineAlpha` | number | 0.9 | min 0, max 1 | Line Alpha | yes |
| `params.lineWidth` | number | 1.5 | min 0.25, max 5 | Line Width | yes |
| `params.paletteMode` | string | "era" | options: era, mono, neon, heat | Palette | no |
| `params.pixelStep` | number | 4 | min 2, max 12 | Pixel Step | yes |
| `params.seed` | number | 1 | min 0, max 9999 | Seed | yes |
| `params.shade` | number | 0.45 | min 0, max 1 | Shade | yes |
| `params.speed` | number | 1 | min 0, max 3 | Speed | yes |

### Minimal layer usage

```json
{
  "effect": "voronoi_cells",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: voxel_landscape

- **Registry key:** `voxel_landscape`
- **Implementation:** `src/renderer/effects/voxelLandscape.ts` (class `VoxelLandscapeEffect`)
- **Renderer:** Canvas2D
- **Description:** Heightfield voxel landscape flyover with portrait-aware camera framing.
- **Audio features:** bass, beat, beatStrength
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.7 | min 0, max 1 | Audio React | yes |
| `params.beatBump` | number | 10 | min 0, max 30 | Beat Bump | yes |
| `params.beatKick` | number | 0.7 | min 0, max 1 | Beat Kick | yes |
| `params.bufH` | number | 200 | min 96, max 384 | Buffer Height | yes |
| `params.bufW` | number | 320 | min 128, max 512 | Buffer Width | yes |
| `params.camH` | number | 110 | min 40, max 180 | Camera Height | yes |
| `params.fogStrength` | number | 0.75 | min 0, max 1 | Fog Strength | yes |
| `params.fov` | number | 1 | min 0.5, max 1.6 | FOV | yes |
| `params.heightBob` | number | 6 | min 0, max 20 | Height Bob | yes |
| `params.horizon` | number | 90 | min 40, max 180 | Horizon | yes |
| `params.maxDist` | number | 900 | min 200, max 1400 | Max Distance | yes |
| `params.scale` | number | 120 | min 60, max 200 | Scale | yes |
| `params.scanlines` | boolean | 0 | unspecified | Scanlines | unknown |
| `params.seed` | number | 1337 | min 0, max 9999 | Seed | yes |
| `params.speed` | number | 70 | min 0, max 200 | Speed | yes |
| `params.stepBase` | number | 2 | min 1, max 6 | Step Base | yes |
| `params.stepGrow` | number | 80 | min 20, max 160 | Step Grow | yes |
| `params.turnRate` | number | 0.15 | min 0, max 1 | Turn Rate | yes |
| `params.turnWobble` | number | 0.1 | min 0, max 0.5 | Turn Wobble | yes |

### Minimal layer usage

```json
{
  "effect": "voxel_landscape",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: voxel_world_builder

- **Registry key:** `voxel_world_builder`
- **Implementation:** `src/renderer/effects/VoxelWorldBuilder.ts` (class `VoxelWorldBuilderEffect`)
- **Renderer:** hybrid
- **Description:** WebGL2 instanced voxel city assembler (64x64 cubes); falls back to Canvas2D isometric voxels when WebGL2 is unavailable.
- **Audio features:** None detected
- **Performance notes:** Hybrid WebGL2 rendering with Canvas2D blitting.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.buildProgress` | number | 0 | min 0, max 1 | Build Progress | yes |
| `params.cameraLift` | number | 0.15 | min -0.25, max 1.5 | Camera Lift | yes |
| `params.cityDensity` | number | 0.62 | min 0, max 1 | City Density | yes |
| `params.glow` | number | 0.85 | min 0, max 2 | Glow | yes |
| `params.seed` | number | 11 | min 0, max 9999 | Seed | yes |

### Minimal layer usage

```json
{
  "effect": "voxel_world_builder",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: water_drops

- **Registry key:** `water_drops`
- **Implementation:** `src/renderer/effects/waterDropsEffect.ts` (class `WaterDropsEffect`)
- **Renderer:** Canvas2D
- **Description:** Stylized droplets on glass with dark/bright refractive edges, tiny bead clusters, and optional rivulet streaks.
- **Audio features:** beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.25 | min 0, max 1 | Audio React | yes |
| `params.distortion` | number | 0.38 | min 0, max 1 | Distortion | yes |
| `params.dropCount` | number | 72 | min 8, max 280 | Drop Count | yes |
| `params.fallSpeed` | number | 0.12 | min 0, max 1.2 | Fall Speed | yes |
| `params.maxRadius` | number | 18 | min 2, max 120 | Max Radius | yes |
| `params.microDrops` | number | 0.7 | min 0, max 1 | Micro Drops | yes |
| `params.minRadius` | number | 3 | min 1, max 80 | Min Radius | yes |
| `params.refraction` | number | 0.85 | min 0, max 1 | Refraction | yes |
| `params.rivulets` | number | 0.35 | min 0, max 1 | Rivulets | yes |
| `params.seed` | number | 0 | min 0, max 999 | Seed | yes |
| `params.tint` | number | 205 | min 170, max 230 | Tint | yes |
| `params.trail` | number | 0.28 | min 0, max 1 | Trail | yes |

### Minimal layer usage

```json
{
  "effect": "water_drops",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: wireframeRide

- **Registry key:** `wireframeRide`
- **Implementation:** `src/renderer/effects/wireframeRide.ts` (class `WireframeRideEffect`)
- **Renderer:** hybrid
- **Description:** Falls back to `isogrid` when WebGL2 is unavailable.
- **Audio features:** bass, rms
- **Performance notes:** Hybrid WebGL2 rendering with Canvas2D blitting.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.amplitude` | number | 6 | min 0, max 18 | Amplitude | yes |
| `params.bassReactive` | number | 0.6 | min 0, max 1.5 | Bass Reactive | yes |
| `params.cameraHeight` | number | 10 | min 2, max 24 | Camera Height | yes |
| `params.fog` | number | 0.75 | min 0, max 1 | Fog | yes |
| `params.fov` | number | 60 | min 40, max 90 | FOV | yes |
| `params.gridDepth` | number | 120 | min 40, max 240 | Grid Depth | yes |
| `params.gridResX` | number | 160 | min 40, max 320 | Grid Res X | yes |
| `params.gridResZ` | number | 220 | min 60, max 360 | Grid Res Z | yes |
| `params.gridWidth` | number | 60 | min 20, max 140 | Grid Width | yes |
| `params.neon` | number | 1 | min 0.4, max 2.5 | Neon | yes |
| `params.noiseFreq` | number | 0.08 | min 0.02, max 0.2 | Noise Freq | yes |
| `params.rmsReactive` | number | 0.35 | min 0, max 1.5 | RMS Reactive | yes |
| `params.speed` | number | 1 | min 0.2, max 3 | Speed | yes |
| `params.sun` | boolean | 1 | unspecified | Sun | unknown |

### Minimal layer usage

```json
{
  "effect": "wireframeRide",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

