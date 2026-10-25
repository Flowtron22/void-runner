# COMBAT PATROL — 40K Roguelike Campaign GDD

This is the authoritative gameplay and implementation handoff. Read it with `artstyle.md` before editing the project.

## 1. Clear design statement

The game is now a portrait-first 40K-inspired army-building roguelike with automatic dice combat and a star-driven sector campaign.

Last handoff update: 24 October 2026. The persistent WebGL command terminal and its CRT safe area are the presentation baseline; the command deck remains the campaign's stable navigation hub.

This file describes the current code and records unfinished work explicitly. Start with section 15 when continuing on another PC. Do not restore the superseded spaceship game or the old campaign that increased points after each warzone.

```text
Main Menu: Start / Resume / Settings / Credits
    ↓
Choose unit size: Combat Patrol 500 / Incursion 1000 / Strike Force 2000 / Onslaught 3000
    ↓
Take Your Oath: Grey Knight available / Ultramarine locked / Imperial Fist locked
    ↓
Ordo Malleus command transmission
    ↓
Patrol vessel VIGILANT — recurring command hub
    ├── Ordeal: edit and deploy the army
    ├── Research: buy permanent upgrades
    └── Operation: select or resume a contract
              ↓
          Galaxy sector map
              ↓
          Inquisitorial directive briefing
    ↓
Connected sector chart: travel to a reachable star-rated system
    ↓
Manual deployment → automatic visible-dice battle
    ↓
Post-War Affairs: clear every generated claim
    ↓
Requisition / Enhancement / Stratagem / optional Wargear / optional Recovery
    ↓
Collected stars unlock stronger sector boss tiers
    ↓
Sector boss secured → return to the VIGILANT hub
    ↓
Secure every sector; bank permanent Requisition
```

Selectable campaign sizes are 500, 1000, 2000 and 3000 points. They contain 4, 5, 7 and 8 sectors respectively. Higher sizes multiply enemy strength and increase permanent boss rewards. Every new sector now has three regular battles followed by one final system; point scale changes the number of sectors, not chart density. The selected size stays fixed; Expanded Supply research adds 50 deployable points per rank and Rapid Muster adds 100 points for that run. The older 1500-point tier remains in data only so existing saves can still load.

Each sector reveals its entire saved route chart: three systems per battle layer, a starting beacon and one final destination. A new sector has eleven visible beacons in total. Systems carry one, two or three large difficulty stars. The first layer is reachable from the start; later travel follows links to the next layer, with the same or neighbouring lane reachable. Future systems glow grey until reachable. Victory adds that rating to both the current sector and total campaign star counts. At the end of a sector, boss tier 1 is always available; boss tiers 2 and 3 require progressively more sector stars. A boss tier multiplies both threat and permanent reward.

Both navigation views are interactive Three.js charts, not vertical skill trees. The sector view places named stellar signals in a navigable three-dimensional star field. Selecting a signal performs a camera approach before opening its directive. The area view loads a distinct local chart with deeper dust, a strike-cruiser marker, every sector system and dashed route links. Future beacons retain grey emission. DOM labels remain projected over the WebGL scene for crisp text, keyboard use, and screen-reader access.

Post-War Affairs is a multi-claim interaction. Every victory generates three to five claim blocks according to threat, route, and mission type. Requisition, Enhancement, and Stratagem appear once. Richer rewards add Wargear Cache and Force Recovery. Requisition resolves immediately; choice blocks open three concrete options and accept one. Each block disappears after its single claim. The player must clear every generated claim and any special route event before continuing the path.

Post-War rewards are run-only unless explicitly labeled permanent:

- **Requisition:** temporary campaign currency used during the active run.
- **Enhancement:** passive army-wide rule for the current run.
- **Stratagem:** distinct situational or opening-round command effect for the current run.
- **Wargear Cache:** one item selected from three and assigned later during deployment.
- **Force Recovery:** restores one campaign attempt, or grants temporary Requisition when already at full strength.
- **Distress signal:** victory rescues a random Imperial unique unit or epic hero for the entire mission (the selected campaign across all sectors). Rescues enter Ordeal at one stock, use their existing roster profile and normal points/grid limits, survive sector changes and reloads, and disappear when the mission ends. Older saved reinforcement events still unlock faction patterns.
- **Field store:** occasionally offers three Wargear items for campaign Requisition.

