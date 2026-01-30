import { describe, expect, it } from "vitest";

import { getTypedSubstring } from "./terminalIntro";

describe("getTypedSubstring", () => {
  it("returns the expected substring based on cps and elapsed time", () => {
    expect(getTypedSubstring("hello", 5, 0)).toBe("");
    expect(getTypedSubstring("hello", 5, 0.2)).toBe("h");
    expect(getTypedSubstring("hello", 5, 0.4)).toBe("he");
    expect(getTypedSubstring("hello", 5, 1.0)).toBe("hello");
  });
});
