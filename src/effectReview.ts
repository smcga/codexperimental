import "./style.css";

import { buildEffectModerationActionUrl, compileRuntimeEffect, fetchPendingEffect, fetchPendingEffects } from "./effectIdeas";
import { EFFECT_PREVIEW_AUDIO_SRC, EffectPreviewAudioController } from "./effectPreviewAudio";

export type EffectReviewPageParams = {
  id: string | null;
  token: string | null;
};

export function getEffectReviewPageParams(search: string): EffectReviewPageParams {
  const params = new URLSearchParams(search);
  return {
    id: params.get("id"),
    token: params.get("token")
  };
}

export function formatEffectReviewTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function getEffectReviewPreviewUnavailableMessage(): string {
  return "Preview unavailable for this effect, but you can still approve or deny it.";
}


const previewCanvas = typeof document !== "undefined" ? document.querySelector<HTMLCanvasElement>("#effect-review-preview") : null;
const previewContext = previewCanvas?.getContext("2d") ?? null;
const reviewCopy = typeof document !== "undefined" ? document.querySelector<HTMLParagraphElement>("#effect-review-copy") : null;
const reviewMeta = typeof document !== "undefined" ? document.querySelector<HTMLParagraphElement>("#effect-review-meta") : null;
const reviewStatus = typeof document !== "undefined" ? document.querySelector<HTMLDivElement>("#effect-review-status") : null;
const reviewTypescript = typeof document !== "undefined" ? document.querySelector<HTMLPreElement>("#effect-review-typescript") : null;
const reviewRuntime = typeof document !== "undefined" ? document.querySelector<HTMLPreElement>("#effect-review-runtime") : null;
const approveLink = typeof document !== "undefined" ? document.querySelector<HTMLAnchorElement>("#effect-review-approve") : null;
const denyLink = typeof document !== "undefined" ? document.querySelector<HTMLAnchorElement>("#effect-review-deny") : null;
const nextEffectLink = typeof document !== "undefined" ? document.querySelector<HTMLAnchorElement>("#effect-review-next") : null;
const timelineCounter = typeof document !== "undefined" ? document.querySelector<HTMLSpanElement>("#effect-review-timeline") : null;
const timelineDuration = typeof document !== "undefined" ? document.querySelector<HTMLSpanElement>("#effect-review-timeline-duration") : null;

let previewFrame = 0;
let activeEffect: ReturnType<typeof compileRuntimeEffect> | null = null;
const previewAudio = new EffectPreviewAudioController(EFFECT_PREVIEW_AUDIO_SRC);
const FAKE_TIMELINE_DURATION_SECONDS = 230;

