# COMBAT PATROL — 40K Roguelike Campaign

A portrait-first Warhammer 40,000 army-building roguelike with automatic, visible D6 combat.

## Current game

- Start from Play, choose a 500 / 1,000 / 1,500 / 2,000 / 3,000-point campaign, then choose Ultramarines, Imperial Fists or Grey Knights.
- Pick an opening Battle Honour. The selected base point scale stays fixed throughout the run, with bonus allowance from research and Rapid Muster.
- Encounter enemies from the full 19-faction data roster.
- Arrange units on a 6×5 deployment grid.
- Travel across galaxy charts containing 4–8 sectors; choose three star-rated areas and unlock stronger sector bosses with collected stars.
- Watch Attacks, Hits, Wounds, Saves and Damage roll automatically.
- Enter Post-War Affairs segments before choosing actual Honours, Stratagems, recruits or store items. Requisition is the currency segment.
- Earn permanent boss rewards; temporary run currency buys Wargear in field stores.
- Save campaign data in browser-local storage. Saves do not transfer through Git, and reward-step resume still needs work; see the GDD's known follow-ups.

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

Read [ggd.md](ggd.md) for the complete rules and handoff. Read [ART_BIBLE.md](ART_BIBLE.md) before changing the visual direction.

## Continue on another PC

```powershell
git clone https://github.com/Flowtron22/void-runner.git
cd void-runner
npm ci
npm run dev
```

Use branch `main`. All runtime data and art are included; the original `D:/Projects/Minigames/KS` directory is not needed to run the game. The GDD records current behavior, source entry points, save keys and known unfinished work. Browser saves and Vercel login/project linkage are local to each PC and are not in Git.

Live game: [combatpatrol.vercel.app](https://combatpatrol.vercel.app).
