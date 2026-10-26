# COMBAT PATROL — Gameplay and implementation handoff

Updated 26 October 2026. UI baseline: 81d4fac. Balance pass dated 26 October 2026 applies to new missions with balanceVersion 1; active unversioned missions retain prior combat, reward cadence and flat sector payouts. This describes the current implementation; superseded rules remain in Git history.

## 1. Mission flow

COMBAT PATROL is a portrait-first 40K army-building roguelike with visible automatic D6 combat. A full mission means one run across four sectors; a system engagement is one battle inside a sector.

Main menu → NEW GAME → TAKE YOUR OATH → command transmission → COMMAND DECK.

- RESUME restores the existing run and mandatory pending briefings, retries, rewards or events.
- NEW GAME opens chapter selection instead of resuming. The current run remains until the replacement starts; starting it retains secured chapter rewards.
- Grey Knights are playable. Ultramarines and Imperial Fists retain their tall banners but remain sealed.
- Start at 500 points plus chapter capacity upgrades. Points-tier selection is removed.
- Command Deck has ORDEAL, RESEARCH and OPERATION near the lower CRT, plus END RUN. The four-marker tracker and explanatory balance line are hidden following the latest cleanup; sector progress remains saved and visible through Operation.
- Each sector has three regular battle layers and one final boss destination. Choose one linked system per layer, then a boss tier. Do not clear every alternative node.
- The fourth sector boss IS the Final Boss. There is no additional encounter. Other sector completions return to Command Deck.

## 2. Chapter progression and economy

Permanent profiles live in meta.chapters[faction] with currency, research and wins. Chapters never share their wallet or permanent upgrades.

Each secured sector banks a base 30 permanent chapter Requisition in run.chests, plus 5 for tier 2 or 10 for tier 3. Settle once on victory, defeat, END RUN or replacement. Three easy-sector victories retain 90; four pay 120. Higher tiers add bonuses, for a maximum full-run payout of 160. Runs ending before their first secured sector retain 3 permanent Requisition per unique regular victory, capped at 9; no cleared-sector run also receives this consolation payout. Temporary run.currency expires without conversion. Run enhancements, tactics, gear and recruits persist across sectors, then expire at mission end. Battle score (run.data) is separate and unspendable.

Current provisional costs use r = current rank before purchase:

| Upgrade | Per-rank benefit | Max | Cost |
|---|---|---:|---|
| Expanded Muster | +150 army points | 20 | min(180, 60 + 15r) |
| Infantry / Vehicle Fire Discipline | +1 attack per unit of that type | 3 each | 90 + 45r |
| Infantry / Vehicle Fortification | +1 Toughness above 75% / 50% / any remaining HP at ranks 1 / 2 / 3 | 3 each | 120 + 60r |
| Infantry / Vehicle Endurance | +2 total wounds per unit of that type | 3 each | 100 + 50r |
| Requisition Rights | +15% mission Requisition | 3 | 70 + 90r |
| Campaign Reserve | +1 mission attempt | 2 | 100 + 140r |

Capacity is 500 + 150 × capacity rank plus temporary point bonuses. Enemy budget uses 500 + 85% of starting capacity above 500, not the points actually deployed. Each +150 capacity adds only 127.5 to enemy budget basis, preserving an advantage; underfilling does not lower threat. All 20 capacity ranks total 3,060 currency rather than 9,750. Apply upgrades to cloned combat profiles, never the source roster.

## 3. Operation and route inspection

The sector heading is MISSION, without FOUR SECTORS or a decorative compass. Accepting a directive approaches its sector over about 1.1 seconds; reduced motion or unavailable WebGL skips travel.

CampaignChart.js saves topology/reachability; ChartLayout.js saves seeded asymmetric positions rising from lower-left to upper-right. New charts contain a start, nine regular alternatives and one final destination. Preserve generous spacing and irregular constellation composition. Entry frames about three to four nearby beacons. Pan, wheel/pinch and +/− reveal more; ALL fits the chart. Future systems glow grey; available signals remain brighter and 20% larger than the early chart implementation. Large stars communicate difficulty.

Clicking a reachable system opens an in-CRT briefing. START MISSION commits it; SYSTEM CHART cancels without advancing, spending or rerolling. run.rewardPlans saves the Requisition amount and eventual choices on inspection. The visible preview now shows category names and numeric Requisition only; verbose candidate/instruction lists are removed. Deployment can cancel before combat, but mandatory affairs cannot be skipped.