The first two faction patterns are available at campaign start. Grey Knights additionally start with Interceptors, Paladins, Purgation and Purifier squads; existing saves receive these four patterns when Ordeal opens. Reinforcement events can unlock sealed faction patterns, and Distress can rescue their mission-only equivalents. Unit stock limits still apply, and the full 6×5 grid remains available from the start.

- **40K supplies the army layer:** factions, units, points, models, Toughness, Saves, Wounds, Invulnerable Saves, weapon Attacks, Hit values, Strength, AP and Damage.
- **The KS project supplies the data and dice model:** compact game data is derived from `D:/Projects/Minigames/KS/solo-lab/public/armies`, and attack resolution follows the KS sequence.
- **The roguelike supplies the campaign wrapper:** choose areas, collect stars, select a sector boss tier and gain temporary Enhancements, Stratagems, recruits and Wargear. Banked boss rewards become permanent Requisition only after the full campaign is won.

The previous original unit roster and flat-damage combat are no longer active.

## 2. Mandatory presentation

- Portrait-first reference frame: 480×854.
- Desktop keeps the game inside a centered portrait command board.
- One persistent gothic terminal chassis frames every game state. Its physical bezel stays fixed while the active screen changes inside the recessed CRT opening.
- Every `.screen` must use the shared CRT safe-area geometry. Headings, cards, maps, footer actions, dialogs presented as full screens, and scrollable content may never overlap the crest, bezel, grille, or lower hardware.
- Scrolling happens inside the CRT opening. The chassis never scrolls, native scrollbar chrome remains hidden, and the primary return action sits at the bottom of the screen composition without leaving unexplained dead space beneath it.
- Screen changes replace the previous screen completely. A directive, deployment view, or other destination must never reveal buttons or content from the preceding screen behind it.
- The global visual direction follows `artstyle.md`: physical gothic shipboard terminals, blackened iron, aged brass, smoked CRT glass, parchment, wax, localized phosphor emission, painterly portraits, and original ecclesiastical-industrial motifs.
- Major screens must feel installed inside the command vessel rather than arranged as flat webpage cards.
- CRT content uses transparency, localized gradients, screen blending, scan texture, and edge falloff so imagery and controls share one glass plane. Do not place an opaque black canvas or freestanding web panel over the terminal artwork.
- Green, amber, red, and rare cyan emission must come from a believable screen, lamp, lens, signal, or celestial source.
- No interaction depends on hover.
- Minimum touch target is 40 CSS px.
- Active screens use symbols, stat chips and numbers before prose. Full rule names live in tooltips and Help.
- Never repeat the same instruction in a heading, paragraph and action label.

## 3. Player flow

```text
NEW GAME
  → choose unit size
  → choose chapter
  → Ordo Malleus transmission
  → command deck
      Ordeal → edit army → command deck
      Research → permanent upgrades → command deck
      Operation → select contract → mission briefing → area chart
  → choose battle → deployment → automatic battle → clear all Post-War Affairs claims → area chart
  → sector boss → command deck → next contract
```

The command deck is the player's stable home between directives. It presents three direct actions: **Ordeal**, **Research**, and **Operation**. Operation opens either the sector chart or the active operation. Back from the sector chart, active area chart, Ordeal, or Research returns to the command deck. Mandatory battle rewards remain blocking until every generated claim is cleared.

## 4. Campaign structure

The player chooses one base points scale for the entire run. Clearing sectors does not increase it; research and the Rapid Muster Enhancement can increase the actual deployment allowance.

| Scale | Sectors | Areas per sector | Enemy multiplier | Boss permanent reward |
|---|---:|---:|---:|---:|
| 500 Combat Patrol | 4 | 3 + boss | 1.00× | 30 per tier |
| 1,000 Incursion | 5 | 3 + boss | 1.08× | 45 per tier |
| 2,000 Strike Force | 7 | 3 + boss | 1.24× | 80 per tier |
| 3,000 Onslaught | 8 | 3 + boss | 1.34× | 110 per tier |

