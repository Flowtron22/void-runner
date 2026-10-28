# COMBAT PATROL

A portrait-first 40K army-building roguelike with automatic visible D6 combat, presented inside one gothic CRT terminal.

Updated 26 October 2026. UI cleanup release: 81d4fac; new-mission balance pass dated 26 October 2026. Live: https://combatpatrol.vercel.app.

## Current version

- Main menu uses RESUME and NEW GAME as separate actions. New Game opens TAKE YOUR OATH; Grey Knights are available, Ultramarines and Imperial Fists remain sealed.
- New missions start at 500 points plus chapter capacity upgrades. Clear four sectors; the fourth sector boss is the Final Boss, with no extra encounter.
- Each secured sector retains a base 30 permanent chapter Requisition, including when a run ends early. Higher boss tiers award 35/40. Three easy sectors earn 90; four earn 120, up to 160 on the hardest route. Before the first secured sector, unique battle wins provide a capped 9-currency consolation payout. Temporary mission Requisition expires without conversion.
- Chapter Armoury has +150 points per capacity rank and separate Infantry/Vehicle attacks, Toughness and wounds upgrades. Wallets/upgrades never carry across chapters. Costs increase with rank, with capacity purchases capped at 180 each. Permanent attacks and wounds apply per unit instead of every model; Fortification gives a conditional +1 Toughness rather than stacking +3.
- Ordeal uses compact squad portrait slots, without rotation. Frontline screens targets, ranged units fire from rear, rear melee waits and rear units advance when the front falls. Attached leaders follow their bodyguards.
- Explore the saved asymmetric constellation chart. Future systems glow grey. Inspect rewards, Start Mission, or return to System Chart without committing or rerolling. Sector stars unlock boss tiers at 0 / 5 / 8. Later sectors escalate; enemies scale at 85% of added starting capacity. Larger capacity gradually increases chapter unit stock.
- Post-war Stratagem offers randomly mix Normal and Relic cards with no fixed quota. Choose one card only. Build rewards are paced across the route to six Enhancement and six Stratagem opportunities per full run. Trader stock is also RNG: buy multiple recruits, weapon boosts or wargear with mission Requisition; sold stock persists. Recruits and gear last for that full mission only.
- The Command Deck stations are back near the bottom. Marked instructional captions, verbose preview descriptions, map compass and duplicate Active Mission action are removed. Mechanical effects remain on actual choice cards; everything stays beneath CRT glass.

Read [gdd.md](gdd.md) for current rules, costs, saves, code ownership and follow-ups. Read [artstyle.md](artstyle.md) before changing layout or artwork.

## Run and validate

Use Node compatible with the lockfile (22.12+ is suitable). Run npm ci, then npm run dev; open http://127.0.0.1:4173. Validate with npm run check and npm run build.

The compact checked-in roster contains 19 factions and 88 profiles, with 16 Grey Knights patterns and supplied individual portrait crops. Its pinned KS community-source metadata is included. The original D:/Projects/Minigames/KS directory is only needed for data re-extraction. This prototype implements a documented combat abstraction, not the complete tabletop ruleset.

## Continue on another PC

Clone https://github.com/Flowtron22/void-runner, use main, run npm ci and read the three Markdown files before editing. Source/runtime assets are included. Browser-local progress does not transfer through Git and differs between localhost and production. Preserve unrelated user changes under ref/.

Vercel project: interstellar-void under flowtron22. main pushes deploy https://combatpatrol.vercel.app using npm run build and dist/. Confirm deployment Ready and matching build before reporting live. Login/project linkage is local to each PC; never commit tokens or .vercel. No backend/cloud saves exist.

Active missions retain their original combat/reward rules; new missions use balanceVersion 1. Chapter progress is preserved. Run npm run balance:simulate -- 360 for deterministic samples using the actual combat engine.

## Verification limits

Checks cover routes, drafting, reports, chapter isolation, RNG offers, stock, rank combat and sector payouts. Browser QA includes narrow-phone layouts and the latest UI cleanup. Physical iPad Safari still needs verification; balance across repeated missions remains provisional.

## Original procedural music — 28 October 2026

`Vigil of the Void` is a new 64-second, 120 BPM half-time gothic sci-fi score, synthesized entirely in Node.js without samples or external music. It plays continuously across game screens after the first user interaction. Settings → MUSIC toggles playback and remembers the preference; hidden tabs pause. No existing layout or gameplay wording was changed, apart from adding this setting.

Run `npm run audio:render` to regenerate the WAV master (`output/audio/combat-patrol-bgm.wav`, ignored) and runtime AAC (`assets/audio/combat-patrol-bgm.m4a`). Run `npm run audio:check` for deterministic synthesis and playback regression checks. FFmpeg comes from the pinned `ffmpeg-static` dev dependency; `FFMPEG_PATH` can override it. The encoded file is measured after compression and adjusted to −1.8 dBTP. Metrics and the master SHA-256 are stored alongside the M4A. See GDD section 12 for the audio contract.

26 October battle GIF fix: clear and hide previous artwork when leaving combat; reveal each new GIF only after its own load event. Stale load/error callbacks cannot affect a subsequent fight. Layout is unchanged. Regression checks live in scripts/check-battle-art.mjs.

26 October link branding: browser title and social preview title are Combat Patrol by Ureka Games. Root favicon.svg/PNG/ICO and apple-touch-icon.png use a CP monogram matching the CRT palette. Static Open Graph/Twitter large-image metadata in index.html points to the unchanged existing warship artwork at /social/combat-patrol.jpg (1920×1219). Canonical URL is https://combatpatrol.vercel.app/. Metadata is present in initial HTML for crawlers; no gameplay layout changes. External platforms may cache older link previews.
