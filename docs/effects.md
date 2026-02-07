# Effects Reference

Generated from `src/renderer/effects/index.ts`.

Total effects: **59**.

## Table of contents

- [Effect: starfield](#effect-starfield)
- [Effect: plasma](#effect-plasma)
- [Effect: tunnel](#effect-tunnel)
- [Effect: rotozoom](#effect-rotozoom)
- [Effect: blobs](#effect-blobs)
- [Effect: ribbons](#effect-ribbons)
- [Effect: lissajous](#effect-lissajous)
- [Effect: glitch](#effect-glitch)
- [Effect: bokeh](#effect-bokeh)
- [Effect: fractal](#effect-fractal)
- [Effect: feedback](#effect-feedback)
- [Effect: equalizer](#effect-equalizer)
- [Effect: isogrid](#effect-isogrid)
- [Effect: neon](#effect-neon)
- [Effect: particles](#effect-particles)
- [Effect: finale](#effect-finale)
- [Effect: proper3d](#effect-proper3d)
- [Effect: fake3d](#effect-fake3d)
- [Effect: portrait](#effect-portrait)
- [Effect: sphere3d](#effect-sphere3d)
- [Effect: spherecloud](#effect-spherecloud)
- [Effect: infinitycloud](#effect-infinitycloud)
- [Effect: chess](#effect-chess)
- [Effect: flyover](#effect-flyover)
- [Effect: gl_fractal_tunnel](#effect-gl-fractal-tunnel)
- [Effect: physics_pile](#effect-physics-pile)
- [Effect: gl_impossible_corridor](#effect-gl-impossible-corridor)
- [Effect: synthwaveSunset](#effect-synthwaveSunset)
- [Effect: rain](#effect-rain)
- [Effect: lightning](#effect-lightning)
- [Effect: neon_alley](#effect-neon-alley)
- [Effect: space_hangar](#effect-space-hangar)
- [Effect: wireframeRide](#effect-wireframeRide)
- [Effect: roadDrive](#effect-roadDrive)
- [Effect: effect_evolution](#effect-effect-evolution)
- [Effect: fluid](#effect-fluid)
- [Effect: treegrowth](#effect-treegrowth)
- [Effect: vector3d_balls](#effect-vector3d-balls)
- [Effect: amiga_showcase](#effect-amiga-showcase)
- [Effect: sine_scroller_logo](#effect-sine-scroller-logo)
- [Effect: border_multiplex](#effect-border-multiplex)
- [Effect: raster_bars](#effect-raster-bars)
- [Effect: copper_gradient_splits](#effect-copper-gradient-splits)
- [Effect: envmap_donut](#effect-envmap-donut)
- [Effect: voxel_landscape](#effect-voxel-landscape)
- [Effect: lens_wobbler](#effect-lens-wobbler)
- [Effect: poly_morph_showcase](#effect-poly-morph-showcase)
- [Effect: textured_cube](#effect-textured-cube)
- [Effect: twister](#effect-twister)
- [Effect: shadebobs_bobs](#effect-shadebobs-bobs)
- [Effect: sine_distorter](#effect-sine-distorter)
- [Effect: glenz_vectors](#effect-glenz-vectors)
- [Effect: raymarch_fractal](#effect-raymarch-fractal)
- [Effect: metaballs](#effect-metaballs)
- [Effect: bumpmap_plane](#effect-bumpmap-plane)
- [Effect: raytrace_spheres](#effect-raytrace-spheres)
- [Effect: vga_fire](#effect-vga-fire)
- [Effect: platformerScroll](#effect-platformerScroll)
- [Effect: dotTunnel](#effect-dotTunnel)

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

- `speed` (used in 35 effects)
- `seed` (used in 23 effects)
- `audioReact` (used in 21 effects)
- `beatKick` (used in 14 effects)
- `glow` (used in 8 effects)
- `hueShift` (used in 6 effects)
- `trail` (used in 6 effects)
- `quality` (used in 6 effects)
- `scanlines` (used in 6 effects)
- `bufH` (used in 6 effects)
- `bufW` (used in 6 effects)
- `count` (used in 5 effects)

## Effects

## Effect: starfield

- **Registry key:** `starfield`
- **Implementation:** `src/renderer/effects/starfieldEffect.ts` (class `StarfieldEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by StarfieldEffect (src/renderer/effects/starfieldEffect.ts).
- **Audio features:** bass, beatStrength, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
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

## Effect: plasma

- **Registry key:** `plasma`
- **Implementation:** `src/renderer/effects/plasmaEffect.ts` (class `PlasmaEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by PlasmaEffect (src/renderer/effects/plasmaEffect.ts).
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

## Effect: tunnel

- **Registry key:** `tunnel`
- **Implementation:** `src/renderer/effects/tunnelEffect.ts` (class `TunnelEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by TunnelEffect (src/renderer/effects/tunnelEffect.ts).
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

## Effect: rotozoom

- **Registry key:** `rotozoom`
- **Implementation:** `src/renderer/effects/rotozoomEffect.ts` (class `RotozoomEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by RotozoomEffect (src/renderer/effects/rotozoomEffect.ts).
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

## Effect: blobs

- **Registry key:** `blobs`
- **Implementation:** `src/renderer/effects/blobsEffect.ts` (class `BlobsEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by BlobsEffect (src/renderer/effects/blobsEffect.ts).
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

## Effect: ribbons

- **Registry key:** `ribbons`
- **Implementation:** `src/renderer/effects/ribbonEffect.ts` (class `RibbonEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by RibbonEffect (src/renderer/effects/ribbonEffect.ts).
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

## Effect: lissajous

- **Registry key:** `lissajous`
- **Implementation:** `src/renderer/effects/lissajousEffect.ts` (class `LissajousEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by LissajousEffect (src/renderer/effects/lissajousEffect.ts).
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

## Effect: glitch

- **Registry key:** `glitch`
- **Implementation:** `src/renderer/effects/glitchEffect.ts` (class `GlitchEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by GlitchEffect (src/renderer/effects/glitchEffect.ts).
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

## Effect: bokeh

- **Registry key:** `bokeh`
- **Implementation:** `src/renderer/effects/bokehEffect.ts` (class `BokehEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by BokehEffect (src/renderer/effects/bokehEffect.ts).
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

## Effect: fractal

- **Registry key:** `fractal`
- **Implementation:** `src/renderer/effects/fractalEffect.ts` (class `FractalEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by FractalEffect (src/renderer/effects/fractalEffect.ts).
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

## Effect: feedback

- **Registry key:** `feedback`
- **Implementation:** `src/renderer/effects/feedbackEffect.ts` (class `FeedbackEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by FeedbackEffect (src/renderer/effects/feedbackEffect.ts).
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

## Effect: equalizer

- **Registry key:** `equalizer`
- **Implementation:** `src/renderer/effects/equalizerEffect.ts` (class `EqualizerEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by EqualizerEffect (src/renderer/effects/equalizerEffect.ts).
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

## Effect: isogrid

- **Registry key:** `isogrid`
- **Implementation:** `src/renderer/effects/isoGridEffect.ts` (class `IsoGridEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by IsoGridEffect (src/renderer/effects/isoGridEffect.ts).
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

## Effect: neon

- **Registry key:** `neon`
- **Implementation:** `src/renderer/effects/neonShapesEffect.ts` (class `NeonShapesEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by NeonShapesEffect (src/renderer/effects/neonShapesEffect.ts).
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

## Effect: particles

- **Registry key:** `particles`
- **Implementation:** `src/renderer/effects/particleFieldEffect.ts` (class `ParticleFieldEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by ParticleFieldEffect (src/renderer/effects/particleFieldEffect.ts).
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

## Effect: finale

- **Registry key:** `finale`
- **Implementation:** `src/renderer/effects/finaleEffect.ts` (class `FinaleEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by FinaleEffect (src/renderer/effects/finaleEffect.ts).
- **Audio features:** bass, beat, beatStrength, frequency, rms
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

## Effect: proper3d

- **Registry key:** `proper3d`
- **Implementation:** `src/renderer/effects/proper3dEffect.ts` (class `Proper3DEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by Proper3DEffect (src/renderer/effects/proper3dEffect.ts).
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

## Effect: fake3d

- **Registry key:** `fake3d`
- **Implementation:** `src/renderer/effects/fake3dEffect.ts` (class `Fake3DEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by Fake3DEffect (src/renderer/effects/fake3dEffect.ts).
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

## Effect: portrait

- **Registry key:** `portrait`
- **Implementation:** `src/renderer/effects/portraitGlowEffect.ts` (class `PortraitGlowEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by PortraitGlowEffect (src/renderer/effects/portraitGlowEffect.ts).
- **Audio features:** bass, beat, beatStrength, mid, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.drift` | number | 1 | min 0, max ? | Drift | yes |
| `params.zoom` | number | 1.05 | min 0.5, max ? | Zoom | yes |

### Minimal layer usage

```json
{
  "effect": "portrait",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: sphere3d

- **Registry key:** `sphere3d`
- **Implementation:** `src/renderer/effects/sphereEffect.ts` (class `SphereEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by SphereEffect (src/renderer/effects/sphereEffect.ts).
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
- **Description:** Implemented by SphereCloudEffect (src/renderer/effects/sphereCloudEffect.ts).
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

## Effect: infinitycloud

- **Registry key:** `infinitycloud`
- **Implementation:** `src/renderer/effects/infinityCloudEffect.ts` (class `InfinityCloudEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by InfinityCloudEffect (src/renderer/effects/infinityCloudEffect.ts).
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

## Effect: chess

- **Registry key:** `chess`
- **Implementation:** `src/renderer/effects/chessEffect.ts` (class `ChessEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by ChessEffect (src/renderer/effects/chessEffect.ts).
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

## Effect: flyover

- **Registry key:** `flyover`
- **Implementation:** `src/renderer/effects/flyoverEffect.ts` (class `FlyoverEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by FlyoverEffect (src/renderer/effects/flyoverEffect.ts).
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

## Effect: gl_fractal_tunnel

- **Registry key:** `gl_fractal_tunnel`
- **Implementation:** `src/renderer/effects/gl/fractalTunnelEffect.ts` (class `FractalTunnelEffect`)
- **Renderer:** WebGL2
- **Description:** Implemented by FractalTunnelEffect (src/renderer/effects/gl/fractalTunnelEffect.ts).
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

## Effect: physics_pile

- **Registry key:** `physics_pile`
- **Implementation:** `src/renderer/effects/physicsPile.ts` (class `PhysicsPileEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by PhysicsPileEffect (src/renderer/effects/physicsPile.ts).
- **Audio features:** bass, beat, beatStrength, impactStrength
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.beatImpulse` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.count` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.friction` | number | 0.6 | unspecified | Used in effect render logic. | yes |
| `params.gravity` | number | 900 | unspecified | Used in effect render logic. | yes |
| `params.kickImpulse` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.kickOriginY` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.kickRadius` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.kickTorque` | number | 35 | unspecified | Used in effect render logic. | yes |
| `params.kickUpBias` | number | 0.35 | unspecified | Used in effect render logic. | yes |
| `params.loosenDuration` | number | 0.18 | unspecified | Used in effect render logic. | yes |
| `params.loosenExtraSlop` | number | 1.5 | unspecified | Used in effect render logic. | yes |
| `params.loosenFrictionMult` | number | 0.25 | unspecified | Used in effect render logic. | yes |
| `params.loosenPosCorrMult` | number | 0.35 | unspecified | Used in effect render logic. | yes |
| `params.loosenRestitutionAdd` | number | 0.35 | unspecified | Used in effect render logic. | yes |
| `params.maxAngVel` | number | 18 | unspecified | Used in effect render logic. | yes |
| `params.maxLinVel` | number | 1800 | unspecified | Used in effect render logic. | yes |
| `params.restitution` | number | 0.25 | unspecified | Used in effect render logic. | yes |
| `params.scatterAngleDeg` | number | 25 | unspecified | Used in effect render logic. | yes |
| `params.scatterJitter` | number | 0.35 | unspecified | Used in effect render logic. | yes |
| `params.seed` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.sepBiasDeg` | number | 10 | unspecified | Used in effect render logic. | yes |
| `params.shatter` | number | 0 | unspecified | Used in effect render logic. | yes |
| `params.trail` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.wreckingCue` | number | 0 | unspecified | Used in effect render logic. | yes |

### Minimal layer usage

```json
{
  "effect": "physics_pile",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: gl_impossible_corridor

- **Registry key:** `gl_impossible_corridor`
- **Implementation:** `src/renderer/effects/gl/impossibleCorridorEffect.ts` (class `ImpossibleCorridorEffect`)
- **Renderer:** WebGL2
- **Description:** Implemented by ImpossibleCorridorEffect (src/renderer/effects/gl/impossibleCorridorEffect.ts).
- **Audio features:** bass, beat, beatStrength, mid, rms, treble
- **Performance notes:** WebGL2 shader pipeline; performance depends on GPU.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.exposure` | number | 1.15 | unspecified | Used in effect render logic. | yes |
| `params.hueShift` | number | 0.12 | unspecified | Used in effect render logic. | yes |
| `params.internalScale` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.quality` | number | 2 | unspecified | Used in effect render logic. | yes |
| `params.seed` | number | 7 | unspecified | Used in effect render logic. | yes |
| `params.speed` | number | 0.6 | unspecified | Used in effect render logic. | yes |
| `params.warp` | number | 1.15 | unspecified | Used in effect render logic. | yes |

### Minimal layer usage

```json
{
  "effect": "gl_impossible_corridor",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: synthwaveSunset

- **Registry key:** `synthwaveSunset`
- **Implementation:** `src/renderer/effects/synthwaveSunset.ts` (class `SynthwaveSunsetEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by SynthwaveSunsetEffect (src/renderer/effects/synthwaveSunset.ts).
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

## Effect: rain

- **Registry key:** `rain`
- **Implementation:** `src/renderer/effects/rainEffect.ts` (class `RainEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by RainEffect (src/renderer/effects/rainEffect.ts).
- **Audio features:** beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.hue` | number | 205 | unspecified | Used in effect render logic. | yes |
| `params.intensity` | number | 0.5 | unspecified | Used in effect render logic. | yes |
| `params.seed` | number | 0 | unspecified | Used in effect render logic. | yes |
| `params.speed` | number | 1 | unspecified | Used in effect render logic. | yes |
| `params.splash` | boolean | false | unspecified | Used in effect render logic. | unknown |
| `params.streakLength` | number | 1 | unspecified | Used in effect render logic. | yes |
| `params.wind` | number | 0.1 | unspecified | Used in effect render logic. | yes |

### Minimal layer usage

```json
{
  "effect": "rain",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: lightning

- **Registry key:** `lightning`
- **Implementation:** `src/renderer/effects/lightningEffect.ts` (class `LightningEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by LightningEffect (src/renderer/effects/lightningEffect.ts).
- **Audio features:** beat, beatStrength, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.bolt` | boolean | true | unspecified | Used in effect render logic. | unknown |
| `params.branches` | number | 1 | unspecified | Used in effect render logic. | yes |
| `params.chancePerSecond` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.cooldown` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.flashDuration` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.seed` | number | 0 | unspecified | Used in effect render logic. | yes |
| `params.trigger` | number | no explicit default | unspecified | Used in effect render logic. | yes |

### Minimal layer usage

```json
{
  "effect": "lightning",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: neon_alley

- **Registry key:** `neon_alley`
- **Implementation:** `src/renderer/effects/gl/neonAlleyEffect.ts` (class `NeonAlleyEffect`)
- **Renderer:** WebGL2
- **Description:** Implemented by NeonAlleyEffect (src/renderer/effects/gl/neonAlleyEffect.ts).
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

## Effect: space_hangar

- **Registry key:** `space_hangar`
- **Implementation:** `src/renderer/effects/gl/spaceHangarEffect.ts` (class `SpaceHangarEffect`)
- **Renderer:** WebGL2
- **Description:** Implemented by SpaceHangarEffect (src/renderer/effects/gl/spaceHangarEffect.ts).
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

## Effect: wireframeRide

- **Registry key:** `wireframeRide`
- **Implementation:** `src/renderer/effects/wireframeRide.ts` (class `WireframeRideEffect`)
- **Renderer:** hybrid
- **Description:** Implemented by WireframeRideEffect (src/renderer/effects/wireframeRide.ts).
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

## Effect: roadDrive

- **Registry key:** `roadDrive`
- **Implementation:** `src/renderer/effects/roadDrive.ts` (class `RoadDriveEffect`)
- **Renderer:** hybrid
- **Description:** Implemented by RoadDriveEffect (src/renderer/effects/roadDrive.ts).
- **Audio features:** bass, rms
- **Performance notes:** Hybrid WebGL2 rendering with Canvas2D blitting.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.bassReactive` | number | 0.85 | min 0, max 2 | Bass Reactive | yes |
| `params.cameraBob` | number | 0.22 | min 0, max 1.5 | Camera Bob | yes |
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

## Effect: effect_evolution

- **Registry key:** `effect_evolution`
- **Implementation:** `src/renderer/effects/effectEvolution.ts` (class `EffectEvolution`)
- **Renderer:** Canvas2D
- **Description:** Implemented by EffectEvolution (src/renderer/effects/effectEvolution.ts).
- **Audio features:** bass, beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.density` | number | 1 | unspecified | Used in effect render logic. | yes |
| `params.motion` | number | 0.6 | unspecified | Used in effect render logic. | yes |
| `params.seed` | number | 13 | unspecified | Used in effect render logic. | yes |
| `params.trail` | number | 0.15 | unspecified | Used in effect render logic. | yes |
| `params.warp` | number | 0.4 | unspecified | Used in effect render logic. | yes |

### Minimal layer usage

```json
{
  "effect": "effect_evolution",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: fluid

- **Registry key:** `fluid`
- **Implementation:** `src/renderer/effects/fluidSimEffect.ts` (class `FluidSimEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by FluidSimEffect (src/renderer/effects/fluidSimEffect.ts).
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

## Effect: treegrowth

- **Registry key:** `treegrowth`
- **Implementation:** `src/renderer/effects/treeGrowthEffect.ts` (class `TreeGrowthEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by TreeGrowthEffect (src/renderer/effects/treeGrowthEffect.ts).
- **Audio features:** bass, rms, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.branchAngle` | number | 28 | min 10, max 60 | Branch Angle | yes |
| `params.branchScale` | number | 0.72 | min 0.5, max 0.85 | Branch Scale | yes |
| `params.growth` | number | 1 | min 0, max 1 | Growth Override | yes |
| `params.jitter` | number | 0.25 | min 0, max 0.6 | Jitter | yes |
| `params.leafSize` | number | 3 | min 0, max 10 | Leaf Size | yes |
| `params.levels` | number | 6 | min 3, max 9 | Levels | yes |
| `params.seed` | number | 0 | min 0, max 10 | Seed | yes |
| `params.speed` | number | 0.18 | min 0, max 1 | Speed | yes |
| `params.sway` | number | 0.35 | min 0, max 1.2 | Sway | yes |
| `params.trunkHeight` | number | 0.45 | min 0.25, max 0.65 | Trunk Height | yes |
| `params.trunkWidth` | number | 10 | min 4, max 24 | Trunk Width | yes |

### Minimal layer usage

```json
{
  "effect": "treegrowth",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: vector3d_balls

- **Registry key:** `vector3d_balls`
- **Implementation:** `src/renderer/effects/vector3dBalls.ts` (class `Vector3dBallsEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by Vector3dBallsEffect (src/renderer/effects/vector3dBalls.ts).
- **Audio features:** bass, beat
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.45 | unspecified | Used in effect render logic. | yes |
| `params.baseDotSize` | number | 1.8 | unspecified | Used in effect render logic. | yes |
| `params.beatKick` | number | 0.45 | unspecified | Used in effect render logic. | yes |
| `params.camDist` | number | 3.2 | unspecified | Used in effect render logic. | yes |
| `params.dotDepthScale` | number | 2 | unspecified | Used in effect render logic. | yes |
| `params.lineWidth` | number | 1.6 | unspecified | Used in effect render logic. | yes |
| `params.model` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.palette` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.pointCount` | number | 420 | unspecified | Used in effect render logic. | yes |
| `params.rotXSpeed` | number | 0.35 | unspecified | Used in effect render logic. | yes |
| `params.rotYSpeed` | number | 0.5 | unspecified | Used in effect render logic. | yes |
| `params.rotZSpeed` | number | 0.08 | unspecified | Used in effect render logic. | yes |
| `params.roundDots` | number | 0 | unspecified | Used in effect render logic. | yes |
| `params.seed` | number | 11 | unspecified | Used in effect render logic. | yes |
| `params.stripeFreq` | number | 5 | unspecified | Used in effect render logic. | yes |
| `params.stripeSpeed` | number | 0.18 | unspecified | Used in effect render logic. | yes |
| `params.stripeStrength` | number | 0.75 | unspecified | Used in effect render logic. | yes |
| `params.trail` | number | 0 | unspecified | Used in effect render logic. | yes |
| `params.wireframe` | number | 1 | unspecified | Used in effect render logic. | yes |

### Minimal layer usage

```json
{
  "effect": "vector3d_balls",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: amiga_showcase

- **Registry key:** `amiga_showcase`
- **Implementation:** `src/renderer/effects/amigaShowcase.ts` (class `AmigaShowcaseEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by AmigaShowcaseEffect (src/renderer/effects/amigaShowcase.ts).
- **Audio features:** bass, beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.7 | unspecified | Used in effect render logic. | yes |
| `params.barCount` | number | 8 | unspecified | Used in effect render logic. | yes |
| `params.barSaturation` | number | 0.85 | unspecified | Used in effect render logic. | yes |
| `params.barSpeed` | number | 0.9 | unspecified | Used in effect render logic. | yes |
| `params.barWaveAmp` | number | 18 | unspecified | Used in effect render logic. | yes |
| `params.barWaveFreq` | number | 1.2 | unspecified | Used in effect render logic. | yes |
| `params.bobCount` | number | 6 | unspecified | Used in effect render logic. | yes |
| `params.bobIntensity` | number | 1 | unspecified | Used in effect render logic. | yes |
| `params.bobRadius` | number | 0.12 | unspecified | Used in effect render logic. | yes |
| `params.bobTrail` | number | 0.18 | unspecified | Used in effect render logic. | yes |
| `params.glenz` | boolean | true | unspecified | Used in effect render logic. | unknown |
| `params.twistAmp` | number | 70 | unspecified | Used in effect render logic. | yes |
| `params.twistHueSpeed` | number | 55 | unspecified | Used in effect render logic. | yes |
| `params.twistSlices` | number | 120 | unspecified | Used in effect render logic. | yes |
| `params.twistSpeed` | number | 1.1 | unspecified | Used in effect render logic. | yes |
| `params.twistWidth` | number | 180 | unspecified | Used in effect render logic. | yes |
| `params.twistX` | number | no explicit default | unspecified | Used in effect render logic. | yes |

### Minimal layer usage

```json
{
  "effect": "amiga_showcase",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: sine_scroller_logo

- **Registry key:** `sine_scroller_logo`
- **Implementation:** `src/renderer/effects/sineScrollerLogo.ts` (class `SineScrollerLogoEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by SineScrollerLogoEffect (src/renderer/effects/sineScrollerLogo.ts).
- **Audio features:** bass, beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.7 | unspecified | Used in effect render logic. | yes |
| `params.beatBoost` | number | 0.6 | unspecified | Used in effect render logic. | yes |
| `params.fontSize` | number | 22 | unspecified | Used in effect render logic. | yes |
| `params.layer2` | boolean | false | unspecified | Used in effect render logic. | unknown |
| `params.layer2FontSize` | number | 16 | unspecified | Used in effect render logic. | yes |
| `params.layer2Speed` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.layer2Y` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.logoFontSize` | number | 96 | unspecified | Used in effect render logic. | yes |
| `params.logoText` | string | "VIBES" | unspecified | Used in effect render logic. | no |
| `params.logoWaveAmp` | number | 18 | unspecified | Used in effect render logic. | yes |
| `params.logoWaveFreq` | number | 0.06 | unspecified | Used in effect render logic. | yes |
| `params.logoWaveSpeed` | number | 2 | unspecified | Used in effect render logic. | yes |
| `params.logoY` | number | 52 | unspecified | Used in effect render logic. | yes |
| `params.message` | string | "   SOOOOOOO COOOOOOOL   " | unspecified | Used in effect render logic. | no |
| `params.scanlineStep` | number | 2 | unspecified | Used in effect render logic. | yes |
| `params.scrollerX` | number | 0 | unspecified | Used in effect render logic. | yes |
| `params.scrollerY` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.speed` | number | 90 | unspecified | Used in effect render logic. | yes |
| `params.waveAmp` | number | 10 | unspecified | Used in effect render logic. | yes |
| `params.wavePhaseStep` | number | 0.55 | unspecified | Used in effect render logic. | yes |
| `params.waveSpeed` | number | 2.2 | unspecified | Used in effect render logic. | yes |

### Minimal layer usage

```json
{
  "effect": "sine_scroller_logo",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: border_multiplex

- **Registry key:** `border_multiplex`
- **Implementation:** `src/renderer/effects/borderMultiplexEffect.ts` (class `BorderMultiplexEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by BorderMultiplexEffect (src/renderer/effects/borderMultiplexEffect.ts).
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

## Effect: raster_bars

- **Registry key:** `raster_bars`
- **Implementation:** `src/renderer/effects/rasterBars.ts` (class `RasterBarsEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by RasterBarsEffect (src/renderer/effects/rasterBars.ts).
- **Audio features:** bass, beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.7 | unspecified | Used in effect render logic. | yes |
| `params.barCount` | number | 10 | unspecified | Used in effect render logic. | yes |
| `params.barThickness` | number | 18 | unspecified | Used in effect render logic. | yes |
| `params.beatThump` | number | 0.6 | unspecified | Used in effect render logic. | yes |
| `params.border` | boolean | false | unspecified | Used in effect render logic. | unknown |
| `params.borderSize` | number | 48 | unspecified | Used in effect render logic. | yes |
| `params.orientation` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.palette` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.scanlineStep` | number | 2 | unspecified | Used in effect render logic. | yes |
| `params.speed` | number | 0.8 | unspecified | Used in effect render logic. | yes |
| `params.splitStrength` | number | 0.65 | unspecified | Used in effect render logic. | yes |
| `params.waveAmp` | number | 22 | unspecified | Used in effect render logic. | yes |
| `params.waveFreq` | number | 1.2 | unspecified | Used in effect render logic. | yes |

### Minimal layer usage

```json
{
  "effect": "raster_bars",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: copper_gradient_splits

- **Registry key:** `copper_gradient_splits`
- **Implementation:** `src/renderer/effects/copperGradientSplits.ts` (class `CopperGradientSplitsEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by CopperGradientSplitsEffect (src/renderer/effects/copperGradientSplits.ts).
- **Audio features:** bass, beat, rms
- **Performance notes:** Uses ImageData per frame; CPU cost scales with resolution.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.7 | unspecified | Used in effect render logic. | yes |
| `params.barCount` | number | 10 | unspecified | Used in effect render logic. | yes |
| `params.barHueStep` | number | 22 | unspecified | Used in effect render logic. | yes |
| `params.barWobble` | number | 28 | unspecified | Used in effect render logic. | yes |
| `params.beatKick` | number | 0.7 | unspecified | Used in effect render logic. | yes |
| `params.gradientRowStep` | number | 16 | unspecified | Used in effect render logic. | yes |
| `params.hamish` | boolean | true | unspecified | Used in effect render logic. | unknown |
| `params.hamishStrength` | number | 0.35 | unspecified | Used in effect render logic. | yes |
| `params.hueWobble` | number | 18 | unspecified | Used in effect render logic. | yes |
| `params.lightnessBase` | number | 0.35 | unspecified | Used in effect render logic. | yes |
| `params.lightnessPeak` | number | 0.68 | unspecified | Used in effect render logic. | yes |
| `params.paletteClamp` | boolean | false | unspecified | Used in effect render logic. | unknown |
| `params.paletteClampSteps` | number | 32 | unspecified | Used in effect render logic. | yes |
| `params.regions` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.saturation` | number | 0.9 | unspecified | Used in effect render logic. | yes |
| `params.scanStep` | number | 2 | unspecified | Used in effect render logic. | yes |
| `params.speed` | number | 0.7 | unspecified | Used in effect render logic. | yes |
| `params.splits` | number | 3 | unspecified | Used in effect render logic. | yes |

### Minimal layer usage

```json
{
  "effect": "copper_gradient_splits",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: envmap_donut

- **Registry key:** `envmap_donut`
- **Implementation:** `src/renderer/effects/envmapDonut.ts` (class `EnvmapDonutEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by EnvmapDonutEffect (src/renderer/effects/envmapDonut.ts).
- **Audio features:** bass, beat
- **Performance notes:** Uses ImageData per frame; CPU cost scales with resolution.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.R` | number | 1.2 | min 0.6, max 2 | Major Radius | yes |
| `params.audioReact` | number | 0.7 | min 0, max 1 | Audio React | yes |
| `params.backfaceCull` | boolean | true | unspecified | Backface Cull | unknown |
| `params.beatKick` | number | 0.7 | min 0, max 1 | Beat Kick | yes |
| `params.bufH` | number | 180 | min 90, max 240 | Buffer Height | yes |
| `params.bufW` | number | 240 | min 120, max 320 | Buffer Width | yes |
| `params.camDist` | number | 3.4 | min 2, max 5 | Camera Distance | yes |
| `params.chromeDesat` | number | 0.35 | min 0, max 1 | Chrome Desat | yes |
| `params.edge` | boolean | false | unspecified | Edge Overlay | unknown |
| `params.focalMul` | number | 1.2 | min 0.6, max 2 | Focal Multiplier | yes |
| `params.fresnelStrength` | number | 0.35 | min 0, max 1.5 | Fresnel | yes |
| `params.r` | number | 0.55 | min 0.25, max 1 | Minor Radius | yes |
| `params.rotXSpeed` | number | 0.35 | min 0, max 2 | Rotate X | yes |
| `params.rotYSpeed` | number | 0.75 | min 0, max 2 | Rotate Y | yes |
| `params.rotZSpeed` | number | 0.15 | min 0, max 2 | Rotate Z | yes |
| `params.scanlines` | boolean | false | unspecified | Scanlines | unknown |
| `params.seed` | number | 0 | min 0, max 50 | Seed | yes |
| `params.segmentsU` | number | 64 | min 16, max 128 | Segments U | yes |
| `params.segmentsV` | number | 32 | min 12, max 96 | Segments V | yes |
| `params.shininess` | number | 24 | min 2, max 64 | Shininess | yes |
| `params.specStrength` | number | 0.45 | min 0, max 1.5 | Specular | yes |

### Minimal layer usage

```json
{
  "effect": "envmap_donut",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: voxel_landscape

- **Registry key:** `voxel_landscape`
- **Implementation:** `src/renderer/effects/voxelLandscape.ts` (class `VoxelLandscapeEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by VoxelLandscapeEffect (src/renderer/effects/voxelLandscape.ts).
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

## Effect: lens_wobbler

- **Registry key:** `lens_wobbler`
- **Implementation:** `src/renderer/effects/lensWobbler.ts` (class `LensWobblerEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by LensWobblerEffect (src/renderer/effects/lensWobbler.ts).
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

## Effect: poly_morph_showcase

- **Registry key:** `poly_morph_showcase`
- **Implementation:** `src/renderer/effects/polyMorphShowcase.ts` (class `PolyMorphShowcaseEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by PolyMorphShowcaseEffect (src/renderer/effects/polyMorphShowcase.ts).
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

## Effect: textured_cube

- **Registry key:** `textured_cube`
- **Implementation:** `src/renderer/effects/texturedCube.ts` (class `TexturedCubeEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by TexturedCubeEffect (src/renderer/effects/texturedCube.ts).
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

## Effect: twister

- **Registry key:** `twister`
- **Implementation:** `src/renderer/effects/twister.ts` (class `TwisterEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by TwisterEffect (src/renderer/effects/twister.ts).
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

## Effect: shadebobs_bobs

- **Registry key:** `shadebobs_bobs`
- **Implementation:** `src/renderer/effects/shadebobsBobs.ts` (class `ShadebobsBobsEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by ShadebobsBobsEffect (src/renderer/effects/shadebobsBobs.ts).
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
- **Description:** Implemented by SineDistorterEffect (src/renderer/effects/sineDistorter.ts).
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

## Effect: glenz_vectors

- **Registry key:** `glenz_vectors`
- **Implementation:** `src/renderer/effects/glenzVectors.ts` (class `GlenzVectorsEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by GlenzVectorsEffect (src/renderer/effects/glenzVectors.ts).
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

## Effect: raymarch_fractal

- **Registry key:** `raymarch_fractal`
- **Implementation:** `src/renderer/effects/raymarchFractal.ts` (class `RaymarchFractalEffect`)
- **Renderer:** hybrid
- **Description:** Implemented by RaymarchFractalEffect (src/renderer/effects/raymarchFractal.ts).
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

## Effect: metaballs

- **Registry key:** `metaballs`
- **Implementation:** `src/renderer/effects/metaballs.ts` (class `MetaballsEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by MetaballsEffect (src/renderer/effects/metaballs.ts).
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

## Effect: bumpmap_plane

- **Registry key:** `bumpmap_plane`
- **Implementation:** `src/renderer/effects/bumpmapPlane.ts` (class `BumpmapPlaneEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by BumpmapPlaneEffect (src/renderer/effects/bumpmapPlane.ts).
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

## Effect: raytrace_spheres

- **Registry key:** `raytrace_spheres`
- **Implementation:** `src/renderer/effects/raytraceSpheres.ts` (class `RaytraceSpheresEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by RaytraceSpheresEffect (src/renderer/effects/raytraceSpheres.ts).
- **Audio features:** bass, beatStrength
- **Performance notes:** Uses ImageData per frame; CPU cost scales with resolution.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.aa` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.aaMode` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.adaptive` | number | 1 | unspecified | Used in effect render logic. | yes |
| `params.ambient` | number | 0.12 | unspecified | Used in effect render logic. | yes |
| `params.audioReact` | number | 0.6 | unspecified | Used in effect render logic. | yes |
| `params.beatKick` | number | 0.7 | unspecified | Used in effect render logic. | yes |
| `params.bufH` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.bufW` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.cellSize` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.diffuseStrength` | number | 1 | unspecified | Used in effect render logic. | yes |
| `params.floorReflect` | number | 0.55 | unspecified | Used in effect render logic. | yes |
| `params.forceAA` | boolean | false | unspecified | Used in effect render logic. | unknown |
| `params.fov` | number | 60 | unspecified | Used in effect render logic. | yes |
| `params.maxDepth` | number | 2 | unspecified | Used in effect render logic. | yes |
| `params.outputSmoothing` | boolean | false | unspecified | Used in effect render logic. | unknown |
| `params.quality` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.refineGrow` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.refineThreshold` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.scanlines` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.seed` | number | 1337 | unspecified | Used in effect render logic. | yes |
| `params.shininess` | number | 48 | unspecified | Used in effect render logic. | yes |
| `params.specStrength` | number | 0.45 | unspecified | Used in effect render logic. | yes |
| `params.sphereCount` | number | no explicit default | unspecified | Used in effect render logic. | yes |

### Minimal layer usage

```json
{
  "effect": "raytrace_spheres",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: vga_fire

- **Registry key:** `vga_fire`
- **Implementation:** `src/renderer/effects/vgaFire.ts` (class `VgaFireEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by VgaFireEffect (src/renderer/effects/vgaFire.ts).
- **Audio features:** bass, beat
- **Performance notes:** Uses ImageData per frame; CPU cost scales with resolution.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.baseHeat` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.decay` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.fireH` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.fireW` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.glowStrength` | number | 0 | unspecified | Used in effect render logic. | yes |
| `params.gustOnBeat` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.logoSize` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.logoText` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.logoY` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.scanlines` | boolean | false | unspecified | Used in effect render logic. | unknown |
| `params.sparkChance` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.stepsPerFrame` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.turbulence` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.wind` | number | no explicit default | unspecified | Used in effect render logic. | yes |
| `params.windWave` | number | no explicit default | unspecified | Used in effect render logic. | yes |

### Minimal layer usage

```json
{
  "effect": "vga_fire",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: platformerScroll

- **Registry key:** `platformerScroll`
- **Implementation:** `src/renderer/effects/platformerScroll.ts` (class `PlatformerScrollEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by PlatformerScrollEffect (src/renderer/effects/platformerScroll.ts).
- **Audio features:** beat, rms
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.audioReact` | number | 0.35 | unspecified | Used in effect render logic. | yes |
| `params.beatKick` | number | 0.35 | unspecified | Used in effect render logic. | yes |
| `params.groundRatio` | number | 0.24 | unspecified | Used in effect render logic. | yes |
| `params.parallaxFar` | number | 0.2 | unspecified | Used in effect render logic. | yes |
| `params.parallaxFront` | number | 1 | unspecified | Used in effect render logic. | yes |
| `params.parallaxMid` | number | 0.5 | unspecified | Used in effect render logic. | yes |
| `params.platformMaxSteps` | number | 5 | unspecified | Used in effect render logic. | yes |
| `params.platformRate` | number | 0.55 | unspecified | Used in effect render logic. | yes |
| `params.seed` | number | 1337 | unspecified | Used in effect render logic. | yes |
| `params.speed` | number | 140 | unspecified | Used in effect render logic. | yes |
| `params.tileSize` | number | 16 | unspecified | Used in effect render logic. | yes |

### Minimal layer usage

```json
{
  "effect": "platformerScroll",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

## Effect: dotTunnel

- **Registry key:** `dotTunnel`
- **Implementation:** `src/renderer/effects/dotTunnel.ts` (class `DotTunnelEffect`)
- **Renderer:** Canvas2D
- **Description:** Implemented by DotTunnelEffect (src/renderer/effects/dotTunnel.ts).
- **Audio features:** bass, treble
- **Performance notes:** None noted.

### Parameters

| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
| --- | --- | --- | --- | --- | --- |
| `params.dotsPerRing` | number | 40 | unspecified | Used in effect render logic. | yes |
| `params.fov` | number | 72 | unspecified | Used in effect render logic. | yes |
| `params.glow` | number | 0.7 | unspecified | Used in effect render logic. | yes |
| `params.palette` | number | 0 | unspecified | Used in effect render logic. | yes |
| `params.ringCount` | number | 52 | unspecified | Used in effect render logic. | yes |
| `params.seed` | number | 1 | unspecified | Used in effect render logic. | yes |
| `params.speed` | number | 1 | unspecified | Used in effect render logic. | yes |
| `params.twist` | number | 0.9 | unspecified | Used in effect render logic. | yes |

### Minimal layer usage

```json
{
  "effect": "dotTunnel",
  "opacity": 1,
  "blend": "source-over",
  "params": {}
}
```

