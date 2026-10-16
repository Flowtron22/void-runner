# VOID RUNNER — Game Design & Development Guide

This file is the canonical handoff document for humans and Codex agents continuing the project on another computer. It describes the intended game, the current Milestone 1 implementation, the simulation rules, the source layout, and the next development steps.

## 1. Project identity

**Title:** VOID RUNNER  
**Genre:** Real-time-with-pause spaceship survival and management game  
**Presentation:** Portrait-first, low-poly 2.5D tactical diorama  
**Technology:** HTML5, CSS, vanilla JavaScript ES modules, Three.js  
**Repository:** `https://github.com/Flowtron22/void-runner`  
**Current scope:** Milestone 1 combat vertical slice

The player commands the courier vessel **Aster Vale**, which carries critical data through a collapsing region of space. The ship is fragile, its systems interact, and hostile forces are pursuing it. The fantasy is not manual piloting; it is keeping a living spacecraft functional while failures cascade.

The game is inspired by systemic spaceship-management games, but its names, presentation, interface, ship layouts, factions, visuals, and writing are original.

## 2. Design pillars

1. **The ship is the main character.** Rooms, systems, crew, atmosphere, damage, and power should feel interconnected.
2. **Readable emergencies.** The player must immediately understand what failed, where it failed, and what can fix it.
3. **Pause is a core verb.** Simulation stops, but the player may inspect the ship, move crew, operate doors, redistribute power, and choose targets.
4. **Failures cascade but remain recoverable.** Fire consumes oxygen; doors affect airflow; crew leave stations to repair damage; lower engine staffing/power reduces evasion; subsequent hits create new problems.
5. **Portrait-first tactical play.** Enemy ship at the top, projectile lane in the middle, player ship below, management controls at the bottom.
6. **Simulation before spectacle.** Simple geometry with meaningful interactions is more important than elaborate models or shaders.

## 3. Current player experience

The current build starts directly in a single combat encounter:

1. Read the mission briefing and begin the engagement.
2. Select one of three crew members and tap a player room to issue a movement order.
3. Open or close physical doors to control access and oxygen flow.
4. Select the airlock room and vent it when fire or atmosphere management requires it.
5. Redistribute a ten-unit reactor budget among ship systems.
6. Wait for weapons to charge, arm one, and tap an enemy room to target that subsystem.
7. Pause whenever needed to issue orders safely.
8. Destroy the Warden cutter before the courier loses all hull or all crew.

The encounter ends in a victory or defeat dialog and can be restarted.

## 4. Controls

### Pointer and touch

- Select a crew card or its 3D character, then select a room to move that crew member.
- Tap a physical door to open or close it.
- Select a player room to inspect oxygen, system health, and room controls.
- Use **Cycle connected doors** to toggle every door connected to the selected room.
- Select the **Airlock** room to enable the vent/seal control.
- Use **Systems** `+` and `−` controls to redistribute reactor power.
- Use **Weapons** to arm a ready weapon, then tap an enemy room.
- Use the top-right button to pause or resume.

### Keyboard

- `Space`: Pause/resume.
- `F1`: Toggle debug panel.

### Debug panel

- Add 100 scrap.
- Repair player hull.
- Start a fire in a random player room.
- Create a hull breach in a random player room.
- Damage a random system.
- Destroy the enemy immediately.

## 5. Game states

The current implementation uses `COMBAT`, `VICTORY`, and `GAME_OVER` behavior. The full design should eventually support these explicit states:

- `MAIN_MENU`
- `SHIP_SELECT`
- `SECTOR_MAP`
- `EVENT`
- `COMBAT`
- `STORE`
- `UPGRADE`
- `SECTOR_SELECT`
- `FINAL_BATTLE`
- `VICTORY`
- `GAME_OVER`

Only one state should own active simulation and input at a time.

## 6. Player ship layout

The Aster Vale is a narrow vertical courier. Its nose points upward on screen.

```text
                 BRIDGE
                    │
          SHIELDS ──┴── WEAPONS
              │           │
           MEDBAY       OXYGEN
              └─────┬─────┘
                 ENGINE
                    │
                 AIRLOCK
```

Room definitions live in `js/data/ships.js`. Each room contains:

- `id`
- `name`
- `system`
- local `x` and `z` position
- width and depth
- capacity
- neighbor room IDs
- optional `airlock` flag

Runtime room state adds:

- `oxygen`, clamped from 0 to 100
- `fire`, clamped from 0 to 100
- `breach`
- `damage`
- assigned crew IDs
- selection state

## 7. Crew

The initial crew is:

