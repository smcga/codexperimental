import { Effect } from "./types";
import { StarfieldEffect } from "./starfieldEffect";
import { PlasmaEffect } from "./plasmaEffect";
import { TunnelEffect } from "./tunnelEffect";
import { RotozoomEffect } from "./rotozoomEffect";
import { BlobsEffect } from "./blobsEffect";
import { RibbonEffect } from "./ribbonEffect";
import { LissajousEffect } from "./lissajousEffect";
import { GlitchEffect } from "./glitchEffect";
import { BokehEffect } from "./bokehEffect";
import { FractalEffect } from "./fractalEffect";
import { FeedbackEffect } from "./feedbackEffect";
import { EqualizerEffect } from "./equalizerEffect";
import { IsoGridEffect } from "./isoGridEffect";
import { NeonShapesEffect } from "./neonShapesEffect";
import { ParticleFieldEffect } from "./particleFieldEffect";
import { FinaleEffect } from "./finaleEffect";
import { Proper3DEffect } from "./proper3dEffect";
import { Fake3DEffect } from "./fake3dEffect";
import { PortraitGlowEffect } from "./portraitGlowEffect";
import { SphereEffect } from "./sphereEffect";
import { SphereCloudEffect } from "./sphereCloudEffect";
import { InfinityCloudEffect } from "./infinityCloudEffect";
import { ChessEffect } from "./chessEffect";
import { FlyoverEffect } from "./flyoverEffect";
import { SynthwaveSunsetEffect } from "./synthwaveSunset";
import { FractalTunnelEffect } from "./gl/fractalTunnelEffect";
import { PhysicsPileEffect } from "./physicsPile";
import { ImpossibleCorridorEffect } from "./gl/impossibleCorridorEffect";
import { RainEffect } from "./rainEffect";
import { LightningEffect } from "./lightningEffect";
import { NeonAlleyEffect } from "./gl/neonAlleyEffect";
import { SpaceHangarEffect } from "./gl/spaceHangarEffect";
import { WireframeRideEffect } from "./wireframeRide";
import { RoadDriveEffect } from "./roadDrive";
import { EffectEvolution } from "./effectEvolution";
import { FluidSimEffect } from "./fluidSimEffect";
import { TreeGrowthEffect } from "./treeGrowthEffect";
import { Vector3dBallsEffect } from "./vector3dBalls";
import { AmigaShowcaseEffect } from "./amigaShowcase";
import { SineScrollerLogoEffect } from "./sineScrollerLogo";
import { BorderMultiplexEffect } from "./borderMultiplexEffect";
import { RasterBarsEffect } from "./rasterBars";
import { CopperGradientSplitsEffect } from "./copperGradientSplits";
import { EnvmapDonutEffect } from "./envmapDonut";
import { VoxelLandscapeEffect } from "./voxelLandscape";
import { LensWobblerEffect } from "./lensWobbler";
import { PolyMorphShowcaseEffect } from "./polyMorphShowcase";
import { TexturedCubeEffect } from "./texturedCube";
import { TwisterEffect } from "./twister";
import { ShadebobsBobsEffect } from "./shadebobsBobs";
import { SineDistorterEffect } from "./sineDistorter";
import { GlenzVectorsEffect } from "./glenzVectors";
import { RaymarchFractalEffect } from "./raymarchFractal";
import { MetaballsEffect } from "./metaballs";
import { BumpmapPlaneEffect } from "./bumpmapPlane";
import { RaytraceSpheresEffect } from "./raytraceSpheres";
import { VgaFireEffect } from "./vgaFire";
import { PlatformerScrollEffect } from "./platformerScroll";
import { DotTunnelEffect } from "./dotTunnel";

export const effectRegistry: Record<string, Effect> = {
  starfield: new StarfieldEffect(),
  plasma: new PlasmaEffect(),
  tunnel: new TunnelEffect(),
  rotozoom: new RotozoomEffect(),
  blobs: new BlobsEffect(),
  ribbons: new RibbonEffect(),
  lissajous: new LissajousEffect(),
  glitch: new GlitchEffect(),
  bokeh: new BokehEffect(),
  fractal: new FractalEffect(),
  feedback: new FeedbackEffect(),
  equalizer: new EqualizerEffect(),
  isogrid: new IsoGridEffect(),
  neon: new NeonShapesEffect(),
  particles: new ParticleFieldEffect(),
  finale: new FinaleEffect(),
  proper3d: new Proper3DEffect(),
  fake3d: new Fake3DEffect(),
  portrait: new PortraitGlowEffect(),
  sphere3d: new SphereEffect(),
  spherecloud: new SphereCloudEffect(),
  infinitycloud: new InfinityCloudEffect(),
  chess: new ChessEffect(),
  flyover: new FlyoverEffect(),
  gl_fractal_tunnel: new FractalTunnelEffect(),
  physics_pile: new PhysicsPileEffect(),
  gl_impossible_corridor: new ImpossibleCorridorEffect(),
  synthwaveSunset: new SynthwaveSunsetEffect(),
  rain: new RainEffect(),
  lightning: new LightningEffect(),
  neon_alley: new NeonAlleyEffect(),
  space_hangar: new SpaceHangarEffect(),
  wireframeRide: new WireframeRideEffect(),
  roadDrive: new RoadDriveEffect(),
  effect_evolution: new EffectEvolution(),
  fluid: new FluidSimEffect(),
  treegrowth: new TreeGrowthEffect(),
  vector3d_balls: new Vector3dBallsEffect(),
  amiga_showcase: new AmigaShowcaseEffect(),
  sine_scroller_logo: new SineScrollerLogoEffect(),
  border_multiplex: new BorderMultiplexEffect(),
  raster_bars: new RasterBarsEffect(),
  copper_gradient_splits: new CopperGradientSplitsEffect(),
  envmap_donut: new EnvmapDonutEffect(),
  voxel_landscape: new VoxelLandscapeEffect(),
  lens_wobbler: new LensWobblerEffect(),
  poly_morph_showcase: new PolyMorphShowcaseEffect(),
  textured_cube: new TexturedCubeEffect(),
  twister: new TwisterEffect(),
  shadebobs_bobs: new ShadebobsBobsEffect(),
  sine_distorter: new SineDistorterEffect(),
  glenz_vectors: new GlenzVectorsEffect(),
  raymarch_fractal: new RaymarchFractalEffect(),
  metaballs: new MetaballsEffect(),
  bumpmap_plane: new BumpmapPlaneEffect(),
  raytrace_spheres: new RaytraceSpheresEffect(),
  vga_fire: new VgaFireEffect(),
  platformerScroll: new PlatformerScrollEffect(),
  dotTunnel: new DotTunnelEffect()
};

export function resetEffects(): void {
  Object.values(effectRegistry).forEach((effect) => {
    effect.reset?.();
  });
}