Three regular victories yield at most nine sector stars. Boss gates are 0 / 5 / 8 stars; stars are not spent and lower unlocked tiers remain selectable. The chart draws one boss beacon, never three.

| Tier | Gate | Threat multiplier |
|---|---:|---:|
| Warlord | 0 | 1.15 |
| Champion | 5 | 1.42 |
| Apex Commander | 8 | 1.80 |

Regular base difficulty is 0.62 + stars × 0.14 + step × 0.035. Both regular and boss difficulty multiply by sector escalation 1 / 1.18 / 1.40 / 1.65. Enemy generation targets max(150, adjusted starting capacity × difficulty), fills toward 85%, allows discrete-cost overshoot and has a 40-unit safety limit (legacy 20). Boss HP multiplies by 1.25 + tier × 0.2, with +1 attack per model. Final-sector tiers 2–3 give the enemy force +1 Hit. Tier 3 adds +1 attack per model to that force and +1 Toughness/+1 Wound-roll bonus to its boss. Higher tiers retain 35/40 permanent rewards as shown before starting.

## 4. Ordeal, portraits and ranks

The compact roster contains 19 factions and 88 profiles. Grey Knights have 16 patterns. Strike Squad, Terminators, Interceptors, Paladins, Purgation and Purifiers are initially available. Other patterns remain inspectable but sealed until recovered, including Venerable Dreadnought and Kaldor Draigo. Draigo is a Legends profile and eligible epic hero rescue.

Keep the formation case above a scrolling four-column vertical portrait roster. Tap a portrait for a CRT datasheet; Draft then tap a slot, or hold about 230ms and drag on touch screens. Swipes scroll. Illegal/cancelled drops do not change formation. Returning from inspection restores roster scroll.

Each independent squad occupies one slot. Six columns and four rows apply through 1,800 capacity; above that, use six rows. First half is frontline, second half rear. Rotation is removed. Select a deployed portrait and tap an empty slot to move it. Check points, stock, bounds, locks and collisions on every placement. Non-leader chapter patterns gain one extra stock per 600 starting capacity above 500; sealed patterns remain sealed and mission recruits stay at one stock. Slot overlays retain points, models and F/R; instructional row captions and draft hints are hidden.

Attach eligible leaders to bodyguards: they share position/rank and remain protected until their bodyguard dies. Army composition persists between battles; fighters rebuild at full model count and wounds. Defeat costs one attempt and preserves the pending system for reassembly. New runs have three attempts plus Reserve ranks.

Both armies screen with frontline units. Target selection excludes protected attached leaders, then restricts targets to frontline if any survive. Player attacks prefer low HP within eligible targets; enemies retain position/injury priority. Ranged units fire from either rank, melee requires frontline. When no living frontline remains, surviving rear units advance. Combat uses one selected weapon per unit rather than full tabletop weapon/phase selection.

js/data/portraits.js maps authored face/helmet-to-torso SVG crop windows to runtime copies in public/assets/unit-portraits. Dedicated Strike, Interceptor, Purgation and Purifier images are current. Rescued IDs map to base portraits. Preserve original ref/ images. Datasheets retain characteristics, weapon lists, abilities, composition and Ordeal profile; explanatory simulation copy and the source-link footer are removed from the visible UI.

## 5. Debrief, offers and run effects

Full CRT reports show rounds, starting models, losses, survivors and committed wounds. Victory uses directive-victory.webp (Vanquished_Daemon), failure uses directive-failure.webp (GK_Burial). BattleReport.js stores lastBattleReport and combatTotals; missing old statistics show dashes. Resolve Now cannot double-apply committed damage. pendingDefeat survives refresh without consuming another attempt.

Rewards are paced through the same Post-War Affairs UI: every victory grants Requisition; regular layer 1 grants an Enhancement, layer 2 a Stratagem, layer 3 gear. At bosses, sectors 1/3 grant an Enhancement and sectors 2/4 a Stratagem. Gear also appears at bosses and 2–3-star regular battles. Recovery appears only at bosses. A full run therefore grants six Enhancement and six Stratagem opportunities, rather than sixteen each; actual offer pools can still exhaust. Each resolves once. The overview keeps artwork, titles and actions, with helper descriptions, choice captions and score ledger hidden. Actual choice cards retain mechanical effects and Normal/Relic labels. Numerical combat statistics remain.

Enhancements are unowned passive run bonuses such as improved rolls/saves, regeneration, weapon effects and temporary +100 points. Stratagem offers contain up to three distinct unowned cards, independently rolling 22% Relic per slot with tier fallback if exhausted. There is no fixed quota: all Normal or all Relic is possible. Choose exactly ONE; the offer closes and repeated claims are rejected. Rolls persist. Exhausted pools can produce fewer choices or a currency fallback.

