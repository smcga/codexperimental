import { RawTextCue, TextCue } from "../../config/loadConfig";
import { ContentRect, screenToContentNorm } from "../../renderer/letterbox";
import { formatTimestamp } from "../time";

const PRECISION = 3;

type CueEditorState = {
  time: number;
  activeCues: TextCue[];
};

export type TextCueEditorController = {
  update: (state: CueEditorState) => void;
  setEnabled: (enabled: boolean) => void;
  getSelectedCue: () => TextCue | null;
  getExportJson: () => string;
  handleCanvasPick: (canvasX: number, canvasY: number, contentRect: ContentRect) => void;
  isPickMode: () => boolean;
};

export function createTextCueEditor(container: HTMLElement, cues: TextCue[]): TextCueEditorController {
  const activeSelect = container.querySelector<HTMLSelectElement>("#debug-text-active");
  const allSelect = container.querySelector<HTMLSelectElement>("#debug-text-all");
  const xInput = container.querySelector<HTMLInputElement>("#debug-text-x");
  const yInput = container.querySelector<HTMLInputElement>("#debug-text-y");
  const sizeInput = container.querySelector<HTMLInputElement>("#debug-text-size");
  const alignSelect = container.querySelector<HTMLSelectElement>("#debug-text-align");
  const colorInput = container.querySelector<HTMLInputElement>("#debug-text-color");
  const startLabel = container.querySelector<HTMLSpanElement>("#debug-text-start");
  const endLabel = container.querySelector<HTMLSpanElement>("#debug-text-end");
  const unitsLabel = container.querySelector<HTMLSpanElement>("#debug-text-units");
  const pickButton = container.querySelector<HTMLButtonElement>("#debug-text-pick");
  const resetButton = container.querySelector<HTMLButtonElement>("#debug-text-reset");
  const copyButton = container.querySelector<HTMLButtonElement>("#debug-text-copy");
  const exportArea = container.querySelector<HTMLTextAreaElement>("#debug-text-export");
  const nudgeButtons = Array.from(container.querySelectorAll<HTMLButtonElement>("[data-nudge-axis]"));

  if (
    !activeSelect ||
    !allSelect ||
    !xInput ||
    !yInput ||
    !sizeInput ||
    !alignSelect ||
    !colorInput ||
    !startLabel ||
    !endLabel ||
    !unitsLabel ||
    !pickButton ||
    !resetButton ||
    !copyButton ||
    !exportArea
  ) {
    throw new Error("Missing text cue editor elements");
  }

  const originalCues = new Map<string, TextCue>();
  cues.forEach((cue) => {
    originalCues.set(cue.id, JSON.parse(JSON.stringify(cue)) as TextCue);
  });

  let selectedId = cues[0]?.id ?? "";
  let isPicking = false;

  const setPickMode = (value: boolean) => {
    isPicking = value;
    pickButton.classList.toggle("active", isPicking);
    pickButton.textContent = isPicking ? "Tap canvas…" : "Pick from canvas";
  };

  const getSelectedCue = (): TextCue | null => cues.find((cue) => cue.id === selectedId) ?? null;

  const updateUnitsLabel = (cue: TextCue) => {
    unitsLabel.textContent = cue.units === "px" ? "px" : "norm";
  };

  const updateInputsFromCue = (cue: TextCue) => {
    const xValue = cue.units === "px" ? cue.x : clampUnit(cue.x);
    const yValue = cue.units === "px" ? cue.y : clampUnit(cue.y);
    xInput.value = xValue.toFixed(PRECISION);
    yInput.value = yValue.toFixed(PRECISION);
    sizeInput.value = cue.size.toFixed(1);
    alignSelect.value = cue.align;
    colorInput.value = normalizeColor(cue.color);
    startLabel.textContent = formatTimestamp(cue.start);
    endLabel.textContent = formatTimestamp(cue.end);
    updateUnitsLabel(cue);
  };

  const setSelectedCue = (id: string) => {
    selectedId = id;
    const cue = getSelectedCue();
    if (!cue) {
      return;
    }
    updateInputsFromCue(cue);
    syncSelects();
    updateExportArea();
  };

  const syncSelects = () => {
    allSelect.value = selectedId;
    if (Array.from(activeSelect.options).some((option) => option.value === selectedId)) {
      activeSelect.value = selectedId;
    }
  };

  const updateExportArea = () => {
    exportArea.value = getExportJson();
  };

  const updateCueValue = (field: keyof TextCue, value: number | string) => {
    const cue = getSelectedCue();
    if (!cue) {
      return;
    }
    if (field === "x" || field === "y") {
      const numeric = typeof value === "number" ? value : Number(value);
      cue[field] = cue.units === "px" ? Math.max(0, numeric) : clampUnit(numeric);
    } else if (field === "size") {
      cue.size = Math.max(1, Number(value));
    } else if (field === "align") {
      cue.align = value as TextCue["align"];
    } else if (field === "color") {
      cue.color = String(value);
    }
    updateInputsFromCue(cue);
    updateExportArea();
  };

  const rebuildAllCues = () => {
    allSelect.innerHTML = "";
    cues.forEach((cue) => {
      const option = document.createElement("option");
      option.value = cue.id;
      option.textContent = `${cue.id} (${formatTimestamp(cue.start)})`;
      allSelect.appendChild(option);
    });
    if (selectedId) {
      allSelect.value = selectedId;
    }
  };

  rebuildAllCues();
  if (selectedId) {
    setSelectedCue(selectedId);
  }

  activeSelect.addEventListener("change", () => {
    if (activeSelect.value) {
      setSelectedCue(activeSelect.value);
    }
  });

  allSelect.addEventListener("change", () => {
    if (allSelect.value) {
      setSelectedCue(allSelect.value);
    }
  });

  xInput.addEventListener("input", () => updateCueValue("x", xInput.value));
  yInput.addEventListener("input", () => updateCueValue("y", yInput.value));
  sizeInput.addEventListener("input", () => updateCueValue("size", sizeInput.value));
  alignSelect.addEventListener("change", () => updateCueValue("align", alignSelect.value));
  colorInput.addEventListener("input", () => updateCueValue("color", colorInput.value));

  nudgeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const axis = button.dataset.nudgeAxis as "x" | "y" | undefined;
      const step = Number(button.dataset.nudgeStep ?? 0);
      if (!axis || !Number.isFinite(step) || step === 0) {
        return;
      }
      const cue = getSelectedCue();
      if (!cue) {
        return;
      }
      const nextValue = cue[axis] + step;
      updateCueValue(axis, nextValue);
    });
  });

  pickButton.addEventListener("click", () => {
    setPickMode(!isPicking);
  });

  resetButton.addEventListener("click", () => {
    const cue = getSelectedCue();
    if (!cue) {
      return;
    }
    const original = originalCues.get(cue.id);
    if (!original) {
      return;
    }
    Object.assign(cue, JSON.parse(JSON.stringify(original)));
    updateInputsFromCue(cue);
    updateExportArea();
  });

  copyButton.addEventListener("click", async () => {
    const json = getExportJson();
    exportArea.value = json;
    try {
      await navigator.clipboard.writeText(json);
      copyButton.textContent = "Copied!";
      setTimeout(() => {
        copyButton.textContent = "Copy JSON";
      }, 1200);
    } catch (error) {
      copyButton.textContent = "Copy JSON";
    }
  });

  return {
    update: ({ time, activeCues }) => {
      activeSelect.innerHTML = "";
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = activeCues.length > 0 ? "Active cues…" : "No active cues";
      activeSelect.appendChild(placeholder);
      activeCues.forEach((cue) => {
        const option = document.createElement("option");
        option.value = cue.id;
        option.textContent = `${cue.id} (${formatTimestamp(cue.start)})`;
        activeSelect.appendChild(option);
      });
      if (selectedId && activeCues.some((cue) => cue.id === selectedId)) {
        activeSelect.value = selectedId;
      } else {
        activeSelect.value = "";
      }
      const cue = getSelectedCue();
      if (cue) {
        startLabel.textContent = formatTimestamp(cue.start);
        endLabel.textContent = formatTimestamp(cue.end);
      }
      exportArea.dataset.time = time.toFixed(2);
    },
    setEnabled: (enabled: boolean) => {
      container.classList.toggle("disabled", !enabled);
      [
        activeSelect,
        allSelect,
        xInput,
        yInput,
        sizeInput,
        alignSelect,
        colorInput,
        pickButton,
        resetButton,
        copyButton
      ].forEach((element) => {
        element.disabled = !enabled;
      });
      nudgeButtons.forEach((button) => {
        button.disabled = !enabled;
      });
    },
    getSelectedCue: () => getSelectedCue(),
    getExportJson: () => {
      const modified = cues
        .map((cue) => {
          const original = originalCues.get(cue.id);
          if (!original) {
            return null;
          }
          if (!isCueModified(cue, original)) {
            return null;
          }
          return serializeCue(cue);
        })
        .filter((cue): cue is RawTextCue => cue !== null);
      return JSON.stringify(modified, null, 2);
    },
    handleCanvasPick: (canvasX, canvasY, contentRect) => {
      if (!isPicking) {
        return;
      }
      const cue = getSelectedCue();
      if (!cue) {
        return;
      }
      const norm = screenToContentNorm(canvasX, canvasY, contentRect);
      if (!norm.inside) {
        return;
      }
      const baseWidth = contentRect.width / contentRect.scale;
      const baseHeight = contentRect.height / contentRect.scale;
      cue.x = cue.units === "px" ? norm.x * baseWidth : clampUnit(norm.x);
      cue.y = cue.units === "px" ? norm.y * baseHeight : clampUnit(norm.y);
      updateInputsFromCue(cue);
      updateExportArea();
      setPickMode(false);
    },
    isPickMode: () => isPicking
  };
}

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function normalizeColor(value: string): string {
  if (value.startsWith("#")) {
    return value;
  }
  return "#ffffff";
}

function isCueModified(cue: TextCue, original: TextCue): boolean {
  return (
    Math.abs(cue.x - original.x) > 0.0005 ||
    Math.abs(cue.y - original.y) > 0.0005 ||
    Math.abs(cue.size - original.size) > 0.01 ||
    cue.align !== original.align ||
    cue.color !== original.color ||
    cue.units !== original.units
  );
}

function serializeCue(cue: TextCue): RawTextCue {
  return {
    id: cue.id,
    start: cue.start,
    end: cue.end,
    text: cue.text,
    spans: cue.text ? undefined : cue.spans.map((span) => ({ ...span })),
    x: cue.x,
    y: cue.y,
    align: cue.align,
    size: cue.size,
    color: cue.color,
    units: cue.units === "px" ? "px" : undefined,
    effects: cue.effects
  };
}
