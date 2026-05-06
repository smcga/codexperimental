import { describe, expect, it, vi } from "vitest";

import { checkerboardWipeTransition } from "./checkerboardWipe";

describe("checkerboard wipe mobile transition", () => {
  it("uses the checkerboard mobile renderer instead of default crossfade", () => {
    const api = {
      drawMobileCheckerboardWipe: vi.fn(),
      drawMobileDefaultCrossfade: vi.fn()
    } as unknown as Parameters<NonNullable<typeof checkerboardWipeTransition.drawMobile>>[0];

    checkerboardWipeTransition.drawMobile?.(api, {} as Parameters<NonNullable<typeof checkerboardWipeTransition.drawMobile>>[1]);

    expect((api as { drawMobileCheckerboardWipe: ReturnType<typeof vi.fn> }).drawMobileCheckerboardWipe).toHaveBeenCalledTimes(1);
    expect((api as { drawMobileDefaultCrossfade: ReturnType<typeof vi.fn> }).drawMobileDefaultCrossfade).not.toHaveBeenCalled();
  });
});
