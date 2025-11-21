# Game Prototype

## Current Scope
- Title screen shell with start and options interactions.
- Core zombie simulation covering walking, falling, hazards, and portal transfers.

## Next Steps
- Build toolbar layer for quick actions.
- Define player roles and associated abilities.
- Add portal interactions to move between areas or layers.
- Lay out terrain tiles to support movement and obstacles.

## Level schema
Levels live in `levels/*.json` and describe terrain bitmaps, portals, hazards, spawn pacing, and quotas. Use `js/engine/level-loader.js` to parse a schema, hydrate a `Terrain` instance, and derive deterministic schedules for portals and spawners. Chapter ordering for Training through Expert tiers is defined in `js/levels/index.js`.
