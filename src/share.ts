export type ShareLinkPlatform = "linkedin" | "x" | "facebook" | "reddit" | "email";

export interface SharePayload {
  title: string;
  text: string;
  url: string;
}

const DEMO_SHARE_TITLE = "Demoscene AI 2022";
const DEMO_SHARE_TEXT = "Take a quick trip through a browser demoscene showcase and share it with your crew.";

export function buildSharePayload(url: string): SharePayload {
  return {
    title: DEMO_SHARE_TITLE,
    text: DEMO_SHARE_TEXT,
    url
  };
}

export function getShareLink(platform: ShareLinkPlatform, payload: SharePayload): string {
  const encodedUrl = encodeURIComponent(payload.url);
  const encodedTitle = encodeURIComponent(payload.title);
  const encodedText = encodeURIComponent(payload.text);
  const combinedText = encodeURIComponent(`${payload.text} ${payload.url}`);

  switch (platform) {
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "reddit":
      return `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
    case "email":
      return `mailto:?subject=${encodedTitle}&body=${combinedText}`;
  }
}

export function canUseNativeShare(shareFn: Navigator["share"] | undefined): shareFn is Navigator["share"] {
  return typeof shareFn === "function";
}
