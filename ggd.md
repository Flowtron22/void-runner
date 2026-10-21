# COMBAT PATROL — 40K Roguelike Campaign GDD

This is the authoritative gameplay and implementation handoff. Read it with `ART_BIBLE.md` before editing the project.

## 1. Clear design statement

The game is now a portrait-first 40K-inspired army-building roguelike with automatic dice combat and a star-driven sector campaign.

Last handoff update: 21 October 2026. Campaign and map implementation baseline: `6dc3304`.

This file describes the current code and records unfinished work explicitly. Start with section 15 when continuing on another PC. Do not restore the superseded spaceship game or the old campaign that increased points after each warzone.

```text
Main Menu: Play / Settings / Credits
    ↓
Choose campaign scale: 500 / 1000 / 1500 / 2000 / 3000 points
    ↓
Choose launch faction: Ultramarines / Imperial Fists / Grey Knights
    ↓
Choose one opening Battle Honour
    ↓
Galaxy sector map
    ↓
Connected area map: choose one of three star-rated battles
    ↓
Manual deployment → automatic visible-dice battle
    ↓
Post-War Affairs: choose a segment
    ↓
Requisition / three Honours / three Stratagems / recruit / store
    ↓
Collected stars unlock stronger sector boss tiers
    ↓
Secure every sector; bank permanent Requisition
```

Campaign base scales are 500, 1000, 1500, 2000 and 3000 points. They contain 4, 5, 6, 7 and 8 sectors respectively. Higher scales also lengthen each sector, multiply enemy strength and increase permanent boss rewards. The selected scale stays fixed; Expanded Supply research adds 50 deployable points per rank and Rapid Muster adds 100 points for that run.

Each normal area presents exactly three connected choices rated one, two and three stars. Victory adds that rating to both the current sector and total campaign star counts. At the end of a sector, boss tier 1 is always available; boss tiers 2 and 3 require progressively more sector stars. A boss tier multiplies both threat and permanent reward.

Both navigation views are literal galaxy charts, not vertical skill trees. The sector view places named planets across a star field and joins them with charted travel lanes. The area view is a local constellation: the entry beacon, previously secured planets, three currently reachable systems and the distant boss signal occupy spatial coordinates connected by luminous routes.

Post-War Affairs is a two-stage interaction. First, the player chooses an event segment: Requisition, Battle Honours, Stratagems and—when generated for that area—Reinforcements or Field Store. Requisition resolves immediately. Honour and Stratagem segments then open three concrete choices; the player takes one. Reinforcement and Store segments open their own unit/item selections. The player completes one segment per battle.

Post-War rewards are run-only unless explicitly labeled permanent:

- **Requisition:** currency spent in an occasional field store.
- **Battle Honour:** passive army rule for the current run.
- **Stratagem:** automatic command modifier for the current run.
- **Reinforcement signal:** occasionally unlocks one of the faction's two unrecovered unit patterns.
- **Field store:** occasionally offers three Wargear items for campaign Requisition.

Only the first two unit patterns in the chosen faction's JSON are available at campaign start. Reinforcement events can unlock the other two. Unit stock limits still apply, and the full 6×5 grid remains available from the start.

- **40K supplies the army layer:** factions, units, points, models, Toughness, Saves, Wounds, Invulnerable Saves, weapon Attacks, Hit values, Strength, AP and Damage.
- **The KS project supplies the data and dice model:** compact game data is derived from `D:/Projects/Minigames/KS/solo-lab/public/armies`, and attack resolution follows the KS sequence.
- **The roguelike supplies the campaign wrapper:** choose areas, collect stars, select a sector boss tier and gain temporary Honours, Stratagems, recruits and Wargear. Boss rewards become permanent Requisition when the run ends.

The previous original unit roster and flat-damage combat are no longer active.

## 2. Mandatory presentation

- Portrait-first reference frame: 480×854.
- Desktop keeps the game inside a centered portrait command board.
- The global visual direction follows the KS project's tactile grimdark command-table language: soot-black iron, aged bone, brass, oxblood, restrained military typography, and original gothic-industrial motifs.
- No interaction depends on hover.
- Minimum touch target is 40 CSS px.
- Active screens use symbols, stat chips and numbers before prose. Full rule names live in tooltips and Help.
- Never repeat the same instruction in a heading, paragraph and action label.

