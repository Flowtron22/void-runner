# VOID RUNNER — Luminous Pixel Art Bible

This is the locked visual specification for all game art, UI, effects, icons, loading screens, and promotional assets.

## Visual thesis

VOID RUNNER is a luminous pixel diorama on a nearly black foundation. Large, readable silhouettes carry the form; small saturated lights communicate function. Glow is a secondary echo around a crisp pixel shape, never the shape itself.

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
- WebGL scene renders at roughly 80% of CSS resolution with antialiasing disabled.
- UI spacing uses a 4 px base unit; borders are 2 px; hard shadows offset 3–4 px.
- Minimum touch target: 40 CSS px.
- Minimum body text: 9 CSS px in the monospace pixel language; critical values are 11 px or larger.
- Icons: design on a `16 × 16` grid, scale only by integer multiples when exported.
- Character footprint: approximately `12 × 18` logical pixels at reference size.
- Room labels must remain legible at the default tactical zoom.
- All raster assets use nearest-neighbor scaling and no smoothing.

## Silhouettes and proportions

- Ships use tall, unmistakable outer silhouettes with stepped or chamfered corners.
- Player silhouettes are cyan-edged; hostile silhouettes are red-edged.
- Rooms are broad rectangles with bright perimeter pixels and one dominant equipment shape.
- Crew use block heads, rectangular torsos, and separated square limbs. Species differ first by proportion, then by color.
- Props should be recognizable from a single large mass plus one luminous functional detail.
- Avoid thin decorative noise that disappears at actual play size.

## Materials

- **Hull:** near-black blue, matte, cyan or red hard edge.
- **Room floor:** one dark system color with a bright border; never a soft gradient.
- **Console:** charcoal block with one cyan rectangular screen.
- **Engine:** paired dark blocks with amber vertical cores.
- **Shield generator:** faceted violet or cyan diamond ring.
- **Door:** solid signal cyan when open, alarm red when sealed.
- **Fire:** three stacked square flames in red, orange, and amber.
- **Breach:** black octagonal hole with a light structural rim when readability requires it.

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

- The player ship remains larger than the enemy ship.
- Red always means a current threat or hostile target.
- Cyan always means a player-controlled selection or primary action.
- A selected room changes both border/emission and UI text.
- Low oxygen, fire, damage, and weapon readiness must remain distinguishable when simultaneous.
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
