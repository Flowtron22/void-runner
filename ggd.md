# INTERSTELLAR — 40K Roguelike Campaign GDD

This is the authoritative gameplay and implementation handoff. Read it with `ART_BIBLE.md` before editing the project.

## 1. Clear design statement

The game is now a portrait-first Warhammer 40,000 army-building roguelike with automatic dice combat.

- **40K supplies the army layer:** factions, units, points, models, Toughness, Saves, Wounds, Invulnerable Saves, weapon Attacks, Hit values, Strength, AP and Damage.
- **The KS project supplies the data and dice model:** compact game data is derived from `D:/Projects/Minigames/KS/solo-lab/public/armies`, and attack resolution follows the KS sequence.
- **The roguelike supplies the campaign wrapper:** choose missions, defeat a boss in each warzone, gain temporary Battle Honours and Wargear, then use permanent Requisition upgrades between campaigns.

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
Choose faction
    ↓
Build army under points limit
    ↓
Place units on 6×5 deployment grid
    ↓
Choose campaign mission
    ↓
Automatic D6 battle
    ↓
Choose Battle Honour + collect Wargear
    ↓
Boss → larger points limit → next warzone
```

## 4. Campaign structure

One complete campaign contains four warzones. Each warzone has three mission choices followed by a boss.

| Warzone | Army Points limit | Boss |
|---|---:|---|
| Outer Warzone | 500 | Enemy Warlord |
| Contested Sector | 1,000 | Armoured Spearhead |
| Fortress Line | 1,500 | Titanic Assault |
| Final Crusade | 2,000 | Supreme Command |

Mission types:

- **Battle:** standard threat and score reward.
- **Supply:** battle with improved Wargear chance.
- **Elite:** higher enemy points and guaranteed Wargear.
- **Recovery:** no combat; restore one campaign attempt.
- **Boss:** ends the current warzone and unlocks the next points limit.

Enemy faction is shown before the mission is selected. Choosing one mission closes the other choices at that depth.

## 5. Factions and JSON data

The runtime fetches `public/data/warhammer-roster.json`. It is a compact, deployment-safe derivative of the KS army JSON rather than a second manually invented ruleset.

Current factions:

- Space Marines
- Orks
- Tyranids
- Imperial Knights

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

1. Total unit points cannot exceed the current warzone limit.
2. Unit footprints cannot overlap or extend beyond the 6×5 deployment grid.

Units may be rotated. Stock limits restrict duplicates. A unit whose point cost exceeds the current limit remains visible but locked, explaining which limit is required.

Example: at 500 points, Imperial Knights can field one 375-point Knight Paladin, several 140-point Armigers, or another legal combination. The 785-point Acastus becomes available after the campaign reaches the 1,000-point warzone.

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

After a victory, choose one of three Battle Honours. They last only for the active campaign.

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

Supply, Elite and Boss missions can award Wargear. Select a deployed unit, then select a Wargear item to equip it. One item may be equipped per deployed unit.

Current Wargear modifies Hit rolls, Saves, Toughness, Attacks or Invulnerable Saves. Wargear disappears when the campaign ends.

## 11. Persistent progression

Requisition is permanent currency earned from completed battles. It is banked when a campaign ends, whether by victory or defeat.

Permanent upgrades:

- **Expanded Supply:** +50 Army Points per rank.
- **Veteran Training:** Rank 1 improves Hits, Rank 2 improves Wounds, Rank 3 grants Feel No Pain 6+.
- **Requisition Rights:** increases earned Requisition.
- **Campaign Reserve:** adds campaign attempts.

Meta progression and the active campaign are stored in browser `localStorage` under versioned keys.

## 12. Source architecture

```text
FTL/
├── index.html
├── css/main.css
├── public/data/warhammer-roster.json  # Compact KS-derived data
├── js/main.js                         # Loads JSON, starts game
├── js/core/Game.js                    # Campaign, builder and D6 engine
├── js/data/units.js                   # Honours, Wargear, warzones, upgrades
├── ART_BIBLE.md
├── ggd.md
└── README.md
```

Legacy Three.js spaceship files remain unimported reference material.

## 13. Development and validation

```powershell
npm install
npm run check
npm run build
npm run dev
```

Required checks:

- Every faction loads from JSON.
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
- Boss victories advance 500 → 1,000 → 1,500 → 2,000 points.
- Requisition and permanent upgrades persist.
- Active campaigns resume after reload.
- The browser console reports no errors.

## 14. Next expansion

1. Add more factions and units through a reproducible KS extraction script.
2. Support multiple weapon choices per datasheet.
3. Add phase/range logic for Shooting and Fight weapons.
4. Add rerolls, cover, Devastating Wounds, Anti keywords, Blast, Melta and Twin-linked.
5. Add battle breakdowns that show damage contribution per unit.
6. Add faction-specific Battle Honours and boss rules.
7. Add original grimdark unit silhouettes while preserving the locked art bible and avoiding official faction artwork or logos.
