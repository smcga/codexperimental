import { describe, expect, it } from "vitest";
import { isDebugMode } from "./runtimeMode";

describe("isDebugMode", () => {
  it("defaults to release mode when debug query param is missing", () => {
    expect(isDebugMode("")).toBe(false);
    expect(isDebugMode("?release=1")).toBe(false);
  });

  it("enables debug mode only when debug=1", () => {
    expect(isDebugMode("?debug=1")).toBe(true);
    expect(isDebugMode("?debug=0")).toBe(false);
    expect(isDebugMode("?debug=true")).toBe(false);
  });
});
