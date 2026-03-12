export type SafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type DeviceProfile = {
  name: string;
  width: number;
  height: number;
  dpr: number;
  safeArea: SafeAreaInsets;
};

export const MOBILE_PREVIEW_PROFILES = {
  iPhone14: {
    name: "iPhone 14",
    width: 390,
    height: 844,
    dpr: 3,
    safeArea: { top: 47, bottom: 34, left: 0, right: 0 }
  },
  androidTall: {
    name: "Generic Android Tall",
    width: 412,
    height: 915,
    dpr: 2.5,
    safeArea: { top: 24, bottom: 24, left: 0, right: 0 }
  }
} as const satisfies Record<string, DeviceProfile>;

export const DEFAULT_MOBILE_PREVIEW_PROFILE: DeviceProfile = MOBILE_PREVIEW_PROFILES.iPhone14;

export function computeDeviceScale(
  availableWidth: number,
  availableHeight: number,
  profile: DeviceProfile,
  margin = 24
): number {
  const safeWidth = Math.max(1, availableWidth - margin * 2);
  const safeHeight = Math.max(1, availableHeight - margin * 2);
  return Math.max(0.1, Math.min(safeWidth / profile.width, safeHeight / profile.height));
}

export function getTouchDeviceState(isMobilePreview: boolean): boolean {
  const browserWindow = getBrowserWindow();
  return isMobilePreview || (browserWindow ? "ontouchstart" in browserWindow : false);
}


function getBrowserWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

export type MobilePreviewController = {
  enabled: boolean;
  profile: DeviceProfile;
  getViewportSize: () => { width: number; height: number };
  getSafeAreaInsets: () => SafeAreaInsets;
  getDpr: () => number;
  getFullscreenTarget: (fallback: HTMLElement) => HTMLElement;
  dispose: () => void;
};

export function createMobilePreviewController(options: {
  enabled: boolean;
  appRoot: HTMLElement;
  canvas: HTMLCanvasElement;
  overlay: HTMLElement;
  mobileControls: HTMLElement | null;
  profile?: DeviceProfile;
}): MobilePreviewController {
  const profile = options.profile ?? DEFAULT_MOBILE_PREVIEW_PROFILE;
  const browserWindow = getBrowserWindow();

  if (!options.enabled || !browserWindow) {
    return {
      enabled: false,
      profile,
      getViewportSize: () => ({ width: browserWindow?.innerWidth ?? profile.width, height: browserWindow?.innerHeight ?? profile.height }),
      getSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
      getDpr: () => browserWindow?.devicePixelRatio || 1,
      getFullscreenTarget: (fallback) => fallback,
      dispose: () => undefined
    };
  }

  options.appRoot.classList.add("mobile-preview-active");

  const frame = document.createElement("div");
  frame.className = "mobile-preview-frame";
  frame.setAttribute("aria-label", `${profile.name} preview`);

  const viewport = document.createElement("div");
  viewport.className = "mobile-preview-viewport";

  const childrenToMove: HTMLElement[] = [options.canvas, options.overlay];
  if (options.mobileControls) {
    childrenToMove.push(options.mobileControls);
  }

  options.appRoot.prepend(frame);
  frame.appendChild(viewport);
  childrenToMove.forEach((child) => viewport.appendChild(child));

  const resize = (): void => {
    frame.style.width = `${profile.width}px`;
    frame.style.height = `${profile.height}px`;
    viewport.style.paddingTop = `${profile.safeArea.top}px`;
    viewport.style.paddingBottom = `${profile.safeArea.bottom}px`;
    viewport.style.paddingLeft = `${profile.safeArea.left}px`;
    viewport.style.paddingRight = `${profile.safeArea.right}px`;
    const scale = computeDeviceScale(browserWindow.innerWidth, browserWindow.innerHeight, profile);
    const offsetX = (browserWindow.innerWidth - profile.width * scale) / 2;
    const offsetY = (browserWindow.innerHeight - profile.height * scale) / 2;
    frame.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  };

  resize();
  browserWindow.addEventListener("resize", resize);

  const originalTouch = Object.getOwnPropertyDescriptor(browserWindow, "ontouchstart");
  Object.defineProperty(browserWindow, "ontouchstart", {
    configurable: true,
    value: null
  });

  return {
    enabled: true,
    profile,
    getViewportSize: () => ({
      width: profile.width - profile.safeArea.left - profile.safeArea.right,
      height: profile.height - profile.safeArea.top - profile.safeArea.bottom
    }),
    getSafeAreaInsets: () => profile.safeArea,
    getDpr: () => profile.dpr,
    getFullscreenTarget: () => frame,
    dispose: () => {
      browserWindow.removeEventListener("resize", resize);
      childrenToMove.forEach((child) => options.appRoot.appendChild(child));
      frame.remove();
      options.appRoot.classList.remove("mobile-preview-active");
      if (originalTouch) {
        Object.defineProperty(browserWindow, "ontouchstart", originalTouch);
      } else {
        Reflect.deleteProperty(browserWindow, "ontouchstart");
      }
    }
  };
}
