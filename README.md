# COMBAT PATROL — 40K Roguelike Campaign

A portrait-first Warhammer 40,000 army-building roguelike with automatic, visible D6 combat.

## Current game

- Start from Play, choose a 500 / 1,000 / 1,500 / 2,000 / 3,000-point campaign, then choose Ultramarines, Imperial Fists or Grey Knights.
- Collect campaign Enhancements that improve the army while the selected base point scale stays fixed throughout the run.
- Encounter enemies from the full 19-faction data roster.
- Arrange units on a 6×5 deployment grid.
- Ordeal keeps the formation case above a compact four-column portrait archive. Tap a portrait for its datasheet, then Draft and tap a grid cell; on touch screens, swipe to scroll or hold a portrait briefly and drag it into the case. A green/red footprint previews fit, and illegal drops do not change the formation.
- Grey Knights now have 14 patterns. Interceptors, Paladins, Purgation and Purifier squads join the two starting squads in new and existing missions. Sealed characters remain inspectable and can arrive through mission rewards. Reference profiles and weapon lists link to the requested Wahapedia source; automatic combat retains one selected weapon per unit.
- Travel through interactive Three.js galaxy and local-system charts with constrained pan, wheel/pinch zoom, emissive selectable stars, projected accessible labels, and camera approaches. See the full connected sector route, follow reachable systems, and unlock stronger sector bosses with collected stars. Future systems glow grey; large stars show difficulty.
- Win at DISTRESS systems to rescue a random Imperial unique unit or epic hero for the current mission, across all its sectors. Recruits use normal army points and disappear when the mission ends.
- Watch Attacks, Hits, Wounds, Saves and Damage roll automatically. Player combat dice receive a modest low-roll recovery advantage; enemy dice remain standard D6 rolls.
- Resolve 3–5 distinct Post-War Affairs claims after a victory: one Requisition cache, one Enhancement, one Stratagem, then Wargear and Force Recovery on richer routes. Each block closes after its single claim, and special route events resolve before travel continues.
- Bank sector-boss rewards during the campaign. They become permanent research Requisition only after every required sector is completed; temporary run currency buys Wargear in field stores.
- Save campaign data in browser-local storage, including partially resolved Post-War Affairs. Saves do not transfer through Git.

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
