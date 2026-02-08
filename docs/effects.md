diff --git a/EffectsReference.md b/EffectsReference.md
@@
-Total effects: **59**.
+Total effects: **60**.
@@
 - [Effect: raytrace_spheres](#effect-raytrace-spheres)
 - [Effect: vga_fire](#effect-vga-fire)
 - [Effect: platformerScroll](#effect-platformerScroll)
-<<<<<<< codex/add-greetswall-effect-with-configuration-options
-- [Effect: greets_wall](#effect-greets-wall)
-=======
-- [Effect: dotTunnel](#effect-dotTunnel)
->>>>>>> main
+- [Effect: greets_wall](#effect-greets-wall)
+- [Effect: dotTunnel](#effect-dotTunnel)
@@
 ### Common parameter patterns
-
-<<<<<<< codex/add-greetswall-effect-with-configuration-options
-- `speed` (used in 34 effects)
-- `seed` (used in 22 effects)
-- `audioReact` (used in 22 effects)
-- `beatKick` (used in 14 effects)
-- `glow` (used in 7 effects)
-=======
-- `speed` (used in 35 effects)
-- `seed` (used in 23 effects)
-- `audioReact` (used in 21 effects)
-- `beatKick` (used in 14 effects)
-- `glow` (used in 8 effects)
->>>>>>> main
+- `speed` (used in 35 effects)
+- `seed` (used in 23 effects)
+- `audioReact` (used in 22 effects)
+- `beatKick` (used in 14 effects)
+- `glow` (used in 8 effects)
@@
 ## Effect: platformerScroll
@@
 ### Minimal layer usage
@@
 {
   "effect": "platformerScroll",
   "opacity": 1,
   "blend": "source-over",
   "params": {}
 }
 
-<<<<<<< codex/add-greetswall-effect-with-configuration-options
 ## Effect: greets_wall
 
 - **Registry key:** `greets_wall`
 - **Implementation:** `src/renderer/effects/greetsWall.ts` (class `GreetsWallEffect`)
 - **Renderer:** Canvas2D
 - **Description:** Implemented by GreetsWallEffect (src/renderer/effects/greetsWall.ts).
 - **Audio features:** beat, impactStrength, rms
--=======
-## Effect: dotTunnel
-
-- **Registry key:** `dotTunnel`
-- **Implementation:** `src/renderer/effects/dotTunnel.ts` (class `DotTunnelEffect`)
-- **Renderer:** Canvas2D
-- **Description:** Implemented by DotTunnelEffect (src/renderer/effects/dotTunnel.ts).
-- **Audio features:** bass, treble
->>>>>>> main
 - **Performance notes:** None noted.
 
 ### Parameters
 
 | JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |
 | --- | --- | --- | --- | --- | --- |
-<<<<<<< codex/add-greetswall-effect-with-configuration-options
 | `params.audioReact` | number | 0.45 | min 0, max 1 | Audio React | yes |
 | `params.beatPulseDecay` | number | 2.2 | min 0.2, max 8 | Beat Decay | yes |
 | `params.columns` | number | 3 | min 1, max 8 | Columns | yes |
 | `params.cycleSeconds` | number | 1.5 | min 0.35, max 6 | Cycle Seconds | yes |
 | `params.highlightPulse` | number | 0.65 | min 0, max 1.5 | Highlight Pulse | yes |
 | `params.layout` | string | "grid" | options: grid, carousel | Layout | no |
 | `params.names` | string | "Fairlight|TRSI|Spaceballs|CNCD|Mercury|TBL" | unspecified | Used in effect render logic. | no |
 | `params.padding` | number | 0.08 | min 0.02, max 0.18 | Padding | yes |
 | `params.title` | string | "GREETS" | unspecified | Used in effect render logic. | no |
 | `params.transitionStyle` | string | "slide" | options: slide, fade, pop | Transition | no |
-=======
-| `params.dotsPerRing` | number | 40 | unspecified | Used in effect render logic. | yes |
-| `params.fov` | number | 72 | unspecified | Used in effect render logic. | yes |
-| `params.glow` | number | 0.7 | unspecified | Used in effect render logic. | yes |
-| `params.palette` | number | 0 | unspecified | Used in effect render logic. | yes |
-| `params.ringCount` | number | 52 | unspecified | Used in effect render logic. | yes |
-| `params.seed` | number | 1 | unspecified | Used in effect render logic. | yes |
-| `params.speed` | number | 1 | unspecified | Used in effect render logic. | yes |
-| `params.twist` | number | 0.9 | unspecified | Used in effect render logic. | yes |
->>>>>>> main
 
 ### Minimal layer usage
 
 ```json
 {
-<<<<<<< codex/add-greetswall-effect-with-configuration-options
   "effect": "greets_wall",
-=======
-  "effect": "dotTunnel",
->>>>>>> main
   "opacity": 1,
   "blend": "source-over",
   "params": {}
 }
