# VOID RUNNER: PROTOCOL FRONT — Game Design Document

This document is the authoritative handoff for the current game. Read it with `ART_BIBLE.md` before changing mechanics or presentation.

## 1. Product definition

VOID RUNNER: PROTOCOL FRONT is a portrait-first, single-player roguelike army-builder and auto-battler for web and touch devices.

The player manually prepares a force under two simultaneous constraints:

1. Every unit has a command-point cost.
2. Every unit has a physical footprint that must fit inside a 6×5 deployment case.

The player then selects a route through a four-region expedition. Combat is fully automatic. Strategy comes from force composition, spatial packing, front/back placement, equipment, route choice, and temporary run protocols.

The design combines three broad ideas without copying any protected setting, units, UI, names, or art:

- Point-budget army construction.
- Spatial inventory-style unit packing.
- A multi-region route with encounters, rewards, bosses, and between-run research.

## 2. Non-negotiable pillars

- **Portrait is mandatory.** The reference frame is 480×854 and the desktop presentation remains a centered portrait command board.
- **Preparation is manual.** The player chooses units, placement, orientation, and gear.
- **Battle is automatic.** During combat the player may only change playback speed or resolve immediately.
- **Every run changes.** Route choices, rewards, gear, and temporary protocols create the build.
- **Points and space both matter.** A legal army can still be badly packed; an efficient shape can still exceed the point limit.
- **Bosses test the full run build.** Each region ends in a boss. The fourth boss completes the expedition.
- **Permanent power is bounded.** Research improves future starts but does not replace run decisions.

## 3. Core loop

```text
Command → Pack force → Choose route → Auto-battle → Choose protocol
    ↑          ↓              ↓              ↓             ↓
 Research   Equip gear    Risk/reward     Observe why   Rebuild/continue
```

1. Start an expedition with a 500-point command limit.
2. Choose units from the available roster.
3. Place them inside the 6×5 case. Units occupy 1×1 through 3×2 footprints.
4. Choose one available route contact.
5. Make any final formation or equipment changes.
6. Watch the battle resolve automatically.
7. On victory, receive run data, War Chests, possible gear, and one of three protocols.
8. Continue through three contacts and a boss.
9. Enter the next region with a larger point limit and newly available heavy units.
10. Finish the fourth boss or lose all campaign hull.
11. Spend banked War Chests on permanent research.

## 4. Expedition structure

There are four regions in one full run:

| Region | Name | Base point limit | New scale |
|---|---|---:|---|
| 1 | Ashen Approach | 500 | Infantry, guard, medic, artillery |
| 2 | Glass Trench | 900 | Breaker units |
| 3 | Iron Pilgrimage | 1,400 | Heavy engines |
| 4 | Null Citadel | 2,000 | Titan-class units |

Each region contains three route contacts followed by a boss. Current contact types:

- **Skirmish:** safer battle and standard data.
- **Salvage:** moderate battle with increased gear opportunity.
- **Elite:** dangerous battle with guaranteed gear.
- **Recovery:** no battle; restore one campaign hull and gain a small amount of data.
- **Boss:** highest threat, larger rewards, and passage to the next region.

The current map presents two or three choices at the active depth. Selecting one closes the alternatives. Completed contacts remain visible behind the player.

## 5. Resources

### Command points

Command points cap the deployed force. A force must cost at least one point and may not exceed the region limit. Expanded Mandate research adds 50 starting points per rank to every regional limit.

### Case space

The deployment case is six columns by five rows. Units cannot overlap or extend outside it. Rotation swaps width and height. The left two columns are treated as the front; the right side is the safer backline.

### Campaign hull

A run begins with three hull. Losing a battle removes one. At zero hull the expedition ends. Recovery contacts restore one hull up to the maximum. Hull Insurance research adds one maximum hull per rank.

### Run data

Run data is a score and future content hook earned during the current expedition. It resets after the run.

### War Chests

War Chests are permanent research currency. Battles accumulate them inside the run; all accumulated chests are banked on victory or defeat. Salvage Rights research increases the amount earned.

## 6. Units and force construction

| Unit | Role | Cost | Footprint | Region | Function |
|---|---|---:|---:|---:|---|
| Needle Team | Striker | 100 | 1×1 | 1 | Fast damage; front-line bonus |
| Bastion Cohort | Guard | 160 | 1×2 | 1 | High health, armor, and threat |
| Chirurgeon | Support | 140 | 1×1 | 1 | Repairs the most injured ally |
| Hexgun Battery | Artillery | 210 | 2×1 | 1 | Strong but fragile ranged damage |
| Rammer Lance | Breaker | 280 | 2×1 | 2 | Bonus damage against armored targets |
| Bulwark Engine | Heavy | 420 | 2×2 | 3 | Large mobile fortress |
| Null Colossus | Titan | 500 | 3×2 | 4 | Extremely durable high-damage centerpiece |

Roster stock limits prevent unlimited copies. Unlock regions make the expanding point limit meaningful: later regions support both more small units and larger units.

## 7. Spatial formation rules

- Enemy targeting usually prioritizes Guards and Heavy units.
- Otherwise, hostile AI tends to attack the leftmost/frontmost deployed unit.
- Needle Teams in the front two columns deal bonus damage.
- Cohesion Field grants armor to units placed near another unit.
- Formation coordinates persist between contacts until the player changes them.
- One piece of gear can be equipped to each deployed unit.

