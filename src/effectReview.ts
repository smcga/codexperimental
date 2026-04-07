import "./style.css";

import { buildEffectModerationActionUrl, compileRuntimeEffect, fetchPendingEffect } from "./effectIdeas";
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


const previewCanvas = typeof document !== "undefined" ? document.querySelector<HTMLCanvasElement>("#effect-review-preview") : null;
const previewContext = previewCanvas?.getContext("2d") ?? null;
const reviewCopy = typeof document !== "undefined" ? document.querySelector<HTMLParagraphElement>("#effect-review-copy") : null;
const reviewMeta = typeof document !== "undefined" ? document.querySelector<HTMLParagraphElement>("#effect-review-meta") : null;
const reviewStatus = typeof document !== "undefined" ? document.querySelector<HTMLDivElement>("#effect-review-status") : null;
const reviewTypescript = typeof document !== "undefined" ? document.querySelector<HTMLPreElement>("#effect-review-typescript") : null;
const reviewRuntime = typeof document !== "undefined" ? document.querySelector<HTMLPreElement>("#effect-review-runtime") : null;
const approveLink = typeof document !== "undefined" ? document.querySelector<HTMLAnchorElement>("#effect-review-approve") : null;
const denyLink = typeof document !== "undefined" ? document.querySelector<HTMLAnchorElement>("#effect-review-deny") : null;

let previewFrame = 0;
let activeEffect: ReturnType<typeof compileRuntimeEffect> | null = null;
const previewAudio = new EffectPreviewAudioController(EFFECT_PREVIEW_AUDIO_SRC);

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

  const draw = (): void => {
    if (!previewCanvas || !previewContext || !activeEffect) {
      return;
    }
    activeEffect.render({
      ctx: previewContext,
      width: previewCanvas.width,
      height: previewCanvas.height,
      time: previewAudio.getPlaybackTime(),
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

    activeEffect = compileRuntimeEffect(effect.runtimeCode);
    startPreview();

    setActionState(true, effect.id, token);
    setStatus("Ready for moderation.", "success");
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
