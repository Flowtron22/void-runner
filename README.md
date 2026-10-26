# COMBAT PATROL — 40K Roguelike Campaign

## Current rules — 26 October 2026

This section supersedes older gameplay and implementation notes in this document.

- Take Your Oath starts a Grey Knights mission at 500 points plus chapter capacity upgrades. Other chapters remain sealed. Points-tier selection is removed.
- One full mission has four sectors. Each sector has three route battles and one boss destination. The fourth sector boss IS the Final Boss; there is no extra encounter.
- Each secured sector banks 30 permanent Requisition. Three secured sectors retain 90 on withdrawal or failure; four pay 120. Boss tier does not multiply permanent rewards. Temporary mission Requisition expires without conversion.
- Permanent wallets and upgrades are isolated in meta.chapters[faction]. Expanded Muster adds 150 army points per rank, costs 60 + 45 × current rank, and has 20 ranks. Infantry and Vehicle each have separate +1 attacks, +1 Toughness and +2 wounds upgrades (three ranks), with rising costs. Salvage and attempts are also available. Balance is provisional.
- Old global progression migrates once to the active chapter, or Grey Knights without an active mission. Existing missions preserve their starting points floor and banked value. Missions already past sector four may finish their saved route. All new missions use four sectors.
- Ordeal uses one compact portrait slot per independent squad, six columns and four rows (six rows above 1,800 capacity). First half frontline, second half rear. No rotation. Select a deployed portrait and tap an empty slot to move it. Attached leaders follow bodyguards. Stock, capacity, locks and occupied slots remain enforced.
- Both armies use ranks: frontline screens targets, ranged units fire from either rank, melee requires frontline, and rear units advance when no living frontline remains. Enemy budget uses starting mission capacity rather than deliberately underfilled deployment.
- Existing asymmetric constellation charts remain. Clicking a reachable system opens an in-CRT briefing with saved Requisition and reward previews. Start commits travel; System Chart cancels without advancing, spending or rerolling. Boss gates remain 0 / 5 / 8 collected stars, with lower unlocked tiers selectable.
- Stratagem offers contain three distinct saved cards. Each slot independently rolls 22% Relic, falling back if a tier is exhausted. No fixed quota: all Normal or all Relic is possible. Choose exactly ONE; the entire offer closes. Relics support Infantry wards, Infantry/Vehicle builds, recovery and Requisition.
- Rogue Trader stock has five saved RNG entries: each rolls 30% mission-only Imperial recruit, otherwise weapon boost/wargear. Multiple purchases are allowed; finite stock remains sold after reload. Gear costs 20–50; recruits cost about 60% of army points, minimum 50. Leaving resolves the visit. Recruits, equipment and buffs expire with the mission.
- Four command-deck markers show mission progress, secured permanent rewards and temporary Requisition separately. All briefings, shop stock, portraits and claims remain inside shared CRT glass and scanlines.

Implementation: js/core/Progression.js, js/core/RunRewards.js, css/progression.css and Game.js. Progression checks cover chapter isolation/migration, secured rewards, RNG extremes, stock persistence, rank targeting/advancement, immutable combat upgrades and fixed previews. Physical iPad Safari still requires device verification.


A portrait-first Warhammer 40,000 army-building roguelike with automatic, visible D6 combat.

The compact roster in `public/data/warhammer-roster.json` is derived from the local KS project at `D:/Projects/Minigames/KS`. Its source metadata identifies the pinned community dataset snapshot. This prototype is not an official rules or tournament-certification product.

## Run locally

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:4173`.

## Validate

```powershell
npm run check
npm run build
```

Read [gdd.md](gdd.md) for the complete rules and handoff. Read [artstyle.md](artstyle.md) before changing the visual direction or creating production artwork.

## Continue on another PC

```powershell
git clone https://github.com/Flowtron22/void-runner.git
cd void-runner
npm ci
npm run dev
```

Use branch `main`. All runtime data and art are included; the original `D:/Projects/Minigames/KS` directory is not needed to run the game. The GDD records current behavior, source entry points, save keys and known unfinished work. Browser saves and Vercel login/project linkage are local to each PC and are not in Git.

Live game: [combatpatrol.vercel.app](https://combatpatrol.vercel.app).
