const TITLE_SPINNER = ["⠋", "⠙", "⠸", "⣠", "⣄", "⡆", "⠇", "⠏"] as const;
const TITLE_DIVIDERS = ["⌁", "⟢", "⟣", "⟡"] as const;
const SUBSCRIPT_DIGITS = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"] as const;
const TITLE_TICK_MS = 240;
const TITLE_BASE = "ＤＥＭＯＳＣＥＮＥ";

function toSubscriptNumber(value: number): string {
  return value
    .toString()
    .split("")
    .map((digit) => SUBSCRIPT_DIGITS[Number(digit)] ?? digit)
    .join("");
}

export function formatSubscriptClock(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60) % 100;
  const seconds = safeSeconds % 60;
  const minuteText = toSubscriptNumber(minutes).padStart(2, SUBSCRIPT_DIGITS[0]);
  const secondText = toSubscriptNumber(seconds).padStart(2, SUBSCRIPT_DIGITS[0]);
  return `${minuteText}:${secondText}`;
}

export function getAnimatedTitle(frame: number, elapsedMs: number): string {
  const frameIndex = Math.max(0, Math.floor(frame));
  const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const spinner = TITLE_SPINNER[frameIndex % TITLE_SPINNER.length];
  const divider = TITLE_DIVIDERS[frameIndex % TITLE_DIVIDERS.length];
  const binaryCounter = (elapsedSeconds % 256).toString(2).padStart(8, "0");
  return `${spinner} ${divider}${TITLE_BASE}${divider} ${formatSubscriptClock(elapsedSeconds)} · ${binaryCounter}`;
}

export function installAnimatedTitle(
  doc: Pick<Document, "hidden" | "title" | "addEventListener" | "removeEventListener">,
  now: () => number = () => performance.now()
): () => void {
  const startMs = now();
  let frame = 0;

  const update = () => {
    doc.title = getAnimatedTitle(frame, now() - startMs);
    frame += 1;
  };

  update();
  const timer = window.setInterval(() => {
    if (!doc.hidden) {
      update();
    }
  }, TITLE_TICK_MS);

  const onVisibilityChange = () => {
    if (!doc.hidden) {
      update();
    }
  };
  doc.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    window.clearInterval(timer);
    doc.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