The desired future direction is to add more adjacency, row, shape, and facing synergies without making the grid unreadable.

## 8. Automatic combat

Combat progresses in rounds. Units act in initiative order, with minor randomization among similar speeds.

Per action:

1. A Support unit repairs the most injured ally if one needs help.
2. Otherwise, the unit selects a target according to threat and front position.
3. Damage varies slightly, then armor is subtracted.
4. Role bonuses and protocols modify the result.
5. A unit at zero health is destroyed unless Last-Light Vow prevents its first lethal hit.

All enemies destroyed means victory. All player units destroyed, or reaching the safety round limit without victory, means defeat. The player cannot issue combat orders. Available controls are ×1/×2 speed and immediate resolution.

## 9. Temporary run protocols

After each battle victory, the player chooses one of three protocols. Protocols stack and last until the expedition ends.

Current protocol families:

- Global damage and health.
- Per-round regeneration.
- Improved support healing.
- Artillery specialization.
- Adjacency armor.
- Guard durability.
- Opening artillery volley.
- Once-per-battle lethal-hit protection.

Protocols are the main run-to-run build layer. Never make these permanent research purchases.

## 10. Gear

Gear drops from some normal contacts and is favored by salvage, elite, and boss contacts. Current effects include health, damage, armor, healing, and initiative.

Gear belongs to the current expedition and is erased when it ends. In preparation, select a packed unit and then tap a gear item to equip or unequip it. Each unit may carry one item.

## 11. Permanent research

War Chests buy persistent research in the R&D Array:

- **Expanded Mandate:** +50 command points to each regional limit per rank.
- **Veteran Doctrine:** +5% unit damage per rank.
- **Salvage Rights:** +15% War Chests earned per rank.
- **Hull Insurance:** +1 campaign hull per rank.

Research and aggregate run statistics are stored in browser `localStorage`. The active run is also stored and can be resumed from the command screen.

## 12. UX rules

- At every screen, make the next meaningful decision visually dominant.
- Show both used and maximum points during preparation.
- Locked units state the region that unlocks them.
- Every unit card states cost, footprint, role, stock, and tactical purpose.
- Route nodes show contact type and expected reward before commitment.
- Combat must explain important events through a compact live log.
- Temporary and permanent upgrades must never use ambiguous language.
- No gameplay interaction may depend on hover.

## 13. Visual direction

The locked visual specification is in `ART_BIBLE.md`. The current implementation uses crisp HTML/CSS pixel forms rather than external artwork so it remains fast and consistent.

Functional color hierarchy:

- Cyan: player action, selection, and navigation.
- Amber: points, rewards, timers, and caution.
- Red: hostile threats and damage.
- Green: repair, health, and recovery.
- Violet: protocols, rare systems, and elite content.

## 14. Code architecture

```text
FTL/
├── index.html              # All game screens and dialogs
├── css/main.css            # Portrait layout and luminous pixel art system
├── js/main.js              # DOM-ready entry point
├── js/core/Game.js         # Run state, grid packing, map, combat, rewards, saves
├── js/data/units.js        # Units, gear, protocols, regions, research
├── ART_BIBLE.md            # Locked visual rules
├── ggd.md                  # This design and handoff document
├── README.md               # Setup and short feature summary
└── vercel.json             # Vercel configuration
```

Legacy Three.js ship files remain in the repository for reference but are no longer imported by the current game.

## 15. Local development

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:4173`.

Validation:

```powershell
npm run check
npm run build
npm run preview
```

## 16. Validation checklist

- The command screen explains the complete loop in under four steps.
- New run opens the 500-point preparation screen.
- Unit selection plus an empty grid cell places the correct footprint.
- Rotation changes the footprint and collision test.
- Units cannot overlap, exceed the case, exceed stock, or exceed points.
- A legal force can return to the map and select a route.
- All combat actions run without player commands.
- Speed and resolve controls complete a battle safely.
- Victory offers exactly three available protocols when possible.
- Gear can be equipped to a selected deployed unit.
- Boss victory advances the region and point limit.
- Region 4 boss victory completes the run.
- Defeat removes hull and eventually ends the run.
- War Chests persist and research purchases apply correctly.
- An active run survives page reload.
- Layout remains fully usable at 360×640 and the 480×854 reference size.
- Browser console has no errors.

## 17. Next development priorities

1. Add deterministic seeded route and reward generation.
2. Add drag-and-drop placement with tap placement retained as the accessible fallback.
3. Add formation-specific traits, faction keywords, and set bonuses.
4. Add boss-specific combat rules and readable telegraphs.
5. Add unit damage/recovery that persists between contacts.
6. Add a post-battle breakdown explaining damage, healing, and protocol value.
7. Add sound, reduced-motion settings, and optional haptics.
8. Replace procedural CSS silhouettes with original sprite sheets only when a complete consistent batch is available.

## 18. Content and IP constraint

The game may draw on the general design language of tabletop point budgets, spatial inventory games, route-based roguelikes, and auto-battlers. Do not copy names, factions, characters, unit silhouettes, interface layouts, lore, text, icons, or artwork from Warhammer 40,000, Alchemortis, Mecharashi, or any other commercial game.
