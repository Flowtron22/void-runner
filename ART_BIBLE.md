# VOID RUNNER: PROTOCOL FRONT — Luminous Pixel Art Bible

This is the locked visual specification for all game art, UI, effects, icons, loading screens, and promotional assets.

## Visual thesis

VOID RUNNER is a luminous portrait command board on a nearly black foundation. Large, readable unit silhouettes carry the form; small saturated lights communicate function. Glow is a secondary echo around a crisp pixel shape, never the shape itself.

## Locked palette

| Role | Color | Hex |
|---|---|---|
| Deep void | Near-black violet | `#05050B` |
| Panel foundation | Navy black | `#090D18` |
| Raised surface | Blue slate | `#121A29` |
| Structure line | Steel blue | `#293851` |
| Primary text | Warm white | `#F2F4DF` |
| Secondary text | Cool gray | `#8490A6` |
| Player / selection / navigation | Signal cyan | `#42F5D7` |
| Safe / healthy | Life green | `#78F08B` |
| Ready / caution / engine | Reactor amber | `#FFD166` |
| Enemy / damage / hazard | Alarm red | `#FF496C` |
| Shields / rare energy | Ion violet | `#9B6DFF` |

Do not add free-form neon colors. New colors must be darker structural shades derived from this palette.

## Pixel density and asset specifications

- Reference game canvas: `480 × 854` logical pixels for 9:16 layouts.
- The current build uses code-native HTML/CSS pixel forms. Future raster sprites must use integer scaling and disabled smoothing.
- UI spacing uses a 4 px base unit; borders are 2 px; hard shadows offset 3–4 px.
- Minimum touch target: 40 CSS px.
- Minimum body text: 9 CSS px in the monospace pixel language; critical values are 11 px or larger.
- Icons: design on a `16 × 16` grid, scale only by integer multiples when exported.
- Unit icons: design on a `24 × 24` logical grid with a dominant shape readable at 1×.
- Deployment cells: minimum `41 × 41` CSS px on supported narrow screens.
- Unit footprints must be recognizable as 1×1, 1×2, 2×1, 2×2, or 3×2 without reading text.
- All raster assets use nearest-neighbor scaling and no smoothing.

## Silhouettes and proportions

- Units use unmistakable block silhouettes with stepped or chamfered corners.
- Player silhouettes use their role color; hostile silhouettes use alarm-red edges.
- Large units must earn their footprint through visibly heavier mass, not scaled-up detail noise.
- Roles differ first by proportion: low/wide artillery, tall guards, compact support, massive heavies.
- Props should be recognizable from a single large mass plus one luminous functional detail.
- Avoid thin decorative noise that disappears at actual play size.

## Materials

- **Deployment case:** near-black blue cells, steel borders, cyan legal-placement feedback.
- **Infantry armor:** charcoal blocks with one role-color identification plate.
- **Heavy chassis:** two or three joined dark masses with amber machinery cores.
- **Artillery:** low horizontal silhouette with violet aiming elements.
- **Hostiles:** dark bodies with alarm-red hard edges.
- **Route nodes:** square tactical stamps; contact type is communicated by both color and text.

## Lighting hierarchy

1. Alarm red: immediate danger requiring action.
2. Signal cyan: player selection, navigation, and primary action.
3. Reactor amber: weapon readiness, timers, and caution.
4. Life green: healthy hull, crew health, and successful recovery.
5. Ion violet: shields and rare energy systems.

The base form must remain readable without bloom. Limit glow to a small halo around status pixels. Never cover room borders, crew silhouettes, or hazard shapes with effects.

## UI and icons

- Use square panels, stepped corners, 2 px borders, and hard offset shadows.
- Use uppercase monospace labels and short action-first instructions.
- One panel owns the current priority; do not present multiple competing alerts.
- Buttons show state with both color and text, never color alone.
- Ready weapons flash amber in a two-frame stepped pulse.
- Dangerous alerts flash red slowly; no rapid strobing.
- Bars have hard ends and discrete-looking fills.
- Interactive targets retain at least 3:1 contrast against their immediate background.

## Motion

- Idle light pulse: 800–1200 ms, two or three stepped frames.
- Button response: immediate 2 px down/right shift.
- Projectile: straight readable path, 500–800 ms.
- Impact: 4–8 square particles, 300–450 ms.
- Damage shake: under 200 ms and under 4 logical pixels.
- Door movement: 120–180 ms.
- Fire: alternate between two block configurations every 100–140 ms.
- Never use motion blur. Never tween a crisp base sprite into softness.

## Readability rules

- The player's packed formation remains readable as a single composition at the reference viewport.
- Red always means a current threat or hostile target.
- Cyan always means a player-controlled selection or primary action.
- A selected unit changes both border treatment and UI text.
- Health, armor role, temporary protocol, and hostile state must remain distinguishable when simultaneous.
- Text must be readable without glow and at the actual target viewport.

## Mistakes to avoid

- Unrestricted rainbow neon.
- Bloom used to hide weak silhouettes.
- Blurred or antialiased base sprites.
- Rounded glassmorphism panels.
- Tiny unreadable labels.
- Decorative darkness with no navigation cues.
- Effects that obscure hazards or crew.
- Smooth high-poly characters mixed with pixel UI.
- Different pixel densities between asset batches.
- Copying another game's characters, logos, ship layouts, or interface.
