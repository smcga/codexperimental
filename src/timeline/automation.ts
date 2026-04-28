export type EaseName =
  | "linear"
  | "easeInOutQuad"
  | "easeInQuad"
  | "easeOutQuad"
  | "easeInOutCubic"
  | "easeInCubic"
  | "easeOutCubic"
  | "easeInOutQuart"
  | "easeInOutQuint"
  | "easeInSine"
  | "easeOutSine"
  | "easeInOutSine"
  | "easeInExpo"
  | "easeOutExpo"
  | "easeInOutExpo"
  | "easeInBack"
  | "easeOutBack"
  | "easeInOutBack"
  | "easeOutBounce"
  | "easeOutElastic"
  | "easeInOutCirc";

export type ParamAutomation = {
  param: string;
  from: number;
  to: number;
  t0: number;
  t1: number;
  ease?: EaseName;
  points?: Array<{ time: number; value: number }>;
  segmentMeta?: Array<{
    curveType?: "Linear" | "SingleCurve" | "DoubleCurve" | "Hold" | "Stairs" | "Smooth" | "Pulse" | "Wave";
    tension?: number;
  }>;
};

export const clamp01 = (value: number): number => (value < 0 ? 0 : value > 1 ? 1 : value);

export function easeFn(name: string | undefined, t: number): number {
  t = clamp01(t);
  let value: number;
  switch (name) {
    case "easeInQuad":
      value = t * t;
      break;
    case "easeOutQuad":
      value = 1 - (1 - t) * (1 - t);
      break;
    case "easeInOutQuad":
      value = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      break;
    case "easeInCubic":
      value = t * t * t;
      break;
    case "easeOutCubic":
      value = 1 - Math.pow(1 - t, 3);
      break;
    case "easeInOutCubic":
      value = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      break;
    case "easeInOutQuart":
      value = t < 0.5 ? 8 * Math.pow(t, 4) : 1 - Math.pow(-2 * t + 2, 4) / 2;
      break;
    case "easeInOutQuint":
      value = t < 0.5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2;
      break;
    case "easeInSine":
      value = 1 - Math.cos((t * Math.PI) / 2);
      break;
    case "easeOutSine":
      value = Math.sin((t * Math.PI) / 2);
      break;
    case "easeInOutSine":
      value = -(Math.cos(Math.PI * t) - 1) / 2;
      break;
    case "easeInExpo":
      value = t === 0 ? 0 : Math.pow(2, 10 * t - 10);
      break;
    case "easeOutExpo":
      value = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      break;
    case "easeInOutExpo":
      if (t === 0) {
        value = 0;
      } else if (t === 1) {
        value = 1;
      } else {
        value =
          t < 0.5
            ? Math.pow(2, 20 * t - 10) / 2
            : (2 - Math.pow(2, -20 * t + 10)) / 2;
      }
      break;
    case "easeInBack": {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      value = c3 * t * t * t - c1 * t * t;
      break;
    }
    case "easeOutBack": {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      value = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      break;
    }
    case "easeInOutBack": {
      const c1 = 1.70158;
      const c2 = c1 * 1.525;
      value =
        t < 0.5
          ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
          : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
      break;
    }
    case "easeOutBounce": {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) {
        value = n1 * t * t;
      } else if (t < 2 / d1) {
        const t2 = t - 1.5 / d1;
        value = n1 * t2 * t2 + 0.75;
      } else if (t < 2.5 / d1) {
        const t2 = t - 2.25 / d1;
        value = n1 * t2 * t2 + 0.9375;
      } else {
        const t2 = t - 2.625 / d1;
        value = n1 * t2 * t2 + 0.984375;
      }
      break;
    }
    case "easeOutElastic": {
      const c4 = (2 * Math.PI) / 3;
      if (t === 0) {
        value = 0;
      } else if (t === 1) {
        value = 1;
      } else {
        value = Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
      }
      break;
    }
    case "easeInOutCirc":
      value =
        t < 0.5
          ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
          : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
      break;
    case "linear":
    default:
      value = t;
      break;
  }
  return clamp01(value);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function resolvePointAutomationValue(now: number, automation: ParamAutomation): number | null {
  const points = automation.points;
  if (!points || points.length < 2) {
    return null;
  }
  const sorted = [...points].sort((a, b) => a.time - b.time);
  if (now <= sorted[0].time) {
    return sorted[0].value;
  }
  if (now >= sorted[sorted.length - 1].time) {
    return sorted[sorted.length - 1].value;
  }
  const segmentIndex = sorted.findIndex((_, index) => index < sorted.length - 1 && now >= sorted[index].time && now <= sorted[index + 1].time);
  if (segmentIndex < 0) {
    return sorted[0].value;
  }
  const left = sorted[segmentIndex];
  const right = sorted[segmentIndex + 1];
  const rawProgress = clamp01((now - left.time) / Math.max(1e-6, right.time - left.time));
  const curveType = automation.segmentMeta?.[segmentIndex]?.curveType ?? "Linear";
  const tension = clamp01(((automation.segmentMeta?.[segmentIndex]?.tension ?? 0) + 1) / 2);
  if (curveType === "Hold") {
    return left.value;
  }
  if (curveType === "Stairs") {
    const steps = Math.max(2, Math.round(2 + tension * 14));
    const snapped = Math.floor(rawProgress * steps) / steps;
    return lerp(left.value, right.value, snapped);
  }
  if (curveType === "Pulse" || curveType === "Wave") {
    const frequency = 1 + tension * 8;
    const oscillation = curveType === "Pulse" ? Math.sign(Math.sin(rawProgress * Math.PI * 2 * frequency)) : Math.sin(rawProgress * Math.PI * 2 * frequency);
    const base = lerp(left.value, right.value, rawProgress);
    return base + oscillation * 0.05 * Math.abs(right.value - left.value);
  }
  const easedProgress =
    curveType === "SingleCurve"
      ? Math.pow(rawProgress, 1 + tension * 3)
      : curveType === "DoubleCurve" || curveType === "Smooth"
        ? easeFn("easeInOutSine", rawProgress)
        : rawProgress;
  return lerp(left.value, right.value, easedProgress);
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
    const pointValue = resolvePointAutomationValue(now, automation);
    if (pointValue !== null) {
      value = pointValue;
    } else if (t0 === t1) {
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
