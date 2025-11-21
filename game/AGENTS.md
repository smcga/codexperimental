# AGENTS.md — Working on the Zombies Project

This document is for anyone collaborating on this codebase — human or artificial. It sets out the high-level rules of engagement so the project remains coherent, maintainable, and true to its design.

---

## 1. Project Essence

- This is a 2D puzzle–strategy game about **blue and green zombies** marching mindlessly through hazardous levels.
- The **only protagonists are zombies**; they differ only in colour (blue/green) and cosmetic details.  
- Core gameplay revolves around:
  - Zombies spawning from an entrance
  - Marching continuously
  - Being assigned **roles/abilities** to modify terrain, avoid hazards, and reach an exit
- The mechanical design is **fixed and conservative**: any change that alters core behaviour, roles, or win/lose conditions is a design decision and **must not be made casually in code**.

When in doubt, keep the game behaving exactly as defined in the design spec and treat changes to mechanics as a separate, explicit design request.

---

## 2. Source of Truth

- **Game Design Spec** (e.g. `DESIGN.md` or equivalent) is the primary reference for:
  - Roles/abilities and their behaviour
  - Zombie movement rules
  - Level goals, hazards, and win conditions
- **Code comments** and **tests** should reflect the design spec, not replace or reinterpret it.
- If you find inconsistencies between design, code, and tests:
  1. Assume the design document is correct until clarified.
  2. Open an issue or PR describing the inconsistency.
  3. Do not silently “fix” logic by intuition.

---

## 3. Architectural Principles

High level only; implementation details live in the relevant docs.

- **Deterministic simulation**
  - Given the same initial state and input (including timing of user actions), the outcome must be reproducible.
  - Avoid nondeterministic behaviour in the game loop (no random offsets, no time-dependent logic outside the main simulation step).

- **Separation of concerns**
  - Simulation (zombie behaviour, roles, terrain, hazards) must be independent from:
    - Rendering
    - Input handling
    - UI overlays and menus
  - This allows:
    - Replays
    - Headless testing
    - AI tooling to interact with the core simulation.

- **Data-driven levels**
  - Levels should be defined via data assets (e.g. JSON, YAML, or custom formats), not hand-coded logic.
  - The level editor and runtime loader should use the same underlying representation.

- **Stable identifiers**
  - Zombies, levels, roles, and hazards should have stable IDs (or names) suitable for:
    - Save files
    - Replays
    - Debugging and logging
    - AI tooling

---

## 4. Canonical Behavioural Rules

These are the behavioural invariants that all agents must preserve:

- Zombies:
  - Walk at a constant horizontal speed.
  - Reverse direction when hitting solid obstacles or blockers.
  - Have no awareness of hazards; they never “decide” to avoid death.
- Roles/abilities:
  - Are granted explicitly by the player (or test harness) via assignment.
  - Are limited in count per level.
  - Behave identically regardless of zombie colour.
- Terrain:
  - Has clearly defined categories: destructible vs indestructible.
  - Is modified only through defined roles and hazards, not arbitrary code shortcuts.
- Victory / defeat:
  - Each level defines:
    - Total zombie count
    - Required survivors
    - Time limit
  - Passing/failing conditions must match those definitions exactly.

Any change to these rules is a **design change**, not a refactor.

---

## 5. Coding Guidelines

- Prefer **clarity over cleverness**.
- Keep modules small and focused: e.g. a file per major system (simulation, zombies, roles, terrain, UI, audio).
- Use descriptive names:
  - `Zombie`, `Role`, `Builder`, `Blocker`, `Miner`, `Digger`, `Basher`, `Climber`, `Floater`, `Bomber`, etc.
- Document any subtleties in role behaviour (edge cases, interactions with terrain or other zombies).
- For performance-sensitive code (e.g. terrain modification, collision checks):
  - Optimise last, not first.
  - Include comments explaining any non-obvious optimisations.

---

## 6. Testing Strategy

- **Unit tests**
  - Core simulation and roles (e.g. building, digging, explosions) must have strong coverage.
  - Include tests for edge cases:
    - Role assignment near hazards
    - Behaviour at boundaries of levels
    - Interaction with indestructible terrain.

- **Integration tests**
  - Scenario tests where a scripted series of actions leads to known outcomes:
    - A zombie dig sequence producing a specific path.
    - A minimal level where precise role usage leads to all zombies surviving.

- **Determinism tests**
  - Run the same scenario multiple times and assert identical outcomes.
  - Where possible, record and replay input to validate engine determinism.

- **Regression tests**
  - Any bug related to pathing, roles, or terrain destruction should add a targeted test case.

---

## 7. Level and Content Creation

- All new levels should:
  - Be definable via the level data format (no hard-coded special cases).
  - Specify:
    - Total zombies
    - Required survivors
    - Spawn rate
    - Available roles and their counts
    - Time limit
  - Be testable in a “headless” mode for automated checks (e.g. verifying a known solution still works).

- Avoid designing levels that rely on subtle engine quirks or bugs. If a level depends on a bug:
  - Treat this as a **design/engineering issue** to resolve, not a feature.

---

## 8. Visual and Thematic Constraints

- Protagonists are **zombies, blue and green only**:
  - Cosmetic variations are acceptable (rags, hats, expressions).
  - No functional differences between colours.
- The tone is:
  - Darkly comic, not horror-realistic.
  - Light slapstick rather than gore-heavy.
- Visual changes must not alter hitboxes or behaviour unless explicitly specified in design and tests.

---

## 9. Collaboration Rules for Human and AI Agents

### Humans

- Keep discussions and decisions in issues/PRs as much as possible.
- Document design changes in the design spec, not just in code comments.
- Review AI-generated changes with the same scepticism you’d apply to a junior colleague:
  - Check for hidden logic changes, missing edge cases, or violated invariants.

### AI Systems

When generating or editing code, tests, or docs:

- **Do not invent mechanics**:
  - Only implement or extend roles, behaviours, and systems already defined in the design.
- **Preserve invariants**:
  - No “smart” zombies, no extra abilities, no silent rule changes (e.g. different speeds, gravity, or fall damage thresholds).
- **Respect structure**:
  - Follow existing patterns, styles, and architectures.
  - Extend rather than replace, unless refactoring is the explicit task.
- **Be explicit in PR descriptions**:
  - Summarise what changed.
  - List any assumptions made.
  - Call out any potential behaviour changes.

---

## 10. Decision-Making and Change Control

- Any change that affects:
  - Core zombie movement
  - Role behaviour
  - Win/lose conditions
  - Level format
  must go through a **design review** (even if informal).

- Use feature flags or configuration where experiments are needed:
  - Keep experimental behaviour isolated.
  - Default builds should preserve canonical gameplay.

---

## 11. How to Reason About New Work

When adding or changing anything, ask:

1. **Does this respect the simulation invariants and design spec?**
2. **Can we test this deterministically?**
3. **Is this data-driven where it should be?**
4. **Have we avoided surprising subtle behaviour changes?**

If the answer to any of these is “no” or “not sure”, treat that as a blocker and address it explicitly.

---

All agents are expected to keep this project faithful to its puzzle roots: simple rules, complex emergent solutions, and a lot of small zombies doing exactly what they’re told — even when that’s a terrible idea for them.
