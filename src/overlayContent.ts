export type OverlayMode = "start" | "status" | "end";

export interface OverlayPresentation {
  kicker: string;
  title: string;
  echo: string;
  subtitle: string;
  startLabel: string;
  shareLabel: string;
  restartLabel: string;
  doodleLabel: string;
  effectIdeaLabel: string;
  showActions: boolean;
  showStart: boolean;
  showShare: boolean;
  showRestart: boolean;
  showDoodle: boolean;
  showEffectIdea: boolean;
}

const OVERLAY_PRESENTATIONS: Record<OverlayMode, OverlayPresentation> = {
  start: {
    kicker: "browser invitro // everything is computed",
    title: "Enter the signal",
    echo: "real-time. no playback.",
    subtitle: "audio active\nclick anywhere or press start",
    startLabel: "Execute",
    shareLabel: "Spread the signal",
    restartLabel: "Restart demo",
    doodleLabel: "Add a doodle",
    effectIdeaLabel: "Got an effect idea? Make it real!",
    showActions: true,
    showStart: true,
    showShare: true,
    showRestart: false,
    showDoodle: false,
    showEffectIdea: false
  },
  status: {
    kicker: "system status",
    title: "Loading",
    echo: "",
    subtitle: "Please wait while the next sequence locks in.",
    startLabel: "Start demo",
    shareLabel: "Spread the signal",
    restartLabel: "Restart demo",
    doodleLabel: "Add a doodle",
    effectIdeaLabel: "Got an effect idea? Make it real!",
    showActions: false,
    showStart: false,
    showShare: false,
    showRestart: false,
    showDoodle: false,
    showEffectIdea: false
  },
  end: {
    kicker: "signal complete",
    title: "The end",
    echo: "",
    subtitle: "Replay it, tag the crew, or leave a doodle for the wall.",
    startLabel: "Start demo",
    shareLabel: "Spread the signal",
    restartLabel: "Restart demo",
    doodleLabel: "Add a doodle",
    effectIdeaLabel: "Got an effect idea? Make it real!",
    showActions: true,
    showStart: false,
    showShare: true,
    showRestart: true,
    showDoodle: true,
    showEffectIdea: true
  }
};

export function getOverlayPresentation(mode: OverlayMode): OverlayPresentation {
  return OVERLAY_PRESENTATIONS[mode];
}
