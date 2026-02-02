export type EaseName = "linear" | "easeInOutQuad";

export type ParamAutomation = {
  param: string;
  from: number;
  to: number;
  t0: number;
  t1: number;
  ease?: EaseName;
};

export function clamp01(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

export function easeFn(name: string | undefined, t: number): number {
  switch (name) {
    case "easeInOutQuad":
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    case "linear":
    default:
      return t;
  }
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function resolveAutomatedParams(
  now: number,
  baseParams: Record<string, number>,
  automations?: ParamAutomation[]
): Record<string, number> {
  const resolved = { ...baseParams };
  if (!automations || automations.length === 0) {
    return resolved;
  }

  automations.forEach((automation) => {
    if (!automation || typeof automation.param !== "string") {
      return;
    }
    const { param, from, to, t0, t1, ease } = automation;
    if (typeof from !== "number" || typeof to !== "number") {
      return;
    }
    let value: number;
    if (t0 === t1) {
      value = now < t0 ? from : to;
    } else if (now <= t0) {
      value = from;
    } else if (now >= t1) {
      value = to;
    } else {
      const progress = clamp01((now - t0) / (t1 - t0));
      const eased = easeFn(ease, progress);
      value = lerp(from, to, eased);
    }
    resolved[param] = value;
  });

  return resolved;
}