Every layer contains three systems worth 1–3 stars. All systems and route links are visible from the start. Choosing a system closes the other choices at that layer; only linked systems in the following layer become available. Links converge from every lane on one final system. Arriving there opens a separate boss-tier choice with the collected-star gates; the map never draws three separate bosses. Enemy faction and difficulty are visible before deployment. Distress/store signals are determined by sector, step and lane. Enemy factions are rolled once when the sector chart is created and saved with its topology; reward choices remain random. Existing runs preserve their current offers and visited battles when migrating to the saved chart.

The area difficulty multiplier is `(0.62 + stars × 0.14 + step × 0.035) × enemyScale`, with a zero-based step. Enemy force generation targets at least 150 points, otherwise the deployed player army's points multiplied by difficulty. It fills toward 85% of that target, with discrete unit-cost overshoot and a 20-unit safety limit; this is not an exact opposing points budget.

Entering the final system opens three boss options. Tier 1 is always available; the player may choose any unlocked lower tier even when stronger tiers are available. Three regular battles yield at most nine stars. Boss tiers use these fixed unlock thresholds:

| Boss | Required sector stars | Difficulty multiplier | Permanent reward |
|---|---:|---|---|
| Warlord, tier 1 | 0 | `1.22 × enemyScale` | Base reward × 1 |
| Champion, tier 2 | 5 | `1.44 × enemyScale` | Base reward × 2 |
| Apex Commander, tier 3 | 8 | `1.66 × enemyScale` | Base reward × 3 |

Stars unlock choices; they are not spent. Boss victory also awards its tier in stars. The first enemy unit becomes the boss, gains an HP multiplier of `1.25 + tier × 0.2`, and gains one Attack per model. Finishing the boss's Post-War segment secures the sector and unlocks the next one. Finishing the last sector ends the campaign.

The sector and local charts use fixed three-dimensional coordinates, perspective depth, raycast selection, constrained panning, wheel/pinch zoom, and a camera-travel confirmation. The chart preserves the existing battle-layer pacing while displaying the complete saved network and enforcing its next-layer links; it does not allow backtracking or arbitrary free travel.

### 4.1 WebGL navigation contract

`GalaxyMap3D` provides two modes through one renderer lifecycle:

| Mode | Purpose | Required scene language |
|---|---|---|
| Galaxy | Select an available sector | Sparse large-scale field, compact stellar sector signals, localized emission, projected sector labels |
| Local system | Choose the next battle in an active directive | Distinct deeper field, central star, dust, strike-cruiser marker, three reachable mission systems |

The renderer is imported only when Operation opens so army building, combat and the command deck do not pay the Three.js bundle cost. `Game` remains authoritative for campaign state and supplies destinations, labels, status and selection callbacks. `GalaxyMap3D` owns the scene, camera, raycasting, projection, gestures, animation and cleanup. Camera position is presentation state and is not written to the campaign save.

`TerminalRenderer` is separate from `GalaxyMap3D`. It renders the persistent chassis, screen surface, CRT scan/interference layer, per-screen environmental texture, and selected hardware-style menu controls. The HTML screens remain the semantic and interactive layer above it. The terminal renderer uses screen-style compositing so the display appears emitted through smoked glass rather than pasted onto the bezel. Content screens without a dedicated painting inherit the procedural green-black CRT field.

Navigation behavior is fixed:

- One-finger or mouse drag pans across the chart; wheel and two-finger pinch zoom within authored bounds.
- The camera remains upright and constrained. The minimum zoom still covers the viewport, and no gesture may reveal an empty canvas edge.
- The chart starts far enough below the upper bezel that its title and first navigation marker are never cropped. Its authored composition uses the available lower field instead of reserving a large empty band above the return control.
- Selecting a raycast target or its projected HTML control begins the same destination action. The camera approaches the signal before `Game` opens the next view unless reduced motion is active.
- Labels are DOM controls projected from the same world coordinates as their WebGL signals. They remain keyboard-focusable and readable by assistive technology.
- The starting/current position has a persistent `START POINT` marker. Availability, focus, selected and locked states remain distinguishable without color alone. Locked destinations remain dim stellar signals, not grey spherical buttons.
- Stellar nodes are compact emissive neutron-star-like signals with restrained pulses. Sparse layered gas clouds and dust prevent an empty void while remaining subordinate to labels and route choices.
- Leaving Operation cancels animation and input listeners and disposes the WebGL scene. Returning constructs a fresh view from campaign state.
- If WebGL initialization fails, the static chart treatment and DOM controls remain functional so campaign progress is never blocked by rendering support.

