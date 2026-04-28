import { describe, expect, it, vi } from "vitest";

import { audioReactiveParticleTransition } from "./audioReactiveParticleTransition";

describe("audioReactiveParticleTransition", () => {
  it("forwards desktop draw calls to the renderer API", () => {
    const api = {
      drawAudioReactiveParticle: vi.fn()
    } as unknown as Parameters<typeof audioReactiveParticleTransition.draw>[0];

    audioReactiveParticleTransition.draw(api, {} as Parameters<typeof audioReactiveParticleTransition.draw>[1]);

    expect(api.drawAudioReactiveParticle).toHaveBeenCalledTimes(1);
  });

  it("forwards mobile draw calls to the renderer API", () => {
    const api = {
      drawMobileAudioReactiveParticle: vi.fn()
    } as unknown as NonNullable<Parameters<NonNullable<typeof audioReactiveParticleTransition.drawMobile>>[0]>;

    audioReactiveParticleTransition.drawMobile?.(
      api,
      {} as Parameters<NonNullable<typeof audioReactiveParticleTransition.drawMobile>>[1]
    );

    expect(api.drawMobileAudioReactiveParticle).toHaveBeenCalledTimes(1);
  });
});