| Crew | Species | Starting room | Role tendency |
|---|---|---|---|
| Nova | Terran | Bridge | Balanced |
| IX-4 | Mechanist | Drive Core | Fast repair, lower health/combat |
| Bram | Gravkin | Weapons | High health/combat, slower repair |

Species data lives in `js/data/crewSpecies.js`. Crew currently track health, repair speed, movement speed, current room, target room, path, path progress, death state, and selection state.

### Movement logic

1. The player selects a crew member.
2. The player selects a destination room.
3. Breadth-first search finds the shortest route through the room graph.
4. Closed doors are considered impassable.
5. The crew member interpolates physically from one room center to the next.
6. On reaching a room, membership is removed from the old room and added to the new room.
7. If a required door closes during travel, the route is cancelled instead of allowing movement through it.

Pathfinding is implemented in `js/crew/CrewPathfinding.js`.

### Automatic crew work

When stationary, living crew automatically prioritize:

1. Fire suppression in the current room.
2. Repairing room and system damage.
3. Healing if located in a powered medbay.

Crew take damage from room fire and from oxygen below 20%. Crew death is permanent for the encounter. Dead crew cannot move or work.

## 8. Doors, airlocks, and atmosphere

Doors are generated from room-neighbor relationships. Each unique room pair creates one door. A door tracks open/closed state and a visual animation progress value.

### Atmosphere rules

- Powered life support slowly raises oxygen in sealed, non-breached rooms.
- Hull breaches rapidly vent their room.
- An open airlock rapidly vents the airlock room.
- Open doors equalize oxygen between neighboring rooms.
- Closed doors prevent oxygen transfer and crew movement.
- Fire consumes oxygen.
- Fire grows slowly when sufficient oxygen is available.
- Fire declines quickly in low oxygen.
- Oxygen can never fall below 0 or rise above 100.

The systemic use case is to open a route from a burning room to the airlock, vent the atmosphere until the fire dies, then close the route and allow life support to refill the ship.

## 9. Systems and reactor power

System defaults live in `js/data/ships.js`. Runtime systems track:

- containing room ID
- maximum power level
- current power allocation
- current system health

The player reactor provides ten power units. Allocated power may not exceed reactor output. A damaged system cannot accept or retain more power than its current functional health allows.

Current systems:

| System | Maximum power | Effect |
|---|---:|---|
| Bridge | 1 | Contributes to evasion |
| Shields | 2 | Sets shield capacity and regeneration ceiling |
| Weapons | 4 | Powers weapons in list order |
| Medbay | 1 | Heals crew in the medbay |
| Oxygen | 1 | Replenishes room oxygen |
| Engines | 2 | Contributes to evasion |

Effective system strength is the lower of allocated power and remaining health.

### Power behavior

- Power can be changed during tactical pause.
- Power cannot become negative.
- Total allocated power cannot exceed the reactor.
- System power is reduced automatically when damage lowers its usable capacity.
- Weapons charge only while enough weapon-system capacity remains to power them.

## 10. Shields and evasion

Shield capacity is based on effective shield-system strength. Shields regenerate one layer after a seven-second timer until reaching capacity. Taking a shield hit removes shield layers and resets regeneration.

Evasion is calculated from effective engines and bridge levels, with a hard cap to avoid invulnerability. A successful evasion negates the incoming projectile.

## 11. Weapons and targeting

Weapon data lives in `js/data/weapons.js`.

### Player weapons

| Weapon | Power | Cooldown | Shots | Damage |
|---|---:|---:|---:|---:|
| Arc Pulse | 2 | 6.5 s | 2 | 1 per shot |
| Mass Driver | 2 | 10 s | 1 | 3 |

### Enemy weapons

- Needle Array
- Rift Cannon

### Firing sequence

1. A powered weapon accumulates charge.
2. At full charge it becomes ready.
3. The player arms the weapon.
4. The enemy ship becomes the active targeting surface.
5. The player selects a specific enemy room.
6. A salvo entry is queued for each shot.
7. Three.js projectile meshes interpolate from the weapon room to the target room.
8. On arrival, evasion is checked.
9. If not evaded, shields absorb the shot first.
10. An unshielded hit damages hull, the room, and its system.
11. Hits may also start fires or create breaches.

The enemy follows the same projectile and damage rules where practical. Enemy targeting favors functional player rooms but retains randomness.

## 12. Damage and repair

Unshielded hits:

- Reduce hull by weapon damage.
- Add room damage.
- Reduce system health when the room contains a system.
- Clamp system power to remaining usable system health.
- Have a chance to start a fire.
- Have a smaller chance to create a breach.

Stationary crew repair their current room. Repairing reduces room damage and restores system health up to its maximum. Repair speed is multiplied by species ability.