The chart adds spatial presentation without changing route rules. The galaxy shows the sectors already defined by campaign size and completion state. The local view shows every system in the saved sector chart with dashed route links, a current ship marker, grey glowing future destinations, and larger difficulty stars. Free-form backtracking remains outside the current campaign rules.

## 5. Factions and JSON data

The runtime fetches `public/data/warhammer-roster.json`. It is a compact, deployment-safe derivative of the KS army JSON rather than a second manually invented ruleset.

Only these three factions are selectable at launch:

- Ultramarines (`space-marines` internally; preserve this ID for saves and GIF mapping).
- Imperial Fists (`imperial-fists`).
- Grey Knights (`grey-knights`).

The full data roster contains 19 factions and 86 units, including 14 Grey Knights patterns. All other factions remain available to the enemy generator:

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

Units may be rotated. Stock limits restrict duplicates. Unrecovered units and units costing more than the deployment allowance remain visible but locked. A Leader can be placed independently on the deployment grid or attached to an eligible deployed Bodyguard. An attached Leader shares its Bodyguard's grid position and cannot be targeted until that Bodyguard is destroyed.

The selected army composition persists between battles. Combat fighters are rebuilt at full model count and wounds for each battle; unit deaths do not permanently delete the deployed formation. Defeat costs one campaign attempt, leaves the selected area pending, and opens deployment for a retry. A run starts with three attempts plus Campaign Reserve ranks.

## 7. Automatic D6 combat

The player does not issue orders during combat. Available controls are playback speed and immediate resolution.

Every unit attacks once per round while it has surviving models. An attack uses the following visible sequence:

Player rolls use a restrained advantage curve: an initial result of 1 or 2 has a 40% chance to be rerolled once. Enemy rolls use an unmodified D6. This applies consistently to player attacks, saves, Battle-shock dice, Feel No Pain, and Command Re-roll results. It improves the player's expected outcome without guaranteeing success or changing the displayed die range.

### 7.1 Attacks

For every surviving weapon bearer, resolve the weapon’s Attacks characteristic. Flat values and expressions such as `D6`, `D3`, and `D6+3` are supported.

### 7.2 Hit rolls

Roll one D6 per attack.

- A natural 1 always fails.
- A result equal to or greater than the weapon’s Hit value succeeds.
- Enhancements and permanent training can improve the required value.
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

## 9. Enhancements

After every victory, the Enhancement claim opens up to three unowned passive upgrades. The player selects one, the Enhancement block closes, and Post-War Affairs returns so the remaining claims can be resolved. Enhancements last only for the active campaign and are mechanically distinct from Stratagems.

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

The Wargear Cache claim appears in four- and five-claim Post-War rewards and grants one free item chosen from three. A separate Field Store event offers three random Wargear items priced at 20, 30 and 40 temporary Requisition. The player can buy one item or continue without buying; either resolves that event.

To equip owned Wargear, select a deployed unit and then choose an item in the gear tab. One item may be equipped per deployed unit.

Current Wargear modifies Hit rolls, Saves, Toughness, Attacks or Invulnerable Saves. Wargear disappears when the campaign ends.

## 11. Persistent progression

There are two separate Requisition balances:

- `run.currency`: temporary currency collected through the Requisition segment or Field Cache Stratagem and spent at field stores. Requisition awards are `round((18 + stars × 8) × (1 + salvage rank × 0.15))`.
- `meta.currency`: permanent currency. It receives secured boss rewards (`run.chests`) plus `floor(run.currency × 0.25)` only when the player completes every required sector and wins the campaign. A failed campaign awards no permanent Requisition.

