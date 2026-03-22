import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { SineScrollerLogoEffect } from "../sineScrollerLogo";

export const sine_scroller_logoManifest = defineEffectManifest({
  key: "sine_scroller_logo",
  className: "SineScrollerLogoEffect",
  sourcePath: "src/renderer/effects/sineScrollerLogo.ts",
  createEffect: () => new SineScrollerLogoEffect(),
  debug: {
    title: "Sine Scroller Logo Controls",
    controls: [
      numberControl("audioReact", "Audio React", 0.72, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatBoost", "Beat Boost", 0.58, { min: 0, max: 1, step: 0.05 }),
      selectControl("message", "Message", "  CODEX CREW :: 68000 INSIDE :: STAY TUNED   ", [
        { label: "Default", value: "  CODEX CREW :: 68000 INSIDE :: STAY TUNED   " },
        { label: "ALT", value: "  OPENAI PRESENTS :: RETRO FUTURE :: GREETS!   " }
      ]),
      numberControl("fontSize", "Font Size", 42, { min: 8, max: 160, step: 1 }),
      numberControl("speed", "Speed", 140, { min: 0, max: 600, step: 1 }),
      numberControl("waveAmp", "Wave Amp", 24, { min: 0, max: 120, step: 1 }),
      numberControl("waveSpeed", "Wave Speed", 5.2, { min: 0, max: 20, step: 0.1 }),
      numberControl("wavePhaseStep", "Wave Phase Step", 0.32, { min: 0, max: 2, step: 0.01 }),
      numberControl("scrollerX", "Scroller X", 0),
      numberControl("scrollerY", "Scroller Y", 0),
      selectControl("logoText", "Logo Text", "SMCGA", [
        { label: "SMCGA", value: "SMCGA" },
        { label: "CODEX", value: "CODEX" }
      ]),
      numberControl("logoFontSize", "Logo Font Size", 86, { min: 8, max: 240, step: 1 }),
      numberControl("logoY", "Logo Y", 136, { min: 0, max: 600, step: 1 }),
      numberControl("scanlineStep", "Scanline Step", 2, { min: 1, max: 6, step: 1 }),
      numberControl("logoWaveAmp", "Logo Wave Amp", 7, { min: 0, max: 80, step: 1 }),
      numberControl("logoWaveSpeed", "Logo Wave Speed", 2.4, { min: 0, max: 20, step: 0.1 }),
      numberControl("logoWaveFreq", "Logo Wave Freq", 0.036, { min: 0, max: 1, step: 0.001 }),
      toggleControl("layer2", "Layer 2", true),
      numberControl("layer2FontSize", "Layer2 Font Size", 24, { min: 8, max: 120, step: 1 }),
      numberControl("layer2Speed", "Layer2 Speed", 175, { min: 0, max: 600, step: 1 }),
      numberControl("layer2Y", "Layer2 Y", 0)
    ]
  },
  docs: {
    parameters: "`message`, `fontSize`, `speed`, `waveAmp`, `waveSpeed`, `wavePhaseStep`, `scrollerY`, `scrollerX`, `layer2`, `layer2Speed`, `layer2FontSize`, `layer2Y`, `logoText`, `logoFontSize`, `logoY`, `scanlineStep`, `logoWaveAmp`, `logoWaveSpeed`, `logoWaveFreq`, `audioReact`, `beatBoost`",
    catalogNote: "Scroll + sine wave + scanline logo wobble.",
    description: "Scroll + sine wave + scanline logo wobble."
  }
});

export default sine_scroller_logoManifest;
