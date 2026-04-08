Try your best, never give up, nothing is impossible, believe in yourself.

Keep the "Effect catalog" section in README.md up to date whenever adding or changing effects.


## Sacred musical anchors (absolute priority)

The demo timeline is locked to sacred musical anchors documented in `docs/sacred-musical-anchors.md`.

- These anchors are **mandatory** and **must not drift**.
- Treat every listed timestamp as musically exact (not approximate).
- For any timeline edit (`public/timeline.json`, `public/timeline.release.json`, cue timings, intro timings, section boundaries, transition timing), re-check and preserve all anchors.
- For any PR/commit that touches timeline files or timing data, include a concise changelist with explicit before/after timestamps (mm:ss.mmm) so reviewers can validate musical alignment quickly.
- In those changelist notes, call out every sacred anchor timestamp that was checked and confirm whether it changed or remained locked.
- If an intentional recut ever requires anchor changes, update `docs/sacred-musical-anchors.md`, `README.md`, and this file in the same commit and clearly explain why.
- Do not merge timeline edits that violate or ignore anchor constraints.
- Treat secondary effect-switch cues in `docs/sacred-musical-anchors.md` as advisory only; they never override sacred anchors or clearly intentional section art direction.
- Current locked rap start anchor: **03:25.012** (word: **“All”**).

## Effect documentation guardrails
- Do not add, remove, or rename any effect without:
  - Updating its metadata or ensuring `scripts/generateEffectsDocs.ts` can extract its params.
  - Running `npm run docs:effects` and committing the updated `docs/effects.md`.
  - Verifying the effect appears in the debug panel/editor dropdowns (registry is the single source).
- Any change to effect parameters must update `docs/effects.md` and preserve backward compatibility where possible.

## Effect deletion timeline safety

When fully deleting an effect from the codebase/registry:

- Find every timeline usage of that effect and swap each occurrence to another valid effect.
- Preserve timeline structure exactly: do **not** change any timings, timestamps, cue offsets, section boundaries, transition timing, section ordering, or section positions.
- Keep replacements as strict effect-name swaps (and any minimally required compatible params) so the timeline remains musically and structurally identical.
- Remove the deleted effect cleanly from implementation, registry, docs, and UI selectors only after timeline swaps are complete.

### PR checklist
- [ ] Docs updated (`docs/effects.md` regenerated).
- [ ] Docs check passes (`npm run docs:check`).
- [ ] Effect appears in UI/debug dropdowns.
- [ ] If touching effect submission/moderation/review flows (`api/effects*`, `src/effectIdeas*`, `src/effectReview*`), run and verify moderation-link tests and pending review fetch paths so review links do not regress to false “expired/missing” states.

## Moderation/review regression guardrail

When changing effect-generator payload validation or optional metadata parsing:

- Keep review-page loading tolerant of legacy/partial metadata on pending effects.
- Do not reject a pending effect solely because optional fields (`params`, `docs`, future optional fields) are malformed/missing.
- Always add/update tests that cover:
  - fetching pending effect records with optional-field shape drift;
  - approving/rejecting pending effects via signed links;
  - a happy-path pending review fetch with token.

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
