import "./style.css";
import { buildModerationActionUrl, fetchPendingDoodle } from "./doodles";

export type ReviewPageParams = {
  id: string | null;
  token: string | null;
};

export function getReviewPageParams(search: string): ReviewPageParams {
  const params = new URLSearchParams(search);
  return {
    id: params.get("id"),
    token: params.get("token")
  };
}

export function formatReviewTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

const reviewImage = typeof document !== "undefined" ? document.querySelector<HTMLImageElement>("#review-image") : null;
const reviewPlaceholder = typeof document !== "undefined" ? document.querySelector<HTMLDivElement>("#review-placeholder") : null;
const reviewCopy = typeof document !== "undefined" ? document.querySelector<HTMLParagraphElement>("#review-copy") : null;
const reviewMeta = typeof document !== "undefined" ? document.querySelector<HTMLParagraphElement>("#review-meta") : null;
const reviewStatus = typeof document !== "undefined" ? document.querySelector<HTMLDivElement>("#review-status") : null;
const approveLink = typeof document !== "undefined" ? document.querySelector<HTMLAnchorElement>("#review-approve") : null;
const denyLink = typeof document !== "undefined" ? document.querySelector<HTMLAnchorElement>("#review-deny") : null;

function setStatus(message: string, state: "idle" | "error" | "success" = "idle"): void {
  if (!reviewStatus) {
    return;
  }
  reviewStatus.textContent = message;
  reviewStatus.dataset.state = state;
}

function setActionState(enabled: boolean, id: string | null, token: string | null): void {
  const links = [
    { element: approveLink, action: "approve" as const },
    { element: denyLink, action: "reject" as const }
  ];

  for (const { element, action } of links) {
    if (!element) {
      continue;
    }

    if (enabled && id && token) {
      element.href = buildModerationActionUrl(action, id, token);
      element.classList.remove("disabled");
      element.setAttribute("aria-disabled", "false");
    } else {
      element.href = "#";
      element.classList.add("disabled");
      element.setAttribute("aria-disabled", "true");
    }
  }
}

async function initReviewPage(): Promise<void> {
  const { id, token } = getReviewPageParams(window.location.search);
  if (!id || !token) {
    setStatus("This review link is missing the doodle id or moderation token.", "error");
    if (reviewPlaceholder) {
      reviewPlaceholder.textContent = "Review link incomplete.";
    }
    if (reviewCopy) {
      reviewCopy.textContent = "Please reopen the doodle review page from a fresh moderation notification.";
    }
    setActionState(false, null, null);
    return;
  }

  try {
    const { doodle } = await fetchPendingDoodle(id, token);
    if (!doodle) {
      throw new Error("missing");
    }

    if (reviewImage) {
      reviewImage.src = doodle.imageData;
      reviewImage.classList.remove("hidden");
    }
    if (reviewPlaceholder) {
      reviewPlaceholder.classList.add("hidden");
    }
    if (reviewMeta) {
      reviewMeta.textContent = `Submitted ${formatReviewTimestamp(doodle.createdAt)}.`;
      reviewMeta.classList.remove("hidden");
    }
    if (reviewCopy) {
      reviewCopy.textContent = "Review the doodle here before choosing approve or deny.";
    }
    setStatus("Ready for moderation.", "success");
    setActionState(true, doodle.id, token);
  } catch {
    setStatus("This doodle is no longer waiting for review, or the link has expired.", "error");
    if (reviewPlaceholder) {
      reviewPlaceholder.textContent = "Doodle unavailable.";
    }
    if (reviewCopy) {
      reviewCopy.textContent = "If someone already approved or denied it, this review page will stop loading the doodle.";
    }
    setActionState(false, null, null);
  }
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  void initReviewPage();
}