## 3. Player flow

```text
Choose scale → faction → first Honour → sector → area → deploy → auto-battle → Post-War Affairs → boss tier
```

## 4. Campaign structure

The player chooses one base points scale for the entire run. Clearing sectors does not increase it; research and the Rapid Muster Honour can increase the actual deployment allowance.

| Scale | Sectors | Areas per sector | Enemy multiplier | Boss permanent reward |
|---|---:|---:|---:|---:|
| 500 Patrol | 4 | 3 + boss | 1.00× | 30 per tier |
| 1,000 Strike Force | 5 | 4 + boss | 1.08× | 45 per tier |
| 1,500 Battle Host | 6 | 4 + boss | 1.16× | 60 per tier |
| 2,000 Onslaught | 7 | 5 + boss | 1.24× | 80 per tier |
| 3,000 Apocalypse | 8 | 6 + boss | 1.34× | 110 per tier |

Every area layer exposes three connected battle choices worth 1–3 stars. Enemy faction and star rating are visible before deployment. Choosing one area closes the other two choices at that layer. Recruit/store signals are determined by sector, step and lane. Enemies and reward choices use random selection; the run's `seed` is stored but does not currently drive a seeded random generator.

The area difficulty multiplier is `(0.62 + stars × 0.14 + step × 0.035) × enemyScale`, with a zero-based step. Enemy force generation targets at least 150 points, otherwise the deployed player army's points multiplied by difficulty. It fills toward 85% of that target, with discrete unit-cost overshoot and a 20-unit safety limit; this is not an exact opposing points budget.

Boss tiers use these unlock thresholds, where `depth` is the number of regular areas in the sector:

| Boss | Required sector stars | Difficulty multiplier | Permanent reward |
|---|---:|---|---|
| Warlord, tier 1 | 0 | `1.22 × enemyScale` | Base reward × 1 |
| Champion, tier 2 | `depth + 1` | `1.44 × enemyScale` | Base reward × 2 |
| Apex Commander, tier 3 | `depth × 2` | `1.66 × enemyScale` | Base reward × 3 |

Stars unlock choices; they are not spent. Boss victory also awards its tier in stars. The first enemy unit becomes the boss, gains an HP multiplier of `1.25 + tier × 0.2`, and gains one Attack per model. Finishing the boss's Post-War segment secures the sector and unlocks the next one. Finishing the last sector ends the campaign.

The sector chart uses fixed planet coordinates and travel lanes. The area chart draws the entry beacon, completed route, three current systems and distant boss signal. The current implementation still advances by layers; it is not yet a persistent free-form territory network with all adjacent areas visible.

## 5. Factions and JSON data

The runtime fetches `public/data/warhammer-roster.json`. It is a compact, deployment-safe derivative of the KS army JSON rather than a second manually invented ruleset.

Only these three factions are selectable at launch:

- Ultramarines (`space-marines` internally; preserve this ID for saves and GIF mapping).
- Imperial Fists (`imperial-fists`).
- Grey Knights (`grey-knights`).

The full data roster contains 19 factions and 76 units. All other factions remain available to the enemy generator:

- Ultramarines
- Orks
- Tyranids
- Imperial Knights
- Grey Knights
- Adeptus Custodes
- Astra Militarum
- Death Guard
- Eldar
- Harlequins
- Imperial Fists
- Kroot Ravagers
- Adeptus Mechanicus
- Necrons
- Adepta Sororitas
- Space Wolves
- T'au Ground Patrol
- T'au Drone Patrol
- Thousand Sons

Current units include:

- Intercessor Squad, Terminator Squad, Redemptor Dreadnought and Captain.
- Boyz, Meganobz, Deff Dread and Warboss.
- Termagants, Tyranid Warriors, Screamer-killer and Winged Tyranid Prime.
- Armiger Helverin, Armiger Warglaive, Knight Paladin and Acastus Knight Asterius.