| Relic | Mission effect |
|---|---|
| Bastion of Titan | Infantry gain 5+ Invulnerable Save |
| Canticle of Iron | Vehicles gain +2 attacks per model |
| Oath of the Unbroken | Infantry gain +1 attack per unit and +1 Toughness |
| Reliquary of Recovery | Surviving units restore 3 wounds after each round |
| Writ of Acquisition | +50% Requisition from future victory awards |

Normal tactics remain in js/data/units.js: starting CP, opening-round attacks/auto-wounds/invulnerable saves, boss repair and a one-time Requisition cache. Requisition awards are round((18 + stars × 8) × (1 + salvage rank × 0.15) × (1 + relic bonus)), saved on inspection. Free Wargear caches accept one choice; one item equips to each selected deployed unit. Weapon boosts modify its chosen combat weapon, not a full loadout library.

## 6. Rogue Trader and Distress

Field Store replaces the page inside the CRT, using the supplied rogue_trader.jpg portrait above stock. It is not a floating modal.

Five saved stock slots independently roll 30% Imperial recruit, otherwise weapon boost/wargear, without a guaranteed mix or duplicate stock identity. Recruit candidates fit current army capacity. Recruit prices are max(50, points × 0.6 rounded to tens); gear rolls 20 / 30 / 40 / 50. Legacy saved prices remain.

Buy multiple entries while money and stock permit. Each sells once and stays SOLD OUT after reload. pendingPostWar.storeOffers saves stock; LEAVE STORE finishes the visit. Recruits are one-stock mission snapshots, cost normal deployment points and expire at mission end. Gear enters run inventory for assignment in Ordeal.

DISTRESS victory offers a saved random Imperial unique unit or epic hero for the full mission across all remaining sectors. Save the roll before claiming. run.rescuedUnits stores full profiles and sourceUnitId; rescues/trader hires do not permanently unlock source patterns. Legacy reinforcement events retain existing unlock behavior.

## 7. Automatic D6 combat

The player does not issue orders during combat. Available controls are playback speed and immediate resolution.

Each eligible unit attacks once per round while it has surviving models. Rear melee units wait until the rear advances. An attack uses the following visible sequence:

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


## 8. Saves and compatibility

| localStorage key | Contents |
|---|---|
| void-runner-40k-campaign-v2 | Chapter wallets/research, counters and settings |
| combat-patrol-active-v3 | Mission, sectors, formation, offers, event stock, recruits and reports |

meta.progressionVersion and run.rulesVersion are 2 for current progression. Old global wallet/research migrates once into the active chapter, or Grey Knights without a run; logistics maps to capacity. Existing runs preserve their starting capacity floor and any higher banked value. Runs before sector four trim their remaining campaign to four sectors; already advanced longer runs may finish their saved route. Every new run has four sectors. Legacy tier/rectangle helpers remain compatibility data, not current UI.

migrateFormation converts old footprints into ranked slots and keeps attached leaders with parents. Crossing the row threshold remaps the formation. Route migration preserves selected encounters/history. Persist offers, stock and claims after mutations; never reroll on refresh. Saves are browser-local and origin-specific; localhost and production differ. Git does not transfer saves. No cloud sync/export UI exists; old v2 active runs are not loaded under active-v3.

The new balance flag is written only by startRun. Previously saved missions retain old stat bonuses, cadence and payouts; purchased ranks, chapter wallets and saved choices are not reset. New upgrade prices apply in the chapter shop. Permanent wound bonuses are allocated to the last surviving model in a squad, keeping the bonus a unit-wide total; healing respects its cap. Fortification changes effective Toughness at wound resolution and never stacks to +3.

## 9. Source architecture

| File | Responsibility |
|---|---|
| js/core/Game.js | Flow, UI, campaign, draft and battle engine |
| js/core/Balance.js | Versioned escalation, capacity scaling, reward cadence and payout tuning |
| js/core/Progression.js | Chapter upgrades, migration, formation ranks, sector rewards |
| js/core/RunRewards.js | Normal/Relic offers and trader stock |
| js/core/CampaignChart.js, ChartLayout.js | Saved topology, reachability and seeded positions |
| js/core/DraftPlacement.js, js/ui/DraftDrag.js | Placement validation and pointer lifecycle |
| js/core/BattleReport.js | Casualties, damage records and totals |
| js/data/units.js, portraits.js | Effects, legacy constants and authored portrait crops |
| js/render/TerminalRenderer.js | Persistent chassis and CRT composite |
| js/render/GalaxyMap3D.js | Lazy spatial maps and gestures |
| css/progression.css | Current progression UI and latest caption/layout overrides |
| css/ordeal.css, field-store.css, debrief.css | Draft, trader and results |
| public/data/warhammer-roster.json | Checked-in compact roster |

