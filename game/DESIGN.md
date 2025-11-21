1. Core Premise

Players guide hordes of small, dopey zombies from an entry portal to an exit portal within a 2D side-view map. Zombies walk continuously, oblivious to hazards, unless given specific roles. The player assigns roles to prevent them from dying and to ensure enough reach safety to clear each stage.

Zombies come in two cosmetic variants: blue with green hair, or green with blue hair. They function identically; colour variation is purely aesthetic.

2. Zombies: Behaviour and Control

Base behaviour:
• Each zombie spawns at the entrance and walks in its current direction until obstructed.
• On hitting a wall or large obstacle, it reverses direction.
• It cannot assess danger; it will walk into traps, off cliffs, into fire, acid, or machinery without intervention.

Player interaction:
• The player selects a role from a toolbar and clicks on a zombie to assign it.
• Only a limited number of role assignments is available per stage.
• Role assignment is instantaneous.

3. Roles (Abilities)

Names can be altered by the art team, but the functions must match those described here.

Blocker
A zombie stands still with arms outstretched, forcing others to turn around. It remains immobile until removed by game mechanics (see Explosion role).

Basher
Digs horizontally through terrain until the surface becomes too hard.

Miner
Digs diagonally downwards, forming a shallow slope.

Digger
Digs vertically downwards.

Climber
Gains the ability to climb vertical surfaces. Falls if the surface is overhung.

Floater
Deploys a decelerating descent (an umbrella replacement might be a tattered coat or parasitic fungus). Prevents fatal falls.

Builder
Creates a staircase of temporary terrain tiles; stops when out of tiles or obstructed.

Bomber
After a countdown, explodes. The zombie is removed from the population, and surrounding terrain is destroyed. Can also free blockers.

Other optional roles for extended editions:
• Speed-up booster
• Direction-turning signpost dropper
• Freeze-into-pillar zombie (acts as temporary terrain)

Only the core set is mandatory for classic parity.

4. Stage Structure

Stages are side-view 2D maps made of destructible and indestructible terrain, hazards, traps, moving contraptions, and decorative elements.

Each stage defines:

• Spawn rate for zombies
• Total zombies
• Required survivors to pass
• Available roles and their quantities
• Time limit
• Terrain composition (soft earth, steel, etc.)
• Hazard layout (spikes, grinders, lava, rotating blades, zombie-eating plants, and any theme-appropriate dangers)

5. Environmental Elements

Terrain:
Soft terrain is destructible by digging roles. Steel or fortified surfaces cannot be modified.

Entry portal:
Zombies emerge at a defined rate. Portal appearance is theme-driven (a ruined crypt gate, a glowing rift, etc.).

Exit portal:
Goal area. Zombies entering it are counted as saved.

Hazards:
Designed to kill zombies on contact:
• Fire pits
• Acid pools
• Spinning blades
• Crushing pistons
• Drops exceeding safe fall height
• Bottomless pits

Moving machinery:
Can alter paths or impose timing constraints: platforms, doors, switches.

6. Level Progression and Difficulty Curve

Difficulty increases across chapters:

Training: Introduces one role at a time with extremely forgiving layouts.

Intermediate: Requires combining roles, using blockers strategically, building over hazards, and timing bursts of zombies.

Advanced: Introduces tight resource limits, multiple possible routes, and levels requiring player restraint.

Expert: Demands precise timing and harshly limited role allocations.

Insanity tier (optional): Puzzle-heavy levels that seem impossible until one realises an unconventional trick.

7. Visual and Audio Direction

Art style:
Quirky, slightly grotesque cartoon aesthetic. The zombies are expressive but harmless-looking. Blue and green variants differ only in hue, subtle posture differences, or costume scraps.

Animations:
• Idle shuffle
• Turning around
• Performing roles (digging, bashing, climbing, building)
• Exploding
• Falling/floating
• Entering exit portal (dissolve, warp, or ascend)

Sound design:
• Soft groans and mutters
• Slapstick footfalls
• Comedic impact sounds on direction change
• Distinct audio cues for each role assignment
• Countdown beep for explosions

Music should balance tension with whimsy: organ riffs, undead choirs, eerie toy instruments, and slightly macabre humour.

8. UI / UX

Interface:
• Toolbar of roles at bottom of the screen
• Counters showing remaining uses
• Counters showing zombies saved, dead, and total
• Fast-forward controls
• Pause with planning mode
• Restart button (instant)

Cursor clearly indicates when a role is selected; highlighting zombies on hover reduces misclicks.

9. Physics and Timing

Movement:
Consistent horizontal speed; turning has a brief animation delay.
Vertical speed is governed by gravity unless floating.

Collision:
Blockers project a collision boundary affecting only zombies. Terrain collision uses pixel or cell-accurate masks for diggable vs. solid material.

Building/digging steps:
Each build tile or dig step takes a fixed number of frames for predictability.

10. Technical Architecture

Engine expectations:
• Tile-based terrain representation with pixel-accurate rendering
• Bitmask-style layers for destructible terrain
• Deterministic simulation to ensure reproducibility
• Fixed-step update loop to maintain timing synchronicity
• Playable in a Web Browser

Performance considerations:
• Efficient flood-fill checks for pathfinding are not required; the zombies have no internal AI
• Level loading uses compressed terrain bitmaps or similar

11. Level Editor

A built-in editor must allow players to craft custom stages with:

• Terrain drawing tools
• Placement of hazards, portals, machinery
• Role quotas
• Spawn rate, time limit, required survivors
• Test mode for iterative refinement

12. Success Metrics

A stage is cleared if the number of rescued zombies meets or exceeds the requirement before the timer runs out.

A stage is failed if the timer expires or too many zombies perish.

Scoring is optional but can include time bonus and unused role bonus.