Each compact unit record retains:

```json
{
  "name": "Knight Paladin",
  "points": 375,
  "size": [3, 2],
  "models": 1,
  "keywords": ["Vehicle", "Walker", "Titanic", "Character", "Imperium", "Imperial Knights"],
  "leadership": 6,
  "oc": 10,
  "abilities": ["Code Chivalric", "Seasoned Noble"],
  "defense": {
    "toughness": 11,
    "save": 3,
    "wounds": 26,
    "invuln": 5
  },
  "weapon": {
    "name": "Rapid-fire Battle Cannon",
    "range": 72,
    "attacks": "D6+3",
    "hit": 3,
    "strength": 10,
    "ap": -1,
    "damage": "3",
    "keywords": ["Blast", "Rapid Fire D6+3"]
  }
}
```

The source metadata records the KS path and pinned BSData snapshot. This is a personal prototype and not tournament certification.

## 6. Army building

The selected faction determines the available roster. A deployed army must satisfy both constraints:

1. Total unit points cannot exceed the current deployment allowance.
2. Unit footprints cannot overlap or extend beyond the 6×5 deployment grid.

Units may be rotated. Stock limits restrict duplicates. Unrecovered units and units costing more than the deployment allowance remain visible but locked. A Leader is attached to an eligible deployed Bodyguard and shares its grid position; it is not independently placed.

The selected army composition persists between battles. Combat fighters are rebuilt at full model count and wounds for each battle; unit deaths do not permanently delete the deployed formation. Defeat costs one campaign attempt, leaves the selected area pending, and opens deployment for a retry. A run starts with three attempts plus Campaign Reserve ranks.

## 7. Automatic D6 combat

The player does not issue orders during combat. Available controls are playback speed and immediate resolution.

Every unit attacks once per round while it has surviving models. An attack uses the following visible sequence:

### 7.1 Attacks

For every surviving weapon bearer, resolve the weapon’s Attacks characteristic. Flat values and expressions such as `D6`, `D3`, and `D6+3` are supported.

### 7.2 Hit rolls

Roll one D6 per attack.

- A natural 1 always fails.
- A result equal to or greater than the weapon’s Hit value succeeds.
- Battle Honours and permanent training can improve the required value.
- A natural 6 may trigger Lethal Hits or Sustained Hits.

### 7.3 Wound rolls

Compare weapon Strength to target Toughness:

| Comparison | Required roll |
|---|---:|
| Strength at least double Toughness | 2+ |
| Strength greater than Toughness | 3+ |
| Strength equals Toughness | 4+ |
| Strength lower than Toughness | 5+ |
| Strength half Toughness or less | 6+ |

A natural 1 always fails.

### 7.4 Saving throws

The target rolls one D6 per wound. AP worsens the armour save. If an Invulnerable Save is better, it is used instead.

Example: a 3+ Save hit by AP -2 becomes a 5+ armour save. A 4+ Invulnerable Save would therefore be used.

### 7.5 Damage

Every failed save resolves the weapon’s Damage expression. Damage is allocated to the already wounded model first. Excess normal damage does not spill from a destroyed model to another model.

Feel No Pain rolls, when active, are rolled per lost wound.

### 7.6 Battle end

- Destroy every opposing model to win.
- Lose every deployed model to lose one campaign attempt.
- A safety limit ends stalled battles after 30 rounds.

The battle UI reveals the most recent attack in five timed stages: Attacks, Hits, Wounds, Saves and Damage. At normal speed each stage remains visible for about 520 ms; fast speed uses about 190 ms. Dice tumble and settle with staggered timing. Completed stages stay visible, future stages remain obscured, and damage is not applied until the Damage stage appears. `Resolve now` bypasses presentation but uses the same prepared rolls and rules result.

### 7.7 Tabletop rules fidelity

The KS `wh40k-11e` snapshot is the source of truth. The campaign implements a rule only when its required condition exists in the automated battlefield. It never silently invents eligibility.

