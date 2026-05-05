export function isReleaseMode(params: URLSearchParams): boolean {
  return params.get("release") === "1";
}

export function shouldEnableCommunityFeatures(releaseMode: boolean): boolean {
  return !releaseMode;
}

export function shouldEnableViewCounter(releaseMode: boolean): boolean {
  return !releaseMode;
}

export function shouldShowShareUi(releaseMode: boolean): boolean {
  return !releaseMode;
}