The player loses when hull reaches zero or every crew member is dead. The enemy loses when its hull reaches zero.

## 13. Pause and time model

Simulation uses a fixed timestep of `1 / 30` second. Rendering continues with `requestAnimationFrame`.

When paused, simulation delta does not advance. This freezes:

- Crew movement
- Weapon charging
- Projectiles
- Shield regeneration
- Fire and oxygen simulation
- Repairs and healing
- Enemy AI

The following remain available:

- Crew selection and movement orders
- Door and airlock controls
- Reactor power redistribution
- Weapon arming and target selection
- UI navigation and inspection

Do not replace the fixed-step model with frame-dependent simulation.

## 14. Rendering and camera

`js/render/SceneManager.js` owns Three.js setup and rendering.

- Orthographic tactical camera with no free rotation.
- Rooms lie mainly on the X/Z plane.
- Camera looks downward at an angle for a miniature/dollhouse effect.
- Enemy ship is smaller and above the player ship.
- Player ship occupies the larger lower play area.
- Room floors are raycast targets.
- Crew, doors, shields, projectiles, impacts, fires, and breaches are rendered as simple geometry.
- Ambient, hemisphere, and directional lighting keep the diorama readable.
- The background uses a lightweight point-star field.
- Camera shake is brief and subtle after impacts.

Performance rules:

- Avoid expensive post-processing.
- Avoid dynamic shadow-heavy lighting.
- Reuse geometry and materials when expanding content.
- Prefer pooling for projectiles and particles if object counts increase.
- Keep mobile pixel ratio capped.

## 15. Interface and responsive behavior

HTML/CSS owns the HUD, resource counters, pause button, enemy status, selected-room panel, crew cards, system-power grid, weapon cards, dialogs, and debug panel.

The interface is designed for a 9:16 portrait viewport first. At narrow widths:

- Controls stay large enough for touch.
- Bottom management panels use tabs.
- The player ship remains the dominant visual.
- Compact header presentation hides nonessential labels.

Desktop uses the same layout at a wider scale. No interaction should depend on hover.

## 16. Audio

`js/core/AudioSystem.js` contains lightweight synthesized audio hooks for lasers, cannons, shield impacts, hull impacts, doors, victory, and defeat. Audio is unlocked after the first user gesture to comply with browser restrictions.

The game must continue to work when audio is unavailable. Future external audio assets should remain optional and use the same event-oriented interface.

## 17. Source architecture

```text
FTL/
├── index.html                  # Game shell, HUD, dialogs, import map
├── css/
│   └── main.css                # Full visual and responsive design
├── js/
│   ├── main.js                 # DOM-ready entry point
│   ├── core/
│   │   ├── Game.js             # Game state, loop, combat, UI binding
│   │   └── AudioSystem.js      # Optional synthesized sounds
│   ├── crew/
│   │   └── CrewPathfinding.js  # Breadth-first room routing
│   ├── data/
│   │   ├── crewSpecies.js      # Species statistics
│   │   ├── ships.js            # Room layouts and system defaults
│   │   └── weapons.js          # Weapon definitions
│   ├── render/
│   │   └── SceneManager.js     # Three.js scene and interaction rendering
│   └── ship/
│       └── Ship.js             # Ship, rooms, crew, power, atmosphere, repair
├── scripts/
│   └── dev-server.mjs          # Dependency-free local static server
├── package.json
├── package-lock.json
├── README.md
└── ggd.md                      # This handoff document
```

### Ownership boundaries

- Put reusable content definitions in `js/data/`.
- Put simulation truth in `Ship` or future dedicated simulation modules.
- Put encounter flow and coordination in `Game`.
- Keep Three.js object creation and visual state in `SceneManager`.
- Keep gameplay-independent presentation in HTML/CSS.
- Do not encode gameplay state only in DOM or meshes; visuals must reflect simulation state.

## 18. Local setup after cloning

Requirements: a recent Node.js version and Git.

```powershell
git clone https://github.com/Flowtron22/void-runner.git
cd void-runner
npm install
npm run dev
```

Open `http://127.0.0.1:4173`.

Syntax checks:

```powershell
npm run check
```

The game deliberately uses a static server because browser ES modules should not be launched directly through `file://`.

## 19. Validation checklist

Before committing gameplay changes, verify:

