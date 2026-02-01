import { SectionConfig } from "../../config/loadConfig";
import { formatSeconds, formatTimestamp } from "../time";

type ScrubberCallbacks = {
  onSeek: (demoTime: number) => void;
  onTogglePlay: () => void;
  onNudge: (delta: number) => void;
  onSnap: (demoTime: number) => void;
};

type ScrubberState = {
  demoTime: number;
  audioTime: number;
  audioOffset: number;
  isPlaying: boolean;
  demoEndTime: number;
};

export type ScrubberController = {
  update: (state: ScrubberState) => void;
  setSections: (sections: SectionConfig[]) => void;
  setEnabled: (enabled: boolean) => void;
};

export function createScrubberController(
  container: HTMLElement,
  callbacks: ScrubberCallbacks
): ScrubberController {
  const demoTimeEl = container.querySelector<HTMLSpanElement>("#debug-demo-time");
  const audioTimeEl = container.querySelector<HTMLSpanElement>("#debug-audio-time");
  const audioOffsetEl = container.querySelector<HTMLSpanElement>("#debug-audio-offset");
  const playToggle = container.querySelector<HTMLButtonElement>("#debug-play-toggle");
  const seekSlider = container.querySelector<HTMLInputElement>("#debug-seek");
  const snapSelect = container.querySelector<HTMLSelectElement>("#debug-snap-section");
  const nudgeButtons = Array.from(container.querySelectorAll<HTMLButtonElement>("[data-nudge]"));

  if (!demoTimeEl || !audioTimeEl || !audioOffsetEl || !playToggle || !seekSlider || !snapSelect) {
    throw new Error("Missing scrubber elements");
  }

  let isDragging = false;
  let pendingSeek = 0;
  let pendingFrame = 0;

  const scheduleSeek = (value: number) => {
    pendingSeek = value;
    if (pendingFrame) {
      return;
    }
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = 0;
      callbacks.onSeek(pendingSeek);
    });
  };

  seekSlider.addEventListener("input", () => {
    isDragging = true;
    scheduleSeek(Number(seekSlider.value));
  });

  seekSlider.addEventListener("change", () => {
    isDragging = false;
    callbacks.onSeek(Number(seekSlider.value));
  });

  playToggle.addEventListener("click", () => {
    callbacks.onTogglePlay();
  });

  nudgeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const value = Number(button.dataset.nudge ?? 0);
      if (Number.isFinite(value) && value !== 0) {
        callbacks.onNudge(value);
      }
    });
  });

  snapSelect.addEventListener("change", () => {
    if (!snapSelect.value) {
      return;
    }
    const value = Number(snapSelect.value);
    if (Number.isFinite(value)) {
      callbacks.onSnap(value);
    }
  });

  return {
    update: ({ demoTime, audioTime, audioOffset, isPlaying, demoEndTime }) => {
      demoTimeEl.textContent = formatTimestamp(demoTime);
      audioTimeEl.textContent = formatSeconds(audioTime);
      audioOffsetEl.textContent = formatSeconds(audioOffset);
      playToggle.textContent = isPlaying ? "Pause" : "Play";
      seekSlider.max = demoEndTime.toFixed(2);
      seekSlider.step = "0.01";
      if (!isDragging) {
        seekSlider.value = demoTime.toFixed(2);
      }
    },
    setSections: (sections: SectionConfig[]) => {
      snapSelect.innerHTML = "";
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Snap…";
      snapSelect.appendChild(placeholder);
      sections.forEach((section, index) => {
        const option = document.createElement("option");
        option.value = section.start.toFixed(3);
        option.textContent = `${index + 1}: ${section.id} (${formatTimestamp(section.start)})`;
        snapSelect.appendChild(option);
      });
    },
    setEnabled: (enabled: boolean) => {
      container.classList.toggle("disabled", !enabled);
      seekSlider.disabled = !enabled;
      playToggle.disabled = !enabled;
      snapSelect.disabled = !enabled;
      nudgeButtons.forEach((button) => {
        button.disabled = !enabled;
      });
    }
  };
}
