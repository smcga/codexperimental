Try your best, never give up, nothing is impossible, believe in yourself.

Keep the "Effect catalog" section in README.md up to date whenever adding or changing effects.

## Effect documentation guardrails
- Do not add, remove, or rename any effect without:
  - Updating its metadata or ensuring `scripts/generateEffectsDocs.ts` can extract its params.
  - Running `npm run docs:effects` and committing the updated `docs/effects.md`.
  - Verifying the effect appears in the debug panel/editor dropdowns (registry is the single source).
- Any change to effect parameters must update `docs/effects.md` and preserve backward compatibility where possible.

### PR checklist
- [ ] Docs updated (`docs/effects.md` regenerated).
- [ ] Docs check passes (`npm run docs:check`).
- [ ] Effect appears in UI/debug dropdowns.

### How to add a new effect
1. Implement the effect in `src/renderer/effects/` (or `src/renderer/effects/gl/` for WebGL2 shader effects).
2. Register it in `src/renderer/effects/index.ts` (registry is the single source of truth).
3. Ensure parameters are readable by the docs generator (prefer explicit defaults or `DEFAULTS` objects).
4. Run `npm run docs:effects` and commit the updated `docs/effects.md`.
5. Run `npm run docs:check` and `npm test`.


## Terminology guardrails: transitions vs effects

In this repo, "transition" means a timeline/section transition between two scenes, not a new scene effect.

When a user asks for a new transition, default to:
- updating `TransitionType` in `src/config/loadConfig.ts`
- updating transition handling in `src/timeline/timeline.ts`
- updating transition rendering in `src/renderer/renderer.ts`
- updating editor/debug transition selectors
- updating README/docs for supported transition types

Do NOT implement a requested "transition" as a new effect in `src/renderer/effects/` unless the user explicitly says they want a new effect.

Some effects have internal params such as `transitionStyle` (for example greets-wall effects). Those are effect-local animation options, not timeline transitions.
