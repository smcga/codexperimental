import { describe, expect, it } from "vitest";

import timeline from "../../public/timeline.json";
import releaseTimeline from "../../public/timeline.release.json";

type Automation = {
  param: string;
  from: number;
  to: number;
  t0: string;
  t1: string;
  ease: string;
};

type Section = {
  id: string;
  start: string;
  end: string;
  effect: string;
  params?: Record<string, unknown>;
  automation?: Automation[];
};

function expectWorldBuilderSection(section: Section | undefined): void {
  expect(section).toBeDefined();
  expect(section?.effect).toBe("voxel_world_builder");
  expect(section?.start).toBe("03:44.4");
  expect(section?.end).toBe("03:49.2");

  expect(section?.params).toMatchObject({
    buildProgress: 0,
    cityDensity: 0.62,
    glow: 0.85,
    cameraLift: 0.15,
  });

  expect(section?.automation).toEqual([
    {
      param: "buildProgress",
      from: 0,
      to: 1,
      t0: "03:44.4",
      t1: "03:49.2",
      ease: "inOutSine",
    },
    {
      param: "cameraLift",
      from: 0.05,
      to: 0.3,
      t0: "03:44.4",
      t1: "03:49.2",
      ease: "inOutSine",
    },
    {
      param: "glow",
      from: 0.65,
      to: 1.05,
      t0: "03:47.8",
      t1: "03:49.2",
      ease: "outQuad",
    },
  ]);
}

describe("voxel world builder timeline configuration", () => {
  it.each([
    ["public/timeline.json", timeline.sections as Section[]],
    ["public/timeline.release.json", releaseTimeline.sections as Section[]],
  ])("configures lyric world-build section in %s", (_path, sections) => {
    const section = sections.find((entry) => entry.id === "rap-punchline-stack-03450");
    expectWorldBuilderSection(section);
  });
});