Battle score (`run.data`) is separate from both balances. Regular victories award `20 + stars × 10`; bosses award `90 × boss tier`. Score has no spending mechanic.

Permanent upgrades:

- **Expanded Supply:** +50 Army Points per rank.
- **Veteran Training:** Rank 1 improves Hits, Rank 2 improves Wounds, Rank 3 grants Feel No Pain 6+.
- **Requisition Rights:** increases earned Requisition.
- **Campaign Reserve:** adds campaign attempts.

Research is available from the command deck through **Research**. Purchases spend permanent Requisition and apply to future and active campaign calculations as defined by each upgrade.

Meta progression and the active campaign are stored in browser `localStorage`:

| Key | Contents |
|---|---|
| `void-runner-40k-campaign-v2` | Permanent currency, research, run/win counters and reduced-motion setting |
| `combat-patrol-active-v3` | Active faction, scale, deployment, route, rewards and inventories |

The active run also stores its directive briefing state, completed sector directives, partially resolved Post-War claims, pending special events, unlocked units, and equipment assignments. Saves occur after campaign mutations and again when the page is hidden or closed. Saving is silent; there is no progress popup. Refreshing during a pending directive, reward choice, or special event restores that mandatory state instead of skipping it.

Each sector is framed as a sealed Ordo Malleus directive. Selecting a new sector opens a scripted briefing with an objective and authority reward, the area map carries an active-directive tracker, and completed directives are recorded in `run.story`. Portraits and briefing machinery follow `artstyle.md`: painterly environmental character art inside a physical shipboard transmission terminal.

The directive is a dedicated CRT screen, not a modal over the sector map. Accept or Belay replaces the directive screen with its destination; no sector-map footer or previous-page control remains visible behind it. The briefing is centered within the shared CRT safe area, uses the Inquisitorial officer portrait, has no freestanding outer card border, and blends its portrait and transmission field into the same smoked-glass surface.

Accepting a new directive briefly returns to the galaxy with an `ENTERING [SECTOR]` readout and a 1.1-second camera zoom into the selected stellar signal, then opens the local-system chart. Input is blocked during entry. Reduced-motion preferences and unavailable WebGL skip this travel and open the chart immediately. Reviewing an existing directive returns directly to its chart. The faction selection screen is titled `TAKE YOUR OATH` and preserves three tall portrait banners inside the CRT opening.

Git transfers source and assets, not browser saves. Another PC, browser profile or origin starts with its own progress. Localhost and the production domain also have separate saves. No cloud save or save export/import UI exists yet. Old v2 active-run saves are not loaded by the current v3 campaign.

## 12. Source architecture

```text
void-runner/
├── index.html
├── css/main.css
├── public/data/warhammer-roster.json  # Compact KS-derived data
├── js/main.js                         # Loads JSON, starts game
├── js/core/Game.js                    # Campaign, builder and D6 engine
├── js/core/CampaignChart.js           # Saved sector topology, migration and reachability
├── js/render/TerminalRenderer.js      # Persistent WebGL chassis, CRT glass and screen compositing
├── js/render/GalaxyMap3D.js           # WebGL galaxy/local-system renderer and input
├── js/data/units.js                   # Campaign tiers, sectors, Enhancements, Stratagems, Wargear, research
├── gif/                              # Active faction animations and unused future battle assets
├── assets/unit-silhouettes.png        # Shared portrait atlas
├── assets/                         # Runtime maps, portraits, silhouettes and environmental art
├── ref/                            # Checked-in visual study archive; not direct runtime art
├── package-lock.json                 # Reproducible dependency versions
├── vercel.json                       # Vite build and dist output
├── artstyle.md
├── gdd.md
└── README.md
```

`js/main.js` fetches the compact roster from `/data/warhammer-roster.json` and constructs `Game`. `window.voidRunner` exposes that instance for local debugging. `Game.js` currently owns the UI, campaign and battle engine; there is no backend. Legacy Three.js spaceship files remain unimported reference material.

Important methods for continued work:

