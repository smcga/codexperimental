import { describe, expect, it } from "vitest";

import {
  DEFAULT_MOBILE_PREVIEW_PROFILE,
  computeDeviceScale,
  createMobilePreviewController,
  getTouchDeviceState
} from "./MobilePreview";

describe("computeDeviceScale", () => {
  it("fits the device profile inside the available editor viewport", () => {
    const scale = computeDeviceScale(1200, 1000, DEFAULT_MOBILE_PREVIEW_PROFILE, 24);
    expect(scale).toBeCloseTo((1000 - 48) / DEFAULT_MOBILE_PREVIEW_PROFILE.height, 5);
  });
});

describe("getTouchDeviceState", () => {
  it("returns true when mobile preview is enabled", () => {
    expect(getTouchDeviceState(true)).toBe(true);
  });
});

describe("createMobilePreviewController", () => {
  it("falls back to desktop sizing and DPR when disabled", () => {
    const controller = createMobilePreviewController({
      enabled: false,
      appRoot: {} as HTMLElement,
      canvas: {} as HTMLCanvasElement,
      overlay: {} as HTMLElement,
      mobileControls: null,
      profile: DEFAULT_MOBILE_PREVIEW_PROFILE
    });

    expect(controller.enabled).toBe(false);
    expect(controller.getSafeAreaInsets()).toEqual({ top: 0, bottom: 0, left: 0, right: 0 });
    expect(controller.getDpr()).toBe(1);
  });
});