- Game loads with no browser-console errors.
- Intro dialog opens and combat begins.
- Every crew card selects correctly with mouse and touch.
- Crew traverse valid open-door paths physically.
- Closed doors block paths and cancel interrupted movement.
- Door animation matches logical state.
- Oxygen stays within 0–100.
- Open doors equalize atmosphere.
- Breaches and the open airlock vent correctly.
- Fire consumes oxygen and dies in vacuum.
- Crew suppress fire and repair damage.
- Reactor allocation never becomes negative or exceeds capacity.
- Damaged systems cannot use excess power.
- Weapons charge only when powered.
- Weapon arming remains reliable while UI values refresh.
- Targeted projectiles stop during pause.
- Shield impacts remove shields before hull damage.
- Enemy subsystem damage changes enemy capability.
- Enemy stops attacking after defeat.
- Victory and defeat dialogs appear once.
- Restart creates only one animation loop.
- Portrait and desktop layouts remain readable.

## 20. Important implementation constraints

- No backend or server-side game logic.
- No React, Vue, TypeScript, external UI framework, or physics engine.
- Use ES modules.
- Use Three.js for the tactical world and HTML/CSS for interface panels.
- Do not allow free camera rotation.
- Never let simulation behavior depend heavily on render frame rate.
- Do not teleport crew between rooms.
- Do not allow dead crew to act.
- Do not allow crew through closed doors.
- Do not let weapons fire when disabled or unpowered.
- Clean up projectiles and encounter state before starting another combat.
- Preserve portrait-first readability.
- Keep names, writing, factions, art, and UI original.

## 21. Known limitations of the current slice

- Only one player ship and one enemy layout exist.
- Enemy crew use the repair simulation but are not rendered or given full tactical AI.
- No boarding combat exists yet.
- Door controls toggle all connected doors rather than selecting individual doors through the panel; physical doors remain individually clickable.
- Weapon targeting does not yet enlarge the enemy ship.
- Fire and breach effects are deliberately simple.
- Crew station bonuses and experience are not implemented.
- Current-run saving is not implemented.
- There is no sector map, campaign, store, upgrade screen, event system, or boss.
- Some future systems described below remain design targets, not current functionality.

## 22. Development roadmap

### Milestone 2 — Sector journey

- Procedural sector map with roughly 18–22 connected nodes.
- Fuel cost of one per jump.
- Hidden node types revealed on visit.
- Combat, event, distress, store, and exit nodes.
- Hostile fleet territory advancing after every jump.
- Scrap rewards.
- Upgrade and repair screen.
- Randomized stores selling fuel, missiles, repairs, weapons, and crew.

### Milestone 3 — Crew and combat depth

- Full species roster, including an energy being and oxygen-independent voidborn species.
- Crew experience for piloting, engines, weapons, shields, repair, and combat.
- Skill levels 0–2.
- Boarding and enemy boarders.
- More weapons and enemy variants.
- Environmental hazards.
- Blue special event choices gated by crew, equipment, or system levels.

### Milestone 4 — Campaign

- Eight sectors.
- Sector selection.
- Engineer and Raider player ships in addition to Courier.
- Ship unlocks, achievements, statistics, and settings in `localStorage`.
- Final command ship with three phases:
  1. Heavy weapons
  2. Drone assault
  3. Energy barrier and boarding pressure
- Complete victory flow.

## 23. Data-driven expansion rules

New content should be declared as data and consumed by generic systems.

### Weapons

A weapon entry should define at least:

```js
{
  id: 'exampleWeapon',
  name: 'Example Weapon',
  power: 2,
  cooldown: 8,
  damage: 1,
  shots: 2,
  shieldDamage: 1,
  color: 0x5df2dd
}
```

### Events

Future events should use a structure similar to:

```js
{
  id: 'silent_relay',
  title: 'The Silent Relay',
  description: 'A dead communication spindle tumbles above the moon.',
  choices: [
    { label: 'Search the relay', outcome: 'searchRelay' },
    { label: 'Leave it', outcome: 'leave' },
    {
      label: '[Mechanist] Restore auxiliary power',
      requirement: { species: 'mechanist' },
      special: true,
      outcome: 'safeRelayAccess'
    }
  ]
}
```

Do not hardcode individual events, weapons, species, or enemies into control flow when a data definition can describe them.

## 24. Guidance for the next Codex session

When continuing this repository:

1. Read this file and `README.md` first.
2. Run `npm install`, `npm run check`, and `npm run dev` before editing.
3. Inspect the current browser console and complete one combat loop.
4. Preserve the fixed-step simulation and state/visual separation.
5. Make the smallest coherent milestone change rather than starting multiple incomplete systems.
6. Update this file whenever mechanics, architecture, controls, limitations, or roadmap status change.
7. Run the validation checklist before committing.
8. Commit changes with a descriptive message and push `main` only after verification.

The success criterion is always the same: the player should feel that they are managing a living spaceship whose systems affect one another, not merely controlling a 3D model.
