# COMBAT PATROL — 40K Roguelike Campaign

A portrait-first Warhammer 40,000 army-building roguelike with automatic, visible D6 combat.

## Current game

- Choose Space Marines, Orks, Tyranids, Imperial Knights or Grey Knights.
- Build a legal army at 500, 1,000, 1,500 and finally 2,000 points.
- Arrange units on a 6×5 deployment grid.
- Choose missions across four warzones and defeat a boss in each.
- Watch Attacks, Hits, Wounds, Saves and Damage roll automatically.
- Gain temporary Battle Honours and Wargear during the campaign.
- Earn permanent Requisition for upgrades between campaigns.
- Save and resume progress through browser-local storage.

The compact roster in `public/data/warhammer-roster.json` is derived from the local KS project at `D:/Projects/Minigames/KS`. Its source metadata identifies the pinned community dataset snapshot. This prototype is not an official rules or tournament-certification product.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:4173`.

## Validate

```powershell
npm run check
npm run build
```

Read [ggd.md](ggd.md) for the complete rules and handoff. Read [ART_BIBLE.md](ART_BIBLE.md) before changing the visual direction.
