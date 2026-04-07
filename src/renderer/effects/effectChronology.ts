import { effectManifests } from "./manifest";

export type ChronologyConfidence = "high" | "medium" | "low";

export type EffectChronologyEntry = {
  key: string;
  yearFit: number;
  confidence: ChronologyConfidence;
  lineage: string;
};

export const effectChronologyEntries: EffectChronologyEntry[] = [
  { key: "amiga_showcase", yearFit: 1990, confidence: "low", lineage: 'amiga megademo composite' },
  { key: "blobs", yearFit: 1989, confidence: "low", lineage: '' },
  { key: "boids_simulation", yearFit: 2002, confidence: "medium", lineage: 'boids flocking simulation' },
  { key: "bokeh", yearFit: 1990, confidence: "low", lineage: '' },
  { key: "border_multiplex", yearFit: 1993, confidence: "low", lineage: 'sprite multiplex/border-break' },
  { key: "bumpmap_plane", yearFit: 1990, confidence: "medium", lineage: '' },
  { key: "caustics", yearFit: 2004, confidence: "low", lineage: 'refractive caustics procedural' },
  { key: "chess", yearFit: 1991, confidence: "low", lineage: '' },
  { key: "cloth_sim", yearFit: 2003, confidence: "medium", lineage: 'verlet cloth simulation' },
  { key: "copper_gradient_splits", yearFit: 1990, confidence: "low", lineage: '' },
  { key: "cosmic_voyage", yearFit: 1992, confidence: "low", lineage: '' },
  { key: "doodle_greetz_wall", yearFit: 1986, confidence: "low", lineage: 'greets-wall presentation' },
  { key: "dotTunnel", yearFit: 1990, confidence: "medium", lineage: '' },
  { key: "effect_evolution", yearFit: 2020, confidence: "low", lineage: 'meta era-recap composition' },
  { key: "envmap_donut", yearFit: 1990, confidence: "medium", lineage: '' },
  { key: "equalizer", yearFit: 1991, confidence: "medium", lineage: '' },
  { key: "explicitpixels", yearFit: 1985, confidence: "low", lineage: '' },
  { key: "explosionBurst", yearFit: 1993, confidence: "low", lineage: '' },
  { key: "fake3d", yearFit: 1987, confidence: "medium", lineage: '' },
  { key: "feedback", yearFit: 1991, confidence: "medium", lineage: '' },
  { key: "finale", yearFit: 1991, confidence: "low", lineage: '' },
  { key: "fireworks_display", yearFit: 1993, confidence: "low", lineage: '' },
  { key: "fluid", yearFit: 2001, confidence: "medium", lineage: 'fluid simulation' },
  { key: "flyover", yearFit: 1992, confidence: "medium", lineage: '' },
  { key: "fractal", yearFit: 1990, confidence: "medium", lineage: '' },
  { key: "fractal_zoomer", yearFit: 1990, confidence: "medium", lineage: '' },
  { key: "gameOfLife", yearFit: 1987, confidence: "high", lineage: 'cellular automata part' },
  { key: "gl_fractal_tunnel", yearFit: 2011, confidence: "medium", lineage: 'raymarched tunnel shader' },
  { key: "gl_impossible_corridor", yearFit: 2011, confidence: "medium", lineage: 'raymarched corridor shader' },
  { key: "glenz_vectors", yearFit: 1990, confidence: "high", lineage: '' },
  { key: "glitch", yearFit: 1990, confidence: "low", lineage: '' },
  { key: "god_rays", yearFit: 2015, confidence: "medium", lineage: '' },
  { key: "greets_wall", yearFit: 1986, confidence: "low", lineage: 'greets-wall presentation' },
  { key: "hexGridPulse", yearFit: 2010, confidence: "low", lineage: '' },
  { key: "infiniteMirror", yearFit: 1992, confidence: "medium", lineage: 'feedback mirror recursion' },
  { key: "infinite_zoom_droste", yearFit: 1993, confidence: "medium", lineage: 'droste recursion zoom' },
  { key: "infinitycloud", yearFit: 2012, confidence: "low", lineage: '' },
  { key: "isogrid", yearFit: 1989, confidence: "medium", lineage: '' },
  { key: "kaleidoscope_symmetry", yearFit: 1988, confidence: "medium", lineage: '' },
  { key: "kefrens_bars", yearFit: 1988, confidence: "high", lineage: '' },
  { key: "lens_flare", yearFit: 1990, confidence: "low", lineage: '' },
  { key: "lens_wobbler", yearFit: 1994, confidence: "low", lineage: '' },
  { key: "lightning", yearFit: 1993, confidence: "low", lineage: '' },
  { key: "lissajous", yearFit: 1985, confidence: "medium", lineage: '' },
  { key: "marble", yearFit: 1992, confidence: "low", lineage: '' },
  { key: "matrix_rain", yearFit: 1999, confidence: "medium", lineage: '' },
  { key: "metaballs", yearFit: 1990, confidence: "high", lineage: '' },
  { key: "moire_grid", yearFit: 1985, confidence: "medium", lineage: '' },
  { key: "moving_shadow_map", yearFit: 2008, confidence: "low", lineage: '' },
  { key: "neon", yearFit: 1990, confidence: "low", lineage: '' },
  { key: "neon_alley", yearFit: 2012, confidence: "low", lineage: 'raymarched neon city shader' },
  { key: "particleAttractors", yearFit: 1992, confidence: "low", lineage: '' },
  { key: "particles", yearFit: 1991, confidence: "medium", lineage: '' },
  { key: "physics_pile", yearFit: 2004, confidence: "medium", lineage: 'rigid-body simulation part' },
  { key: "plasma", yearFit: 1988, confidence: "high", lineage: '' },
  { key: "platformerScroll", yearFit: 1991, confidence: "medium", lineage: 'retro sidescroller homage' },
  { key: "polar_tunnel", yearFit: 1990, confidence: "low", lineage: '' },
  { key: "poly_morph_showcase", yearFit: 1990, confidence: "low", lineage: '' },
  { key: "prism_bloom", yearFit: 2018, confidence: "low", lineage: 'painterly bloom composition' },
  { key: "proper3d", yearFit: 1987, confidence: "medium", lineage: '' },
  { key: "rain", yearFit: 1993, confidence: "low", lineage: '' },
  { key: "rainbow_cat", yearFit: 2011, confidence: "low", lineage: 'meme-synthwave sprite trail' },
  { key: "raster_bars", yearFit: 1982, confidence: "high", lineage: '' },
  { key: "raymarch_fractal", yearFit: 2010, confidence: "medium", lineage: 'raymarching fractal shader' },
  { key: "raytrace_spheres", yearFit: 1990, confidence: "high", lineage: '' },
  { key: "reactionDiffusion", yearFit: 2001, confidence: "medium", lineage: 'reaction-diffusion simulation' },
  { key: "recursiveFracture", yearFit: 1993, confidence: "low", lineage: '' },
  { key: "ribbons", yearFit: 1994, confidence: "low", lineage: '' },
  { key: "roadDrive", yearFit: 2013, confidence: "medium", lineage: 'shader road flythrough' },
  { key: "rotozoom", yearFit: 1989, confidence: "high", lineage: '' },
  { key: "shadebobs_bobs", yearFit: 1988, confidence: "high", lineage: '' },
  { key: "sine_distorter", yearFit: 1988, confidence: "low", lineage: '' },
  { key: "sine_scroller_logo", yearFit: 1983, confidence: "high", lineage: '' },
  { key: "skeletal_ribbon", yearFit: 1990, confidence: "low", lineage: '' },
  { key: "skyboxTransition", yearFit: 2015, confidence: "low", lineage: '' },
  { key: "smoke_simulation", yearFit: 2003, confidence: "medium", lineage: 'advection smoke simulation' },
  { key: "soft_shadows", yearFit: 1991, confidence: "low", lineage: '' },
  { key: "space_hangar", yearFit: 2012, confidence: "low", lineage: 'raymarched sci-fi shader' },
  { key: "spectrum_analyzer", yearFit: 1991, confidence: "medium", lineage: '' },
  { key: "sphere3d", yearFit: 1988, confidence: "low", lineage: '' },
  { key: "spherecloud", yearFit: 2012, confidence: "low", lineage: '' },
  { key: "starfield", yearFit: 1982, confidence: "high", lineage: '' },
  { key: "synthwaveSunset", yearFit: 2013, confidence: "medium", lineage: 'retrowave sunset tableau' },
  { key: "taco_meteor_shower", yearFit: 2020, confidence: "low", lineage: 'custom themed particle gag' },
  { key: "tetris_matrix", yearFit: 1989, confidence: "medium", lineage: 'retro game homage part' },
  { key: "textmode_charset", yearFit: 1983, confidence: "high", lineage: '' },
  { key: "textured_cube", yearFit: 1990, confidence: "high", lineage: '' },
  { key: "tilingMorph", yearFit: 1995, confidence: "low", lineage: '' },
  { key: "torus_orbit_3d", yearFit: 2006, confidence: "low", lineage: '' },
  { key: "tunnel", yearFit: 1989, confidence: "high", lineage: '' },
  { key: "twister", yearFit: 1988, confidence: "high", lineage: '' },
  { key: "vector3d_balls", yearFit: 1990, confidence: "medium", lineage: '' },
  { key: "velvet_dreamscape", yearFit: 2018, confidence: "low", lineage: 'painterly bloom composition' },
  { key: "vga_fire", yearFit: 1992, confidence: "high", lineage: '' },
  { key: "volumetric_clouds", yearFit: 2014, confidence: "medium", lineage: '' },
  { key: "voronoi_cells", yearFit: 1990, confidence: "low", lineage: '' },
  { key: "voxel_landscape", yearFit: 1990, confidence: "medium", lineage: 'heightfield voxel flyover' },
  { key: "voxel_world_builder", yearFit: 2014, confidence: "medium", lineage: 'instanced voxel builder' },
  { key: "water_drops", yearFit: 2009, confidence: "low", lineage: '' },
  { key: "wireframeRide", yearFit: 2013, confidence: "medium", lineage: 'shader wireframe flythrough' },
];

