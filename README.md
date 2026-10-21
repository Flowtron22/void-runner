# VOID RUNNER

A portrait-first, real-time-with-pause spaceship survival vertical slice built with Three.js and vanilla ES modules.

The default **Guided Run** teaches the combat loop one action at a time, slows enemy pressure, and auto-pauses on major emergencies. Visual production follows the locked luminous pixel-art rules in `ART_BIBLE.md`.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:4173`.

## Production build

```powershell
npm run build
npm run preview
```

Vercel uses `vercel.json` to build the static site into `dist/`. Three.js is bundled into the production assets, so deployments do not depend on serving `node_modules`.

## Controls

- Click or tap a crew member, then a room, to issue movement orders.
- Click a physical door or use the selected-room door control to open/close doors.
- Select the airlock room to vent or seal it.
- Use the Systems tab to redistribute reactor power.
- Arm a charged weapon, then select an enemy room to fire.
- Press Space or use the Pause button for tactical pause. Orders remain available while paused.
- Press F1 to open the debug panel.

This repository contains Milestone 1 only: the combat and living-ship simulation. Campaign, sector-map, store, and progression systems are intentionally deferred.
