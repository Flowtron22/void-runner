# VOID RUNNER: PROTOCOL FRONT

A portrait-first roguelike army-builder and auto-battler for the browser.

Pack a strike force into a 6×5 case, remain under an escalating command-point budget, choose a route through four hostile regions, and watch the formation fight automatically. Victory grants temporary protocols, equipment, and persistent War Chests for research.

## Current playable loop

- Manual grid-based force construction.
- 500 → 900 → 1,400 → 2,000-point regional escalation.
- Seven original unit types with different sizes, roles, and stock limits.
- Branching skirmish, salvage, elite, recovery, and boss contacts.
- Fully automatic round-based combat with speed and resolve controls.
- Temporary protocol choices and equippable run gear.
- Four permanent research paths.
- Active-run and meta-progression saves through `localStorage`.
- Luminous high-contrast pixel presentation locked to a portrait command board.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:4173`.

## Validate and build

```powershell
npm run check
npm run build
npm run preview
```

Read [ggd.md](ggd.md) for the complete mechanics and implementation handoff. Read [ART_BIBLE.md](ART_BIBLE.md) before changing the visual direction.