export const getSortedEffectChronology = (): EffectChronologyEntry[] =>
  [...effectChronologyEntries].sort((left, right) =>
    left.yearFit === right.yearFit ? left.key.localeCompare(right.key) : left.yearFit - right.yearFit
  );

export const buildEffectChronologyMarkdown = (options: { includeTitle?: boolean } = {}): string => {
  const { includeTitle = true } = options;
  const rows = getSortedEffectChronology()
    .map((entry) => `| \`${entry.key}\` | ${entry.yearFit} | ${entry.confidence} | ${entry.lineage || ""} |`)
    .join("\n");

  const header = includeTitle
    ? [
        "# Effect chronology (inferred)",
        ""
      ]
    : [];

  return [
    ...header,
    "Best-effort chronology by effect style/approach lineage as inferred from each implementation.",
    'Years are approximate "first-fit" dates in demoscene practice and not strict claims of first-ever appearance.',
    "",
    "| Effect | Year fit | Confidence | Lineage anchor |",
    "| --- | ---: | --- | --- |",
    rows
  ].join("\n");
};

export const validateEffectChronologyCoverage = (): { missing: string[]; extra: string[] } => {
  const registry = new Set(effectManifests.map((manifest) => manifest.key));
  const chrono = new Set(effectChronologyEntries.map((entry) => entry.key));
  const missing = Array.from(registry).filter((key) => !chrono.has(key)).sort();
  const extra = Array.from(chrono).filter((key) => !registry.has(key)).sort();
  return { missing, extra };
};
