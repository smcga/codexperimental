# Game Prototype


## Level schema
Levels live in `levels/*.json` and describe terrain bitmaps, portals, hazards, spawn pacing, and quotas. Use `js/engine/level-loader.js` to parse a schema, hydrate a `Terrain` instance, and derive deterministic schedules for portals and spawners. Chapter ordering for Training through Expert tiers is defined in `js/levels/index.js`.