- Unit profiles carry Keywords, Leadership, Objective Control, named abilities, weapon range, and numeric weapon keywords.
- Supported weapon rules: Blast, Torrent, Devastating Wounds, Melta X, Rapid Fire X, Twin-linked, Sustained Hits X, Lethal Hits and Anti-Infantry/Monster/Vehicle X+.
- Assault, Heavy, Pistol, Ignores Cover, Precision, Hazardous and movement-dependent rules remain descriptive until their required movement, visibility, cover, allocation, or hazard systems exist.
- Round 1 is the explicit `LONG RANGE` band. Round 2 onward is `HALF RANGE`; this is the campaign's disclosed abstraction for range-dependent rules.
- Leaders attach during deployment: select the Leader and tap an eligible deployed Bodyguard. The Leader cannot be targeted until its Bodyguard is destroyed. A Bodyguard receives only effects explicitly defined by its Leader profile.
- Both armies gain 1 CP at the start of a battle round, to a campaign cap of 5. Automation may use one Command Re-roll per side per round. Battle-shocked units cannot receive it.
- Below-half-strength units take Battle-shock tests against Leadership in the Command phase. Synapse units roll 3D6. Insane Bravery is automated once per battle when eligible; Shadow in the Warp triggers automatically in round 2 when present.
- Objective Control is stored and shown in the roster but has no battle effect until objective markers and scoring are added.
- Oath of Moment selects the highest-current-wounds enemy each Command phase and enables failed Hit re-rolls against it.

This is not yet a complete tabletop simulator. Movement, line of sight, terrain, objective scoring, explicit shooting/fight phases, manual Stratagem timing, attached-unit wound allocation, and full faction/detachment libraries are required before a literal 1:1 claim is valid.

## 8. Target selection

Combat currently uses a simple automatic targeting rule:

- Player units attack the enemy unit with the lowest remaining wounds.
- Enemies prioritize the player unit nearest the front line, then the most injured.

Formation therefore affects which player unit is attacked first, while roster and dice determine the exchange.

## 9. Battle Honours

Setup offers three random Battle Honours and the player chooses one before entering the galaxy map. After a victory, entering the Battle Honours segment opens up to three unowned Honour choices. The player selects one, completing that area's Post-War Affairs. Honours last only for the active campaign.

Current effects include:

- +1 to Hit rolls.
- +1 to Wound rolls.
- Improved Saves.
- Recover wounds after every battle round.
- Lethal Hits on natural sixes.
- Sustained Hits on natural sixes.
- 6+ Invulnerable Saves.
- Feel No Pain 6+.
- +100 Army Points for the current campaign.

## 10. Wargear

The Field Store segment offers three random Wargear items priced at 20, 30 and 40 campaign Requisition. A player can buy one item or continue without buying; either completes that segment. Supply, Elite and Boss victories no longer automatically award Wargear.

To equip owned Wargear, select a deployed unit and then choose an item in the gear tab. One item may be equipped per deployed unit.

Current Wargear modifies Hit rolls, Saves, Toughness, Attacks or Invulnerable Saves. Wargear disappears when the campaign ends.

## 11. Persistent progression

There are two separate Requisition balances:

- `run.currency`: temporary currency collected through the Requisition segment or Field Cache Stratagem and spent at field stores. Requisition awards are `round((18 + stars × 8) × (1 + salvage rank × 0.15))`.
- `meta.currency`: permanent currency. At campaign end, add all secured boss rewards (`run.chests`) plus `floor(run.currency × 0.25)`, on either victory or defeat.

Battle score (`run.data`) is separate from both balances. Regular victories award `20 + stars × 10`; bosses award `90 × boss tier`. Score has no spending mechanic.

Permanent upgrades:

- **Expanded Supply:** +50 Army Points per rank.
- **Veteran Training:** Rank 1 improves Hits, Rank 2 improves Wounds, Rank 3 grants Feel No Pain 6+.
- **Requisition Rights:** increases earned Requisition.
- **Campaign Reserve:** adds campaign attempts.

The research definitions and purchase methods remain in the code, but the current Play / Settings / Credits menu does not expose the Armoury screen. Existing saved research still applies. Restoring an intended upgrade entry point is follow-up work.

