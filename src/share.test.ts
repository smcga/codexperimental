import { describe, expect, it } from "vitest";

import { buildSharePayload, canUseNativeShare, getShareLink } from "./share";

describe("buildSharePayload", () => {
  it("returns the demo share copy with the provided URL", () => {
    expect(buildSharePayload("https://demo.example.com/?release=1")).toEqual({
      title: "Demoscene AI 2022",
      text: "Take a quick trip through a browser demoscene showcase and share it with your crew.",
      url: "https://demo.example.com/?release=1"
    });
  });
});

describe("getShareLink", () => {
  const payload = buildSharePayload("https://demo.example.com/watch?v=1");

  it("builds a LinkedIn share URL", () => {
    expect(getShareLink("linkedin", payload)).toBe(
      "https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fdemo.example.com%2Fwatch%3Fv%3D1"
    );
  });

  it("builds an X share URL", () => {
    expect(getShareLink("x", payload)).toContain("twitter.com/intent/tweet");
    expect(getShareLink("x", payload)).toContain("url=https%3A%2F%2Fdemo.example.com%2Fwatch%3Fv%3D1");
  });

  it("builds a Facebook share URL", () => {
    expect(getShareLink("facebook", payload)).toBe(
      "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fdemo.example.com%2Fwatch%3Fv%3D1"
    );
  });

  it("builds a Reddit share URL", () => {
    expect(getShareLink("reddit", payload)).toContain("reddit.com/submit");
    expect(getShareLink("reddit", payload)).toContain("title=Demoscene%20AI%202022");
  });

  it("builds a mailto share URL", () => {
    expect(getShareLink("email", payload)).toContain("mailto:?");
    expect(getShareLink("email", payload)).toContain("subject=Demoscene%20AI%202022");
    expect(getShareLink("email", payload)).toContain("https%3A%2F%2Fdemo.example.com%2Fwatch%3Fv%3D1");
  });
});

describe("canUseNativeShare", () => {
  it("returns true only when a share function exists", () => {
    expect(canUseNativeShare(async () => {})).toBe(true);
    expect(canUseNativeShare(undefined)).toBe(false);
  });
});
