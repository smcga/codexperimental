import { describe, expect, it } from "vitest";
import {
  clearRuntimeEffectManifests,
  effectManifests,
  getEffectManifest,
  getEffectRegistryKeys,
  registerRuntimeEffectManifest
} from "./index";

describe("effect manifests", () => {
  it("keeps a deterministic key order", () => {
    const sortedKeys = [...getEffectRegistryKeys()].sort();
    expect(getEffectRegistryKeys()).toEqual(sortedKeys);
    expect(effectManifests.map((manifest) => manifest.key)).toEqual(sortedKeys);
  });

  it("does not expose removed effects in the registry", () => {
    expect(getEffectRegistryKeys()).not.toContain("lemmings_march");
    expect(getEffectManifest("lemmings_march")).toBeNull();
  });

  it("provides shared docs and debug metadata for known effects", () => {
    const manifest = getEffectManifest("starfield");
    expect(manifest?.docs.catalogNote).toContain("flight feel");
    expect(manifest?.debug.controls.map((control) => control.key)).toEqual([
      "speed",
      "warp",
      "turnRate",
      "turnStrength",
      "drift",
      "sparkle",
      "colorShift"
    ]);
  });
  it("exposes full matrix_rain debug controls", () => {
    const manifest = getEffectManifest("matrix_rain");
    expect(manifest?.debug.controls.map((control) => control.key)).toEqual([
      "speed",
      "density",
      "fontSize",
      "trail",
      "glow",
      "brightness",
      "jitter",
      "audioReact",
      "glyphSet",
      "seed"
    ]);
  });

  it("exposes voronoi_cells controls and docs metadata", () => {
    const manifest = getEffectManifest("voronoi_cells");
    expect(manifest?.debug.controls.map((control) => control.key)).toEqual([
      "cellCount",
      "drift",
      "speed",
      "lineWidth",
      "lineAlpha",
      "fillAlpha",
      "contrast",
      "jitter",
      "paletteMode",
      "beatPulse",
      "shade",
      "seed",
      "pixelStep",
      "chromatic"
    ]);
    expect(manifest?.docs.catalogNote).toContain("Voronoi-style cellular mosaic");
  });

  it("supports runtime effect manifests for generated effects", () => {
    clearRuntimeEffectManifests();
    registerRuntimeEffectManifest({
      key: "Generated Test",
      className: "GeneratedEffect",
      sourcePath: "generated/effectIdeas",
      createEffect: () => ({ render: () => undefined }),
      debug: {
        title: "Generated Test Controls",
        controls: [{
          key: "speed",
          label: "Speed",
          type: "number",
          defaultValue: 1,
          min: 0,
          max: 2,
          step: 0.1
        }]
      },
      docs: {
        description: "Generated docs",
        parameters: "- speed: movement speed",
        catalogNote: "Generated"
      }
    });

    const manifest = getEffectManifest("Generated Test");
    expect(manifest?.debug.controls.map((control) => control.key)).toEqual(["speed"]);
    expect(getEffectRegistryKeys()).toContain("Generated Test");
    clearRuntimeEffectManifests();
  });
});
