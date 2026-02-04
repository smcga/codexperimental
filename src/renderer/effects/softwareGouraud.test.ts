import { describe, expect, it } from "vitest";

import { SOFTWARE_GOURAUD_DEFAULTS, normalizeSoftwareGouraudParams } from "./softwareGouraud";

describe("SoftwareGouraudEffect params", () => {
  it("uses defaults when no params provided", () => {
    const params = normalizeSoftwareGouraudParams({});

    expect(params).toMatchObject({
      ...SOFTWARE_GOURAUD_DEFAULTS,
      wireframeOverlay: false
    });
  });

  it("clamps numeric values and resolves enums", () => {
    const params = normalizeSoftwareGouraudParams({
      bufW: 999,
      bufH: 20,
      segmentsU: 2,
      segmentsV: 200,
      model: "sphere",
      shading: "phong",
      wireframeOverlay: 1,
      ambient: 2,
      diffuse: -1,
      specStrength: 5,
      shininess: 1,
      audioReact: -1,
      beatKick: 2
    });

    expect(params.bufW).toBe(480);
    expect(params.bufH).toBe(80);
    expect(params.segmentsU).toBe(12);
    expect(params.segmentsV).toBe(96);
    expect(params.model).toBe("sphere");
    expect(params.shading).toBe("phong");
    expect(params.wireframeOverlay).toBe(true);
    expect(params.ambient).toBe(1);
    expect(params.diffuse).toBe(0);
    expect(params.specStrength).toBe(1);
    expect(params.shininess).toBe(2);
    expect(params.audioReact).toBe(0);
    expect(params.beatKick).toBe(1);
  });
});