| Responsibility | Methods |
|---|---|
| Setup and saves | `beginSetup`, `renderSetup`, `startRun`, `resumeRun`, `save` |
| Galaxy navigation | `renderSectors`, `enterSector`, `makeOffers`, `renderMap`, `advanceRoute`; `GalaxyMap3D` owns 3D rendering, projection and gestures |
| Formation | `renderLoadout`, `placeUnit`, `attachLeader`, `equipGear` |
| Dice and simulation | `startBattle`, `prepareDiceAttack`, `applyDiceAttack`, `commandPhase` |
| Post-War segments | `openRewards`, `selectPostWarSegment`, `claimPostWarChoice`, `completePostWarSegment` |
| Rescue/recruit/store | `openDistressEvent`, `distressOffer`, `claimDistressRescue`, `openRecruitEvent`, `openStoreEvent`, `finishPostWarEvent` |

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
- Enhancements change the specified passive roll or characteristic.
- Wargear equips to one selected deployed unit.
- Setup offers 500, 1,000, 2,000, and 3,000-point scales and the chosen base scale persists through every sector. The 1,500-point tier remains data-only for save compatibility.
- Both maps use spatial WebGL scenes; pan, wheel/pinch zoom, raycasting, projected labels, and camera travel work without exposing empty space.
- Galaxy and local-system views have visibly different fields and scale; entering a sector reads as travel inward rather than reuse of one background.
- The local-system screen uses the same heading, status-strip, directive-strip, chart plane, and footer rhythm as sector selection; it does not become a bordered dashboard stacked over the CRT.
- All full screens remain inside the shared CRT safe area at 320, 390, and 480 CSS px widths. Titles are not cropped by the upper bezel, return controls sit at the bottom of the usable composition, and the previous screen is fully absent after navigation.
- The operation directive is a dedicated centered CRT state with the Inquisitorial portrait and no modal backdrop, outer card outline, or underlying sector controls.
- At 320, 390 and 480 CSS px widths, labels stay anchored after pan, zoom, travel and resize, and the starting/current marker remains visible.
- Pointer targets and projected DOM controls select each destination exactly once; keyboard activation follows the same route.
- Reduced motion skips camera flight, WebGL fallback leaves navigation usable, and leaving Operation stops its animation loop and releases the renderer.
- Post-War Affairs generates three to five single-claim blocks, removes each claimed block, and blocks travel until every claim and special event is resolved.
- Distress victory grants one saved random Imperial rescue, deployable in Ordeal for this mission only; older recruitment events unlock a pattern. Stores charge the shown temporary currency.
- Stars unlock boss tiers without being consumed; boss victory unlocks the next sector.
- Requisition and permanent upgrades persist.
- Active campaigns resume after reload.
- The browser console reports no errors.

## 14. Stratagems, battle art and unfinished work

These run-only Stratagems supplement automatic core Command Re-roll and Insane Bravery:

| Stratagem | Implemented effect |
|---|---|
| Command Relay | +1 starting CP per battle |
| Orbital Mark | +1 Attack per model during round 1 |
| Reserve Wave | Recover one attempt after securing a sector boss |
| Auspex Grid | Hit rolls of 5+ automatically wound during round 1 |
| Field Cache | Gain 20 campaign Requisition when first acquired |
| Aegis Protocol | Every unit gains a 5+ Invulnerable Save during round 1 |

Desktop battle GIFs are mapped by faction in `BATTLE_ART`. Ultramarines use `spacemarine_A.gif`, Grey Knights use `greyknight_A.gif`, and Imperial Fists use `imperialfist.gif`. The GIF theater appears during battle at widths of 1100 px and above. It flips artwork toward the center, fires background beams, flashes on impacts, shakes on heavy hits, and dissolves the defeated side. Unit cards have rupture/death effects. Reduced motion is available in Settings and also respects the operating-system preference.

The 4×4 silhouette atlas contains 16 archetypes. Many additional factions reuse mapped or deterministic fallback portraits; distinct art for every unit is not complete. The eight additional GIFs supplied locally are stored in `gif/` for future work: `BOSS_Lord_Invocatus.gif`, `BOSS_hive_tyrant.gif`, `WAAAlintine.gif`, `doom_scythe.gif`, `eldar_BlackHeartRaider.gif`, `night_haunt.gif`, `noise_flamer.gif`, and `ork_stompa.gif`. They are not currently referenced by `BATTLE_ART`.