Meta progression and the active campaign are stored in browser `localStorage`:

| Key | Contents |
|---|---|
| `void-runner-40k-campaign-v2` | Permanent currency, research, run/win counters and reduced-motion setting |
| `combat-patrol-active-v3` | Active faction, scale, deployment, route, rewards and inventories |

Git transfers source and assets, not browser saves. Another PC, browser profile or origin starts with its own progress. Localhost and the production domain also have separate saves. No cloud save or save export/import UI exists yet. Old v2 active-run saves are not loaded by the current v3 campaign.

## 12. Source architecture

```text
FTL/
├── index.html
├── css/main.css
├── public/data/warhammer-roster.json  # Compact KS-derived data
├── js/main.js                         # Loads JSON, starts game
├── js/core/Game.js                    # Campaign, builder and D6 engine
├── js/data/units.js                   # Campaign tiers, sectors, Honours, Stratagems, Wargear, research
├── gif/                              # Active faction animations and unused future battle assets
├── assets/unit-silhouettes.png        # Shared portrait atlas
├── package-lock.json                 # Reproducible dependency versions
├── vercel.json                       # Vite build and dist output
├── ART_BIBLE.md
├── ggd.md
└── README.md
```

`js/main.js` fetches the compact roster from `/data/warhammer-roster.json` and constructs `Game`. `window.voidRunner` exposes that instance for local debugging. `Game.js` currently owns the UI, campaign and battle engine; there is no backend. Legacy Three.js spaceship files remain unimported reference material.

Important methods for continued work:

| Responsibility | Methods |
|---|---|
| Setup and saves | `beginSetup`, `renderSetup`, `startRun`, `resumeRun`, `save` |
| Galaxy navigation | `renderSectors`, `enterSector`, `makeOffers`, `renderMap`, `advanceRoute` |
| Formation | `renderLoadout`, `placeUnit`, `attachLeader`, `equipGear` |
| Dice and simulation | `startBattle`, `prepareDiceAttack`, `applyDiceAttack`, `commandPhase` |
| Post-War segments | `openRewards`, `selectPostWarSegment`, `claimPostWarChoice`, `completePostWarSegment` |
| Recruit/store | `openRecruitEvent`, `openStoreEvent`, `finishPostWarEvent` |

## 13. Development and validation

```powershell
npm ci
npm run check
npm run build
npm run dev
```

Required checks:

- The three launch factions are selectable; all 19 roster factions load from JSON.
- Point totals match deployed units.
- Locked units explain their required limit.
- Grid collision, rotation and stock limits work.
- Mission nodes show the enemy faction.
- Attack, Hit, Wound, Save and Damage dice render correctly.
- Strength/Toughness thresholds follow the table above.
- AP and Invulnerable Saves choose the better valid save.
- Damage does not spill between models.
- Battle Honours change the specified roll or characteristic.
- Wargear equips to one selected deployed unit.
- Setup offers all five point scales and the chosen base scale persists through every sector.
- Both maps use spatial galaxy charts; the three reachable areas have distinct positions.
- Post-War Affairs opens category segments before actual Honour or Stratagem choices.
- Recruitment unlocks a pattern and stores charge the shown temporary currency.
- Stars unlock boss tiers without being consumed; boss victory unlocks the next sector.
- Requisition and permanent upgrades persist.
- Active campaigns resume after reload.
- The browser console reports no errors.

## 14. Stratagems, battle art and unfinished work

These run-only Stratagems supplement automatic core Command Re-roll and Insane Bravery:

| Stratagem | Implemented effect |
|---|---|
| Command Relay | +1 starting CP per battle |
| Orbital Mark | +1 to Hit during round 1 |
| Reserve Wave | Recover one attempt after securing a sector boss |
| Auspex Grid | +1 to Wound during round 1 |
| Field Cache | Gain 20 campaign Requisition when first acquired |
| Armour Doctrine | Declared as round-1 Save improvement; effect is not yet consumed by combat |

