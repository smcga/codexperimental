import { describe, expect, it } from "vitest";

import { formatSubscriptClock, getAnimatedTitle } from "./titleFx";

describe("titleFx", () => {
  it("formats elapsed seconds with subscript digits", () => {
    expect(formatSubscriptClock(0)).toBe("₀₀:₀₀");
    expect(formatSubscriptClock(83)).toBe("₀₁:₂₃");
    expect(formatSubscriptClock(605)).toBe("₁₀:₀₅");
  });

  it("builds animated title frames with spinner and binary counter", () => {
    expect(getAnimatedTitle(0, 0)).toBe("⠋ ⌁ＳＩＧＮＡＬ⌁ ₀₀:₀₀ · 00000000");
    expect(getAnimatedTitle(3, 42_000)).toBe("⣠ ⟡ＳＩＧＮＡＬ⟡ ₀₀:₄₂ · 00101010");
  });
});
