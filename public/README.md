# Public assets
- `song.mp3` must be placed in this folder.
- `timeline.json` controls the audio source, section timings, transitions, text cues, and layered effect mixes (supported transition types include `fade`, `wipe`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `iris`, `flash`, `signal-collapse`, and `camera-punch-through`; layers support blend modes like `screen`, `overlay`, `multiply`, and `difference`).
- `timeline.release.json` stores the release-ready schedule aligned to the final audio cut.


# Billy’s rules for working on `timeline.release.json`

## 0) The core thesis (do not dilute this)
This demo is not “cool visuals to music”. It is a statement:
**AI can do THIS.**
Every creative decision must reinforce escalation, capability, and swagger.

If a change doesn’t make the demo feel *more* like a proof-of-power performance, it doesn’t belong.

---

## 1) Guard the spine: timing is sacred
- Never drift the **anchor timestamps** (hook hits, drop points, calm breaks). If you must adjust, do it deliberately and document why.
- Prefer changing *content* inside sections (params, layers, automation) over shifting section boundaries.
- The intro must remain intact and the first main section must start exactly at `intro.end`.

---

## 2) The hook must “answer back”
Whenever the music hits the hook (“AI can do THIS” or equivalent):
- Use an editorial punctuation: `flash` or `iris` (fast, confident).
- Pair it with a text stinger (“THIS”, “AI CAN DO THIS”, “WATCH”) using `glitchIn` and `shadow`.
- Make the surrounding 1–3 seconds *build toward* the hit via automation (speed/warp/glow/trail rising).

The visuals should feel like they’re shouting along with the track.

---

## 3) Treat sections like scenes, not presets
Every section should have an intention:
- **Set-up** (introduce a motif),
- **Build** (increase intensity),
- **Pay-off** (impact),
- **Release** (breathing space),
- **Escalation** (one-up the previous peak).

If a section reads like “random effect for X seconds”, it needs either:
- layers to contextualise it,
- automation to evolve it,
- or a better edit/transition.

---

## 4) Escalation arc: retro → rich → 3D → beyond → maximalism
Keep a clear progression:
- Early: playful, nostalgic, readable forms (8bit/16bit energy).
- Mid: richer pattern language, more density, more depth.
- Later: 3D / WebGL flex, bigger “cathedral” moments, more “impossible” spaces.
- Finale: controlled maximalism, not noise.

Never peak too early. Save the nastiest blend-stacks and fastest cuts for later.

---

## 5) Use eras as narrative markers
- `era` is not decoration; it’s a chapter tag.
- Era shifts should feel like *historical leaps* in graphics capability.
- Reinforce era changes with text cues (“8BIT”, “16BIT”, “POLYGONS”, “BEYOND”) and with a distinct palette/mood shift.

---

## 6) Layering rule: build depth, don’t mud the frame
- Base effect = the “foreground idea”.
- Layers = texture, grit, atmosphere, or emphasis.
- Keep most layers at **0.08–0.28 opacity**. Only go higher when it’s an intentional overload moment.
- Use blend modes with intent:
  - `screen` / `lighter`: energy, particles, rain, starfields
  - `overlay`: grit, edge emphasis, glitch texture
  - `difference`: psychedelic inversion (use sparingly, for shock)
  - `soft-light`: subtle dimensionality, dreamy calm

If readability drops (everything looks grey/brown/flat), reduce layers and/or opacity.

---

## 7) Automation is mandatory for repeated effects
If an effect appears more than once, do not reuse the same params.
- Add automation ramps (even subtle) to make scenes feel alive.
- “Energy curve” concept:
  - rising energy: increase `speed`, `warp`, `glow`, `trail`, `shake`, `lineWidth/thickness`, `alpha`
  - release: reduce those values, increase calm elements (soft-light layers, slower motion, lower contrast)

Never automate non-numeric params (they won’t interpolate cleanly). Keep automation numeric.

---

## 8) The “motif rhyme” technique (for fast rushes)
When switching rapidly (e.g. 03:48–04:11 type runs), ensure continuity:
- Reuse a subtle glue layer across many micro-sections (e.g. `feedback` at low opacity).
- Make parameters “rhyme” across different effects:
  - `glow ↔ alpha ↔ trail` rise together
  - `warp ↔ wobble ↔ shake` rise together
  - `lineWidth ↔ thickness ↔ barHeight` rise together
- The viewer should feel one continuous organism changing shape, not a slideshow.

---

## 9) Text cues: speak sparingly, land hard
Text is a weapon. Use it like a punch, not wallpaper.
- Short phrases only (one to four words).
- Place away from critical centre action unless it’s a deliberate “THIS” hit.
- Prefer high contrast colours and `shadow`.
- Use `typewriter` only for spoken-word/manifesto moments, with deliberate pacing.

If text is on-screen too often, it loses power.

---

## 10) Transitions are musical consonants
- Use `flash` for percussive hits and “proof moments”.
- Use `iris` as a reveal/conceal, for “portal opening” energy.
- Use `wipe/slide-*` to create forward momentum and directionality.
- Use `fade` for mood changes and breathing space.
- Keep rush transitions short (≈ 0.04–0.08s). Keep mood transitions longer (≈ 0.3–0.7s).

Bad transitions feel like mistakes. Good transitions feel like rhythm.

---

## 11) Parameter sanity: stay within aesthetic bounds
When pushing intensity, avoid turning everything into white mush:
- Don’t stack too many `lighter` layers at high opacity.
- Don’t overcrank `glow` + `exposure` simultaneously unless it’s a deliberate blast.
- Keep `shake/maxShake` controllable: if the viewer can’t parse motion, reduce it.

Aim for “ecstatic” not “unreadable”.

---

## 12) Determinism and seeds: use intentionally
- Changing seeds can be amazing (especially on WebGL scenes), but do it as a *moment*, not constant randomness.
- If you automate `seed`, do it in short windows where mutation is the point, and pair it with a punchy transition.
- Keep seeds stable in calm scenes to avoid visual anxiety.

---

## 13) Performance and fallback awareness
- WebGL-heavy effects (`gl_*`, `neon_alley`) are impact tools. Use them for peaks and future chapters.
- Always have a plan for devices without WebGL (the system may fall back). Don’t rely on a single WebGL moment to carry the narrative.

---

## 14) Editing discipline: change small, review often
When modifying:
- Make one meaningful change at a time (timing OR layering OR automation OR text).
- Keep section IDs stable unless you’re intentionally restructuring.
- Preserve start/end alignment (no overlaps, no gaps) unless deliberately used as a hard cut.

---

## 15) If you’re unsure, follow the three questions
Before committing any new idea, ask:
1) Does this increase the sense of **capability and escalation**?
2) Does it respect the **hook-response** structure (proof on impact)?
3) Does it keep the demo **coherent** (motifs, eras, narrative)?

If “no” to any, revise it until it becomes “yes”.

---

## 16) The golden rule
This is a victory lap.
Make it feel like the machine is grinning.