function formatTimelineCounter(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const wholeSeconds = Math.floor(safeSeconds % 60);
  const milliseconds = Math.floor((safeSeconds % 1) * 1000);
  return `${minutes.toString().padStart(2, "0")}:${wholeSeconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
}

function setTimelineCounter(playbackTime: number): void {
  if (!timelineCounter) {
    return;
  }
  const loopedPlayback = playbackTime % FAKE_TIMELINE_DURATION_SECONDS;
  timelineCounter.textContent = formatTimelineCounter(loopedPlayback);
  if (timelineDuration) {
    timelineDuration.textContent = formatTimelineCounter(FAKE_TIMELINE_DURATION_SECONDS);
  }
}

function setStatus(message: string, state: "idle" | "error" | "success" = "idle"): void {
  if (!reviewStatus) {
    return;
  }
  reviewStatus.textContent = message;
  reviewStatus.dataset.state = state;
}

export type EffectReviewActionState = {
  action: "approve" | "reject";
  href: string;
  disabled: boolean;
};

export function getEffectReviewActionStates(enabled: boolean, id: string | null, token: string | null): EffectReviewActionState[] {
  const actions: Array<"approve" | "reject"> = ["approve", "reject"];
  return actions.map((action) => {
    if (enabled && id && token) {
      return {
        action,
        href: buildEffectModerationActionUrl(action, id, token),
        disabled: false
      };
    }
    return {
      action,
      href: "#",
      disabled: true
    };
  });
}

function setActionState(enabled: boolean, id: string | null, token: string | null): void {
  const states = getEffectReviewActionStates(enabled, id, token);
  const links = new Map(states.map((state) => [state.action, state]));
  const elements = [
    { element: approveLink, action: "approve" as const },
    { element: denyLink, action: "reject" as const }
  ];

  for (const { element, action } of elements) {
    if (!element) {
      continue;
    }

    const state = links.get(action);
    if (!state) {
      continue;
    }
    element.href = state.href;
    element.classList.toggle("disabled", state.disabled);
    element.setAttribute("aria-disabled", state.disabled ? "true" : "false");
  }
}

function stopPreview(): void {
  if (previewFrame) {
    cancelAnimationFrame(previewFrame);
    previewFrame = 0;
  }
  previewAudio.stop();
}

function startPreview(): void {
  if (!previewCanvas || !previewContext || !activeEffect) {
    return;
  }

  setTimelineCounter(0);
  const draw = (): void => {
    if (!previewCanvas || !previewContext || !activeEffect) {
      return;
    }
    const playbackTime = previewAudio.getPlaybackTime();
    setTimelineCounter(playbackTime);
    activeEffect.render({
      ctx: previewContext,
      width: previewCanvas.width,
      height: previewCanvas.height,
      time: playbackTime,
      delta: 1 / 60,
      audio: previewAudio.getFeatures(),
      params: {}
    });
    previewFrame = requestAnimationFrame(draw);
  };

  stopPreview();
  void previewAudio.start();
  draw();
}

export function getNextPendingEffectId(
  pendingEffects: Array<{ id: string }>,
  currentEffectId: string,
  action: "approve" | "reject"
): string | null {
  if (pendingEffects.length === 0) {
    return null;
  }
  if (action === "reject") {
    return pendingEffects[0]?.id ?? null;
  }
  const currentIndex = pendingEffects.findIndex((entry) => entry.id === currentEffectId);
  if (currentIndex >= 0) {
    const nextAfterCurrent = pendingEffects[currentIndex + 1];
    if (nextAfterCurrent) {
      return nextAfterCurrent.id;
    }
  }
  const fallback = pendingEffects.find((entry) => entry.id !== currentEffectId);
  return fallback?.id ?? null;
}

async function handleModerationAction(action: "approve" | "reject", id: string, token: string): Promise<void> {
  const actionUrl = buildEffectModerationActionUrl(action, id, token);
  setStatus(action === "approve" ? "Approving effect…" : "Denying effect…");
  setActionState(false, null, null);

  try {
    const response = await fetch(actionUrl, {
      method: "GET",
      headers: { Accept: "text/html" }
    });
    if (!response.ok) {
      throw new Error(`Moderation action failed with status ${response.status}`);
    }
    const pendingEffects = await fetchPendingEffects(token);
    const nextId = getNextPendingEffectId(pendingEffects, id, action);
    if (nextEffectLink) {
      if (nextId) {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("id", nextId);
        nextUrl.searchParams.set("token", token);
        nextEffectLink.href = nextUrl.toString();
        nextEffectLink.classList.remove("hidden");
      } else {
        nextEffectLink.classList.add("hidden");
      }
    }
    setStatus(
      nextId
        ? `Effect ${action === "approve" ? "approved" : "denied"}. More pending effects are waiting.`
        : `Effect ${action === "approve" ? "approved" : "denied"}. Queue complete.`,
      "success"
    );
  } catch {
    setStatus("Could not submit moderation decision. Please try again.", "error");
    setActionState(true, id, token);
  }
}

function bindModerationButtons(id: string, token: string): void {
  const entries = [
    { element: approveLink, action: "approve" as const },
    { element: denyLink, action: "reject" as const }
  ];
  for (const entry of entries) {
    if (!entry.element) {
      continue;
    }
    entry.element.addEventListener("click", (event) => {
      event.preventDefault();
      void handleModerationAction(entry.action, id, token);
    });
  }
}

async function initEffectReviewPage(): Promise<void> {
  const { id, token } = getEffectReviewPageParams(window.location.search);
  if (!id || !token) {
    setStatus("This review link is missing the effect id or moderation token.", "error");
    if (reviewCopy) {
      reviewCopy.textContent = "Please reopen the effect review page from a fresh moderation notification.";
    }
    if (reviewTypescript) {
      reviewTypescript.textContent = "Review link incomplete.";
    }
    if (reviewRuntime) {
      reviewRuntime.textContent = "Review link incomplete.";
    }
    setActionState(false, null, null);
    return;
  }

  try {
    const { effect } = await fetchPendingEffect(id, token);
    if (!effect) {
      throw new Error("missing");
    }

    if (reviewTypescript) {
      reviewTypescript.textContent = effect.typescriptCode;
    }
    if (reviewRuntime) {
      reviewRuntime.textContent = effect.runtimeCode;
    }
    if (reviewMeta) {
      reviewMeta.textContent = `Submitted ${formatEffectReviewTimestamp(effect.createdAt)} · ${effect.name}`;
      reviewMeta.classList.remove("hidden");
    }

    setActionState(true, effect.id, token);
    bindModerationButtons(effect.id, token);

    try {
      activeEffect = compileRuntimeEffect(effect.runtimeCode);
      startPreview();
      setStatus("Ready for moderation.", "success");
    } catch {
      activeEffect = null;
      stopPreview();
      setStatus(getEffectReviewPreviewUnavailableMessage(), "error");
      if (reviewCopy) {
        reviewCopy.textContent = "This effect could not be previewed, but moderation actions are still available.";
      }
      if (previewContext && previewCanvas) {
        previewContext.fillStyle = "#040812";
        previewContext.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewContext.fillStyle = "rgba(232, 247, 255, 0.75)";
        previewContext.font = "28px monospace";
        previewContext.textAlign = "center";
        previewContext.fillText("Preview unavailable", previewCanvas.width / 2, previewCanvas.height / 2);
      }
    }
  } catch {
    setStatus("This effect is no longer waiting for review, or the link has expired.", "error");
    if (reviewCopy) {
      reviewCopy.textContent = "If someone already approved or denied it, this review page will stop loading that effect.";
    }
    if (reviewTypescript) {
      reviewTypescript.textContent = "Effect unavailable.";
    }
    if (reviewRuntime) {
      reviewRuntime.textContent = "Effect unavailable.";
    }
    if (previewContext && previewCanvas) {
      previewContext.fillStyle = "#040812";
      previewContext.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
      previewContext.fillStyle = "rgba(232, 247, 255, 0.75)";
      previewContext.font = "28px monospace";
      previewContext.textAlign = "center";
      previewContext.fillText("Preview unavailable", previewCanvas.width / 2, previewCanvas.height / 2);
    }
    setActionState(false, null, null);
  }
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  window.addEventListener("beforeunload", () => {
    stopPreview();
    previewAudio.destroy();
  });
  void initEffectReviewPage();
}
