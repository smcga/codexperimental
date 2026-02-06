import { describe, expect, it } from "vitest";
import { getRenderSettings } from "./renderSettings";

describe("getRenderSettings", () => {
  it("uses defaults with no params", () => {
    const settings = getRenderSettings(new URLSearchParams());
    expect(settings).toEqual({
      baseWidth: 320,
      baseHeight: 180,
      baseScale: 1,
      qualityScale: 1,
      autoQuality: false
    });
  });

  it("applies baseScale to base dimensions", () => {
    const settings = getRenderSettings(new URLSearchParams("baseScale=2"));
    expect(settings.baseWidth).toBe(640);
    expect(settings.baseHeight).toBe(360);
  });

  it("accepts explicit base dimensions when valid 16:9", () => {
    const settings = getRenderSettings(new URLSearchParams("baseW=640&baseH=360"));
    expect(settings.baseWidth).toBe(640);
    expect(settings.baseHeight).toBe(360);
  });

  it("ignores invalid base dimensions", () => {
    const settings = getRenderSettings(new URLSearchParams("baseW=640&baseH=400"));
    expect(settings.baseWidth).toBe(320);
    expect(settings.baseHeight).toBe(180);
  });

  it("clamps quality settings and enables autoQuality", () => {
    const settings = getRenderSettings(new URLSearchParams("quality=0.2&autoQuality=1"));
    expect(settings.qualityScale).toBe(0.65);
    expect(settings.autoQuality).toBe(true);
  });
});
