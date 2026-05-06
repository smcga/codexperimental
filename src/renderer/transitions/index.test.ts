import { describe, expect, it } from "vitest";

import { buildTransitionOptionMarkup, transitionDefinitions, transitionKeys, transitionOptions, transitionRegistry } from "./index";

describe("transition registry", () => {
  it("keeps the exported keys, labels, and registry entries in sync", () => {
    expect(transitionKeys).toEqual(transitionDefinitions.map((definition) => definition.key));
    expect(transitionOptions).toEqual(
      transitionDefinitions.map((definition) => ({
        value: definition.key,
        label: definition.label
      }))
    );
    expect(transitionRegistry["bitplane-wipe"].label).toBe("Bitplane Wipe");
    expect(transitionRegistry["audio-reactive-particle"].label).toBe("Audio-reactive Particle");
    expect(transitionRegistry["camera-punch-through"].drawMobile).toBeTypeOf("function");
    expect(transitionRegistry["checkerboard-wipe"].label).toBe("Checkerboard Wipe");
    expect(transitionRegistry["venetian-blinds"].label).toBe("Venetian Blinds");
    expect(transitionRegistry["radial-wipe"].label).toBe("Radial Wipe");
    expect(transitionRegistry["noise-threshold"].label).toBe("Noise Threshold");
    expect(transitionRegistry["portal-zoom"].label).toBe("Portal Zoom");
    expect(transitionRegistry["whip-pan"].label).toBe("Whip Pan");
    expect(transitionRegistry["quantum-slice"].label).toBe("Quantum Slice");
    expect(transitionRegistry["chromatic-bloom"].label).toBe("Chromatic Bloom");
    expect(transitionRegistry["neural-feedback"].label).toBe("Neural Feedback");
  });



  it("provides a mobile transition renderer for every transition", () => {
    for (const definition of transitionDefinitions) {
      expect(definition.drawMobile).toBeTypeOf("function");
    }
  });

  it("builds debug select markup from the registry with an optional auto entry", () => {
    expect(buildTransitionOptionMarkup()).toContain('<option value="neural-feedback">Neural Feedback</option>');
    expect(buildTransitionOptionMarkup({ includeAuto: true })).toContain('<option value="auto">Auto</option>');
  });
});
