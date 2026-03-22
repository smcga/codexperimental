import { describe, expect, it } from "vitest";
import { effectManifests, getEffectManifest, getEffectRegistryKeys } from "./index";

describe("effect manifests", () => {
  it("keeps a deterministic key order", () => {
    const sortedKeys = [...getEffectRegistryKeys()].sort();
    expect(getEffectRegistryKeys()).toEqual(sortedKeys);
    expect(effectManifests.map((manifest) => manifest.key)).toEqual(sortedKeys);
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
});
