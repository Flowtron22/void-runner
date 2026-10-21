# COMBAT PATROL — Grimdark Command Table Art Bible

This is the locked visual specification for all game UI, effects, icons, loading screens, and future promotional assets. The direction is derived from the project owner's KS interface: a tactile military command table built from iron, bone, brass, parchment and oxblood. Designs must remain original; do not copy official logos, characters, faction marks, or illustrations.

## Visual thesis

COMBAT PATROL should feel like a battered campaign console in a vast gothic warship. Information is dense but ordered. Bone dice and parchment labels sit over soot-black iron. Brass identifies command and progress; oxblood identifies danger and violence. Decoration must strengthen hierarchy, never bury rules.

## Locked palette

| Role | Color | Hex |
|---|---|---|
| Soot background | Near black | `#090B0D` |
| Iron panel | Blue charcoal | `#171C21` |
| Raised plate | Gunmetal | `#222930` |
| Structural edge | Worn steel | `#48463E` |
| Primary text / dice | Aged bone | `#E8E3D6` |
| Secondary text | Ash gray | `#98978F` |
| Command / selection | Tarnished brass | `#C5A86C` |
| Health / recovery | Drab olive | `#9BAD72` |
| Enemy / damage / primary action | Oxblood | `#B74332` |
| Rare / veteran accent | Umber | `#917757` |

Faction colors may tint unit borders at no more than roughly 55% saturation. Brass, not faction color, remains the main navigation color.

## Display and asset specifications

- Reference canvas: `480 × 854` CSS pixels, portrait-first.
- Minimum supported width: `320` CSS pixels.
- Minimum touch target: `42 × 42` CSS pixels.
- Body text: 9 CSS px minimum; consequential values: 11 CSS px or larger.
- UI spacing follows a 4 px base unit. Borders are usually 1 px; priority plates may use a 2–3 px top or left rule.
- Icons should be designed at `24 × 24` logical pixels with a single dominant silhouette.
- Unit footprints remain 1×1 through 3×2 on the 6×5 deployment grid.
- Texture is a low-opacity overlay. Text, dice, and state borders must remain crisp.

## Shape and material rules

- Panels are squared or barely rounded, layered like bolted metal plates.
- Important panels may use rivets, double rules, bevel highlights, heraldic symmetry, or restrained cathedral geometry.
- Infantry is compact and upright; artillery is low and wide; walkers and super-heavies must feel top-heavy and monumental.
- A large unit earns its grid footprint through mass and negative space, not tiny surface noise.
- Bone dice are bright physical objects with dark values. Failed dice invert to dark iron and muted red.
- Never use official insignia. Use original crosses, shields, cog geometry, campaign stripes, and numeral systems.

## Lighting and hierarchy

1. Oxblood: attack, enemy, damage, destructive primary action.
2. Brass: navigation, selection, points, campaign progress.
3. Bone: readable content and physical dice.
4. Olive: health, recovery, successful defense.
5. Ash: inactive or supporting information.

Glow is not part of the base language. Depth comes from hard shadows, bevels, texture, and warm/cool material contrast.

## Typography and UI

- Use a restrained serif for campaign titles, creeds, and major headings.
- Use a condensed military sans-serif for controls, rules, stats, and labels.
- Uppercase labels are short, tracked, and action-first.
- State must be communicated by text, position, and border treatment as well as color.
- The current actionable choice gets one dominant accent. Avoid several equally loud buttons.
- Keep all combat math visible: target numbers appear beside the relevant dice stage.
- Active play screens are icon-first. Do not repeat a concept in a heading, paragraph, and button.
- Prefer one stable symbol plus a number over a written label: `♥` attempts, `◆` currency/score, `✦` honours, `⚙` Wargear, `▦` army, `⌖` route, `⚄` dice, `♛` Leader.
- Unit profiles use compact stat chips (`T`, `S`, `W`, `L`, `O`) and rule symbols. Full names belong in accessible labels, native tooltips, or the Help dialog.
- Prose on an active screen must either change a decision or explain an error. Lore, repeated instructions, and definitions stay behind Help.

## Dice motion

- Resolve one stage at a time: Attacks → Hits → Wounds → Saves → Damage.
- Normal speed: about 520 ms per stage, plus a short pause between units.
- Fast speed: about 190 ms per stage; it remains readable rather than becoming instant.
- Dice tumble in from above with X/Y/Z rotation, a short bounce, and small per-die timing variation.
- Only the active stage animates. Completed stages remain stable and future stages are obscured.
- `Resolve now` may bypass presentation but must produce identical rules results.
- Respect `prefers-reduced-motion` by removing tumble and transitions.

## Readability rules

- The full attack sequence must fit the portrait combat view without horizontal scrolling.
- Current attacker and defender names remain visible above the dice.
- Target thresholds and totals must be readable without interpreting color.
- Damage application occurs when the Damage stage is revealed, so unit health and dice agree.
- Background texture stays under 25% opacity and never crosses text contrast requirements.

## Unit silhouette atlas

- `assets/unit-silhouettes.png` is the locked 4×4 transparent portrait atlas used by both roster cards and deployed formation pieces.
- Rows are Space Marines, Orks, Tyranids and Imperial Knights; columns follow each faction's unit order in `public/data/warhammer-roster.json`. Additional factions reuse the nearest readable silhouette archetypes through a deterministic unit mapping, distinguished by faction color and dedicated battle animation until the atlas is expanded.
- The silhouettes are original generated designs informed by official unit shape references, not copied illustrations or faction logos.
- Preserve the atlas order, transparent padding, 400% CSS background sizing and 42–48 px display range when adding or replacing portraits.

## Avoid

- Cyan-heavy neon or unrestricted rainbow accents.
- Blurred bloom, glassmorphism, or holographic UI.
- Official faction logos, copied illustrations, or copied compositions.
- Decorative gothic detail that competes with controls.
- Tiny faux-technical text.
- Showing every dice stage at once.
- Applying damage before the Damage stage appears.
- Motion blur, excessive screen shake, or rapid strobing.