Known follow-ups identified from the current source:

1. **Terminal consistency audit:** the physical terminal, CRT compositing, dedicated directive screen, and shared safe area are implemented. Continue checking every remaining screen at 320, 390, and 480 CSS px for cropped headings, opaque panels, stacked card rhythm, misplaced footers, or content that appears in front of the glass.
2. **Route expansion:** the sector chart now saves every layer and link, reveals future grey signals, and preserves existing saves. Further expansion may add non-layered branches or backtracking, but must explicitly define the new traversal and reward rules.
3. **Cartography polish:** validate projected label size and collision at phone widths, add more sector-specific local-system landmarks, and tune gas, star density, and emission against the restrained gothic-terminal direction. Preserve the existing coverage, starting marker, gesture bounds, accessibility controls, and WebGL fallback.
4. **Exhausted reward pools:** a partly exhausted Enhancement or Stratagem pool can show fewer than three choices. A fully exhausted pool converts the claim to 10 Requisition, but partial pools still need equivalent replacement options.
5. **Higher-point army growth:** four patterns, stock limits, and the 6×5 grid can prevent using the full 2,000/3,000-point allowance. Expand the roster or define point-scale stock and grid rules before treating those scales as balanced.
6. **Asset coverage:** many factions still reuse silhouette fallbacks. Create original readable unit art and painterly briefing portraits without shipping files from `ref/` directly.
7. **CSS consolidation:** `main.css` and `terminal-frame.css` intentionally overlap while the new terminal layer supersedes legacy screen styling. Consolidate obsolete galaxy, territory, pixel-panel, and responsive overrides only after visual parity is verified, so state ownership remains understandable.

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

Tell the next coding agent: "Read gdd.md, README.md and artstyle.md, inspect git status, then continue the current COMBAT PATROL campaign. Preserve the three launch factions, points-scale setup, multi-claim Post-War Affairs, player dice advantage, and galaxy-map direction. Read the known follow-ups before claiming completion."

All referenced runtime images, GIFs, source and the dependency lockfile belong in Git. `node_modules/`, `dist/`, `.env*` and `.vercel/` are intentionally ignored and must be regenerated or configured locally. Vercel CLI authentication/project linkage is machine-specific; do not commit tokens or copy `.vercel` as a substitute for relinking. Existing deployment configuration builds with `npm run build` and serves `dist/`.

Production URL at handoff: `https://combatpatrol.vercel.app`. The interactive WebGL cartography was introduced in `972b2f2`; the persistent terminal and later CRT layout corrections culminate in the current `58c117a` baseline. The complete reference archive was added in `98d3398` and extended in `c246ebc`. The reference material informs future original production art and is not itself a runtime asset library.

### Sector-chart and Distress handoff — 24 October 2026

`sector.chart` stores the versioned layers, start beacon, links and legacy-offer compatibility. `CampaignChart.js` computes reachable, cleared and bypassed states. `run.rescuedUnits` stores complete mission-only profiles; `pendingPostWar.rescueOffer` locks the random survivor before claiming, so reopening or reloading cannot reroll or duplicate it. The initial pool uses all eligible `Imperium` profiles in the compact roster, with Darnath Lysander, Bjorn the Fell-Handed and Ragnar Blackmane as epic heroes. No invented tabletop statlines are added. Future data expansion can add more Imperial profiles to the pool. `npm run check` includes chart migration, adjacency, boss gating and rescue-lifetime checks.

### Compact chart and encounter cancellation — 24 October 2026

Chart version 2 reduces new sectors to three regular battles (nine possible battle systems) and one final system. It records its own `depth`. Migration preserves an already visible/selected legacy encounter and all completed battles, then shortens the unvisited tail. Advanced existing sectors can therefore temporarily contain more than three regular battles; later sectors use the compact layout. The final system stores three boss options but only one map beacon. Unlocks are 0/5/8 sector stars, without spending stars. Deployment has a separate Cancel action, available even with an empty/illegal army. It clears only the pending encounter and returns to the unchanged chart; formation, stars, rewards and route progress are retained. Cancellation is unavailable once combat starts or mandatory rewards are pending. The boss choice also has a return-to-chart action.

