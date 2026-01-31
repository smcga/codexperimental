import { describe, expect, it } from "vitest";

import { getImagePulseState } from "./imagePulseEffect";

describe("ImagePulseEffect math helpers", () => {
  it("keeps the pulse scale above a reasonable minimum", () => {
    const state = getImagePulseState(2.4, { bass: 0, treble: 0, rms: 0, beatStrength: 0 }, {});

    expect(state.scale).toBeGreaterThan(0.6);
    expect(state.opacity).toBeGreaterThan(0.4);
  });

  it("responds to stronger audio with a brighter flare", () => {
    const calm = getImagePulseState(1.1, { bass: 0.1, treble: 0.1, rms: 0.1, beatStrength: 0 }, {});
    const intense = getImagePulseState(1.1, { bass: 0.8, treble: 0.9, rms: 0.8, beatStrength: 0.9 }, {});

    expect(intense.flare).toBeGreaterThan(calm.flare);
    expect(intense.scale).toBeGreaterThan(calm.scale);
  });
});
