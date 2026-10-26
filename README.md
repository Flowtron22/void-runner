# COMBAT PATROL

A portrait-first 40K army-building roguelike with automatic visible D6 combat, presented inside one gothic CRT terminal.

Updated 26 October 2026. Latest gameplay/UI release: 81d4fac. Live: https://combatpatrol.vercel.app.

## Current version

- Main menu uses RESUME and NEW GAME as separate actions. New Game opens TAKE YOUR OATH; Grey Knights are available, Ultramarines and Imperial Fists remain sealed.
- New missions start at 500 points plus chapter capacity upgrades. Clear four sectors; the fourth sector boss is the Final Boss, with no extra encounter.
- Each secured sector retains 30 permanent chapter Requisition, including when a run ends early. Three sectors earn 90; four earn 120. Temporary mission Requisition expires without conversion.
- Chapter Armoury has +150 points per capacity rank and separate Infantry/Vehicle attacks, Toughness and wounds upgrades. Wallets/upgrades never carry across chapters. Costs increase with rank.
- Ordeal uses compact squad portrait slots, without rotation. Frontline screens targets, ranged units fire from rear, rear melee waits and rear units advance when the front falls. Attached leaders follow their bodyguards.
- Explore the saved asymmetric constellation chart. Future systems glow grey. Inspect rewards, Start Mission, or return to System Chart without committing or rerolling. Sector stars unlock boss tiers at 0 / 5 / 8.
- Post-war Stratagem offers randomly mix Normal and Relic cards with no fixed quota. Choose one card only. Trader stock is also RNG: buy multiple recruits, weapon boosts or wargear with mission Requisition; sold stock persists. Recruits and gear last for that full mission only.
- The Command Deck stations are back near the bottom. Marked instructional captions, verbose preview descriptions, map compass and duplicate Active Mission action are removed. Mechanical effects remain on actual choice cards; everything stays beneath CRT glass.

Read [gdd.md](gdd.md) for current rules, costs, saves, code ownership and follow-ups. Read [artstyle.md](artstyle.md) before changing layout or artwork.

## Run and validate

Use Node compatible with the lockfile (22.12+ is suitable). Run npm ci, then npm run dev; open http://127.0.0.1:4173. Validate with npm run check and npm run build.

The compact checked-in roster contains 19 factions and 88 profiles, with 16 Grey Knights patterns and supplied individual portrait crops. Its pinned KS community-source metadata is included. The original D:/Projects/Minigames/KS directory is only needed for data re-extraction. This prototype implements a documented combat abstraction, not the complete tabletop ruleset.

## Continue on another PC

Clone https://github.com/Flowtron22/void-runner, use main, run npm ci and read the three Markdown files before editing. Source/runtime assets are included. Browser-local progress does not transfer through Git and differs between localhost and production. Preserve unrelated user changes under ref/.

Vercel project: interstellar-void under flowtron22. main pushes deploy https://combatpatrol.vercel.app using npm run build and dist/. Confirm deployment Ready and matching build before reporting live. Login/project linkage is local to each PC; never commit tokens or .vercel. No backend/cloud saves exist.

## Verification limits

Checks cover routes, drafting, reports, chapter isolation, RNG offers, stock, rank combat and sector payouts. Browser QA includes narrow-phone layouts and the latest UI cleanup. Physical iPad Safari still needs verification; balance across repeated missions remains provisional.
