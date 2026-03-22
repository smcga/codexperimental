import { describe, expect, it } from "vitest";

import { buildTransitionOptionMarkup, transitionDefinitions, transitionKeys, transitionOptions, transitionRegistry } from "./index";

describe("transition registry", () => {
  it("keeps the exported keys, labels, and registry entries in sync", () => {
    expect(transitionKeys).toEqual(transitionDefinitions.map((definition) => definition.key));
    expect(transitionOptions).toEqual(
      transitionDefinitions.map((definition) => ({
        value: definition.key,
        label: definition.label
      }))
    );
    expect(transitionRegistry["bitplane-wipe"].label).toBe("Bitplane Wipe");
    expect(transitionRegistry["camera-punch-through"].drawMobile).toBeTypeOf("function");
  });

  it("builds debug select markup from the registry with an optional auto entry", () => {
    expect(buildTransitionOptionMarkup()).toContain('<option value="bitplane-wipe">Bitplane Wipe</option>');
    expect(buildTransitionOptionMarkup({ includeAuto: true })).toContain('<option value="auto">Auto</option>');
  });
});