Desktop battle GIFs are mapped by faction in `BATTLE_ART`. Ultramarines use `spacemarine_A.gif`, Grey Knights use `greyknight_A.gif`, and Imperial Fists use `imperialfist.gif`. The GIF theater appears during battle at widths of 1100 px and above. It flips artwork toward the center, fires background beams, flashes on impacts, shakes on heavy hits, and dissolves the defeated side. Unit cards have rupture/death effects. Reduced motion is available in Settings and also respects the operating-system preference.

The 4×4 silhouette atlas contains 16 archetypes. Many additional factions reuse mapped or deterministic fallback portraits; distinct art for every unit is not complete. The eight additional GIFs supplied locally are stored in `gif/` for future work: `BOSS_Lord_Invocatus.gif`, `BOSS_hive_tyrant.gif`, `WAAAlintine.gif`, `doom_scythe.gif`, `eldar_BlackHeartRaider.gif`, `night_haunt.gif`, `noise_flamer.gif`, and `ork_stompa.gif`. They are not currently referenced by `BATTLE_ART`.

Known follow-ups identified from the current source:

1. **Post-War reload recovery:** `rewardContext` is saved, but `resumeRun()` checks `pendingNode` first and can reopen deployment for a won battle instead of restoring its reward selection. Persist and restore the current reward/event substep before claiming robust resume support.
2. **Deployment return before sector entry:** the galaxy screen allows Edit Army while `region` is null. `finishPrep()` then calls `renderMap()`, which expects a selected sector. Return to the sector chart when no sector is active.
3. **Armour Doctrine:** wire `openingSave` into the defending player's first-round save calculation.
4. **Upgrade access:** restore an intentional Armoury entry point and bind its Back action; the screen currently exists without menu wiring.
5. **Galaxy layout:** develop the spatial charts into a persistent territory/adjacency map closer to the supplied reference. Current area progression still follows layers, and most future systems are hidden.
6. **Exhausted reward pools:** fewer than three unowned Honours/Stratagems produce fewer choices; exhausted pools fall back to owned choices that may provide no benefit. Add meaningful replacements.
7. **Higher-point army growth:** four patterns, stock limits and the 6×5 grid can prevent using the full 2000/3000-point allowance. Expand the roster or define point-scale stock/grid rules before treating those scales as balanced.
8. **Presentation:** enlarge tiny galaxy labels at phone widths and expand unique unit silhouettes. Maintain the user's preference for concise text and clear icons.

Further expansion can add multiple weapon loadouts, explicit shooting/melee phases, terrain/cover, objective scoring, faction-specific rewards and damage-contribution breakdowns. Supported dice rules listed in section 7 must not be re-added as if missing.

## 15. Continue on another PC

The repository is `https://github.com/Flowtron22/void-runner`, branch `main`. The GitHub name is historical; the in-game title is COMBAT PATROL.

```powershell
git clone https://github.com/Flowtron22/void-runner.git
cd void-runner
npm ci
npm run check
npm run build
npm run dev
```

Open the Local URL printed by Vite (normally `http://127.0.0.1:4173/`). Use an installed Node version satisfying Vite 7's engine constraint in `package-lock.json` (Node 22.12+ is suitable). The former absolute project folder is not a runtime dependency. The local KS project is required only when re-extracting source data; the checked-in compact JSON runs independently.

Tell the next coding agent: "Read ggd.md, README.md and ART_BIBLE.md, inspect git status, then continue the current COMBAT PATROL campaign. Preserve the three launch factions, points-scale setup, category-first Post-War Affairs and galaxy-map direction. Read the known follow-ups before claiming completion."

All referenced runtime images, GIFs, source and the dependency lockfile belong in Git. `node_modules/`, `dist/`, `.env*` and `.vercel/` are intentionally ignored and must be regenerated or configured locally. Vercel CLI authentication/project linkage is machine-specific; do not commit tokens or copy `.vercel` as a substitute for relinking. Existing deployment configuration builds with `npm run build` and serves `dist/`.

Production URL at handoff: `https://combatpatrol.vercel.app`. The last gameplay release was `6dc3304`. This handoff updates documentation and tracks additional future GIF assets; it does not resolve the known gameplay follow-ups above.