js/main.js fetches roster JSON and constructs Game; window.voidRunner exposes it for debugging. There is no backend. The roster derives from the pinned local KS community snapshot recorded in its metadata. D:/Projects/Minigames/KS is needed only to re-extract data, not to run the game. Displayed abilities do not imply full tabletop implementation.

Runtime art lives in assets/, public/assets/ and gif/. Preserve faction battle GIFs, desktop side theaters, damage timing, reduced motion and transparent chassis surroundings without outer battle lines. Do not stage unrelated edited reference/Photoshop files.

## 10. Development, validation and deployment

Run npm ci, npm run check, npm run build, then npm run dev. Vite defaults to http://127.0.0.1:4173. Use Node satisfying package-lock.json (22.12+ is suitable).

Checks cover chart/rescue lifetime, placement/data/pointer interactions, debrief damage/retries/single claims, chapter isolation/migration, RNG extremes, trader multi-buy/sold persistence, ranks/advancement, immutable upgrades, fixed previews, 90-point withdrawal and fourth-boss settlement for 120. Legacy rotation tests remain for compatibility, not current UI.

Browser checks covered lower Command Deck placement, Resume/New Game labels, removed deployment hints, 1,070-point formation at 320px, mixed Relic choice closure, saved-preview cancellation, and multiple trader purchases. Real iPad Safari rendering/touch still needs device verification.

Repository: https://github.com/Flowtron22/void-runner, branch main. Existing Vercel project: interstellar-void under flowtron22. Pushes deploy https://combatpatrol.vercel.app. Build npm run build, output dist/. Verify Ready and compare the deployed main bundle with the local build. Do not link a different project or commit tokens/.vercel machine linkage.

UI cleanup release: 81d4fac. Progression implementation: 565aec4. See the latest balance commit/deployment for the current bundle; do not assume the previous bundle still represents production. Git transfers source/runtime assets, not browser saves, node_modules, dist, secrets or machine login state.

Balance verification: npm run check includes check-balance.mjs for bounded costs, escalation, squad stat caps/healing, rank-based fortification, stock growth, paced claims, tier incentives, consolation, idempotence and old-mission behavior. npm run balance:simulate -- 360 samples the actual combat engine with deterministic seeds, legal stock/capacity fills and varied enemy factions. These are isolated encounter samples with random accumulated rewards, not measured human win rates or full-run completion rates. The harness does not model gear/recruit shopping or optimal choices.

## 11. Follow-ups and continuation

- Playtest capacity grind, permanent stat scaling, stock and enemy budgets over repeated runs; balance is provisional.
- Verify real iPad Safari clouds and touch/pinch; feathered gradients avoid Canvas blur but device results remain unconfirmed.
- Audit 320 / 390 / 480px screens for clipping and labels while preserving CRT compositing.
- Expand non-Grey-Knight portrait coverage; some profiles use silhouettes/fallback art.
- Consider exhausted-pool replacements and CSS consolidation only with behavior/visual checks.
- Movement, terrain, visibility, objectives, manual phases, full weapon loadouts and complete faction libraries remain future work.

Next chat: read README.md, this GDD and artstyle.md; inspect git status. Preserve four-sector chapter progression, one-choice RNG offers, multiple-purchase trader, compact front/rear formation and restrained CRT UI. Do not restore points tiers, Rotate, instructional clutter, duplicate resume actions or an extra Final Boss. Earlier implementations are available in Git history.

Balance compatibility: on starting the first balanced mission, legacy Veteran Training ranks become at least the same rank of Infantry and Vehicle Fire Discipline, once per chapter. The old global Hit/Wound/FNP stack is disabled in balanced missions, while existing missions retain it. No wallet reset occurs. Fortification is reflected in the existing battle Toughness readout.

Balance sampling: 32 scenarios × 360 seeds = 11,520 isolated encounters. Fresh 500-point samples won about 94% of opening 1-star encounters and 72% of first-sector tier-1 bosses. Boss tier/sector escalation and developed accounts produced materially different outcomes. This is an initial tuning pass; full-run economy, player-selected builds, gear, recruits and faction outliers still need playtesting.
