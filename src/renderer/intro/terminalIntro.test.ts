import { describe, expect, it } from "vitest";

import { getTypingReveal } from "./terminalIntro";

describe("getTypingReveal", () => {
  it("reveals characters based on cps and elapsed time", () => {
    expect(getTypingReveal("hello", 10, 0)).toBe(0);
    expect(getTypingReveal("hello", 10, 0.2)).toBe(2);
    expect(getTypingReveal("hello", 10, 0.5)).toBe(5);
  });

  it("clamps reveal length to the text length", () => {
    expect(getTypingReveal("hi", 10, 1)).toBe(2);
  });

  it("returns zero when cps or elapsed time are non-positive", () => {
    expect(getTypingReveal("hello", 0, 1)).toBe(0);
    expect(getTypingReveal("hello", 10, -0.1)).toBe(0);
  });
});
