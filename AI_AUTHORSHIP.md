# AI authorship and provenance

This demo is AI-assisted, not autonomous.

## Human-authored / human-directed

- overall concept;
- soundtrack selection or arrangement;
- timeline structure;
- musical anchors;
- scene ordering;
- effect selection;
- parameter curation;
- deletion and pruning;
- integration;
- debugging;
- release packaging;
- final judgement of what belongs in the production.

## AI-assisted

- effect prototypes;
- implementation sketches;
- parameter exploration;
- boilerplate;
- selected visual routines, after human review and integration.

## Not acceptable for release inclusion

- unreviewed generated code;
- effects that only exist because they are novel in isolation;
- generated visuals that break the locked musical anchors;
- runtime network generation during the canonical release;
- unclear provenance for major release scenes.

## Provenance table (template)

| Effect or section | Origin | Human edits / curation | Included in release? | Notes |
|---|---|---|---|---|
| Timeline structure (`public/timeline.release.json`) | Human-authored (repository) | Ongoing manual editing and sync checks against sacred anchors | Yes | Canonical release timeline. |
| Sacred musical anchors (`docs/sacred-musical-anchors.md`) | Human-authored (repository) | Maintained as locked musical constraints | Yes | Authoritative timing reference. |
| Effect registry and integrated release effects | Mixed / unknown (to be documented) | Human integration, parameter curation, and pruning required | Yes | TODO: enumerate per-effect provenance for release notes. |
| Generated effect submission pipeline | Human-authored tooling with AI output inputs | Moderation, approval, and review flow gates inclusion | No (direct runtime generation) | Generated ideas must be reviewed before any release inclusion. |
