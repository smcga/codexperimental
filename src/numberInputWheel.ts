const parseOptionalNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
};

const clampNumber = (value: number, min: number | null, max: number | null): number => {
  const lowerBound = min ?? Number.NEGATIVE_INFINITY;
  const upperBound = max ?? Number.POSITIVE_INFINITY;
  return Math.min(upperBound, Math.max(lowerBound, value));
};

export const getWheelSteppedNumberValue = (
  input: Pick<HTMLInputElement, "value" | "min" | "max" | "step">,
  deltaY: number
): number | null => {
  const current = parseOptionalNumber(input.value) ?? 0;
  const min = parseOptionalNumber(input.min);
  const max = parseOptionalNumber(input.max);
  const parsedStep = parseOptionalNumber(input.step);
  const step = parsedStep !== null && parsedStep > 0 ? parsedStep : 1;
  const clampedCurrent = clampNumber(current, min, max);
  if (!Number.isFinite(deltaY) || deltaY === 0) {
    return clampedCurrent;
  }
  const direction = deltaY < 0 ? 1 : -1;
  return clampNumber(clampedCurrent + direction * step, min, max);
};

export const installGlobalNumberInputWheelGuard = (doc: Document = document): void => {
  doc.addEventListener(
    "wheel",
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.type !== "number") {
        return;
      }
      if (doc.activeElement !== target) {
        return;
      }
      event.preventDefault();
      const nextValue = getWheelSteppedNumberValue(target, event.deltaY);
      if (nextValue === null) {
        return;
      }
      target.value = String(nextValue);
      target.dispatchEvent(new Event("input", { bubbles: true }));
    },
    { passive: false, capture: true }
  );
};