### Constellation layout and nearby framing — 25 October 2026

`ChartLayout.js` generates saved `chart.positions` from the mission seed and sector index. Star positions are irregular and ascend from the lower-left start toward the upper-right final system; route lanes remain gameplay rules only. Coordinates stay fixed across reloads, zoom and aspect changes. The initial camera frames the ship/current position and reachable neighbours (about four beacons at sector entry); wheel, pinch and +/− reveal more, while ALL fits the full constellation. Zoom interpolates its focus toward the overview centre. Overview labels simplify to stars/events to avoid crowding. System sprites are 20% larger and brighter. Chart-return controls read SYSTEM CHART and still cancel pending selections without spending progress. Nebulae now use transformed, fully feathered radial gradients without Canvas blur or clipped ellipse edges, plus linear texture filtering. This removes a likely Safari rendering dependency; actual iPad/Safari visual confirmation remains necessary.

Constellation spacing revision (25 October): position layout version 3 expands existing coordinates once (2.5x horizontally, 1.3x vertically) and tightens overview padding so systems occupy more of the CRT field. Star style, route links, encounters and rewards are unchanged. The saved positionVersion prevents repeated expansion on reload.
## Ordeal portrait draft — 25 October 2026

Keep the 6×5 case visible above a scrolling four-column portrait archive. Portrait taps open a dedicated CRT datasheet screen with unit art, six characteristics, invulnerable save, expandable ranged/melee profiles, ability summaries, composition, leader targets and the effective Ordeal profile. Back restores roster scroll and focus. Draft selects the pattern for keyboard/tap grid placement; Rotate changes its rectangular footprint. Mouse dragging begins after a movement threshold. Touch swipes scroll the roster; holding for 230ms begins a drag with a ghost and green/red footprint. Releasing outside the case or cancelling never deploys a unit. All final drops recheck points, stock, unlock, bounds and collisions through `DraftPlacement.js`.

Ten Grey Knights patterns were added from the requested Wahapedia 11th-edition page, retrieved 25 October 2026: Interceptors, Paladins, Purgation, Purifiers, Castellan Crowe, Grand Master Voldus, Brotherhood Champion, Chaplain, Techmarine and Brother-Captain. Numeric source snapshots and paraphrased reference summaries live under each unit’s `datasheet`; `scripts/import-grey-knights.mjs` refreshes from a saved HTML snapshot. New squads use the smallest listed model count and first-unit cost; footprints/stock are game adaptations. Existing four combat profiles remain save compatible, and their reference stat differences are visible in the Ordeal Profile panel. The engine still uses one chosen weapon and existing supported effects; displaying an ability does not implement new tabletop phase/movement rules.

The requested source contains no model portraits. Crowe, Voldus and Interceptor imagery is copied from the project’s existing model references into `public/assets/unit-portraits`; remaining patterns reuse matching existing squad/character artwork. This follows the user’s explicit permission to use model portraits for this feature. No external hotlinked assets are required. Grey Knights Epic Heroes also participate in the existing Distress hero pool.

Checks: `npm run check` covers placement bounds, rotations, overlap, points, stock, locks, source data, leader targets, pointer tap/scroll/hold/drop/cancel lifecycle, plus existing campaign tests. Browser layout and tap-to-draft checks supplement these; physical iPad Safari touch behavior still requires device verification.

### Supplied Grey Knights portraits — 25 October 2026

Ordeal cards and datasheets now use the user-supplied `ref/GK/GK_potrait` collection. Thirteen unchanged WebP copies cover all fourteen patterns; Interceptors share the battle-brother illustration because the collection has no dedicated Interceptor portrait. `js/data/portraits.js` maps unit IDs (including rescued snapshots) to source dimensions and individual face-to-torso crop bounds. Inline SVG view windows apply responsive framing without rewriting source pixels. Tall cards fill the crop window; wide datasheet views preserve its vertical face-to-torso extent. Formation-grid art remains separate from these portrait mappings. Browser checks at 390px verified card crops and the off-center Voldus datasheet; checks and production build passed.
