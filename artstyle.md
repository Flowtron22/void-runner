# COMBAT PATROL — Art Style and Interface Direction

This document is the visual source of truth for the game. Read it before changing UI, creating portraits, commissioning illustration, generating assets, or adding effects. The reference archive lives in `ref/`, with the primary interface and portrait studies in `ref/GK/RT_UI/` and the current Photoshop composition targets in `ref/GK/GK_UI/`.

The references establish a broad art direction rather than a library of production assets. New work must use original characters, symbols, compositions, frames, and illustrations while applying the material, lighting, hierarchy, and painting principles described here.

## 1. Visual thesis

COMBAT PATROL takes place inside a vast, ancient command vessel. The interface is part of that vessel: a collection of shrine-like military terminals assembled from blackened iron, aged brass, dark timber, parchment, wax, cables, speakers, lenses, glass, and devotional machinery.

The player should feel that they are operating a dangerous physical instrument rather than browsing a webpage. A screen is a recessed CRT or chart table. A button is a lamp, key, brass plate, or illuminated glass switch. A menu transition is a terminal changing state. Information remains clear and fast to use, but every major screen has weight, depth, age, and location.

The mood combines ecclesiastical authority, naval command, analogue computation, and restrained horror. It is solemn and functional. Ornament supports the hierarchy instead of filling every empty surface.

The current production baseline is one persistent portrait command terminal. The chassis, crest, side pillars, lower grille, cables, and CRT glass form a single instrument. Screens change inside that glass; they do not replace, cover, or float in front of the instrument.

## 2. Principles extracted from the reference set

### The interface is a physical object

- Major views sit inside substantial bezels with visible thickness, seams, bolts, vents, cables, grilles, lenses, and worn edges.
- Screens are dark green-black glass with subtle curvature, reflections, scan texture, and localized phosphor emission.
- The frame and CRT are composited as one continuous object. Screen content uses transparent darkening, edge falloff, and screen-style light blending so the chassis remains visible and the content appears beneath the glass.
- Controls attach to a believable machine. Floating cards should appear only when the fiction supports projection or a removable dossier.
- Different stations can have different hardware while sharing the same shipboard construction language.
- Background environments remain visible around machinery so each station feels installed somewhere on the command deck.

### Structure is authoritative; detail is asymmetric

- Primary frames, crests, headings, and command controls use strong symmetry.
- Cables, seals, candles, handwritten notes, damaged panels, and maintenance additions introduce controlled asymmetry.
- Gothic arches and heraldic geometry guide the eye toward the active display.
- Large quiet fields are necessary. Do not cover every surface with trim, symbols, scratches, or text.

### Light belongs to a source

- Green phosphor indicates an operational display, confirmed route, or stable machine state.
- Amber and warm brass indicate command authority, focus, selection, and valuable progress.
- Red indicates hostile contact, corruption, destructive action, failure, or a prohibited system.
- Cold cyan is reserved for rare psychic, astropathic, or machine-spirit phenomena.
- Emission must originate from glass, a lens, a lamp, a celestial object, or a projected signal and cast a restrained response onto nearby material.
- Bloom is compact and controlled. Large soft neon haze makes the interface feel synthetic and must be avoided.

## 3. Material language

| Material | Use | Rendering notes |
|---|---|---|
| Blackened iron | Main chassis and structural frame | Near-black mass, worn steel edges, shallow dents, soot in recesses |
| Aged brass | Authority, selection, trim, hinges | Desaturated gold, dark oxidation, brighter edges only where handled |
| Gunmetal | Inner plates and mechanisms | Cooler than iron, brushed direction, crisp machining marks |
| Smoked CRT glass | Maps, combat readouts, data screens | Green-black base, curved reflection, faint scan texture, deep edge falloff |
| Parchment and vellum | Orders, lore, seals, records | Warm bone, stained edges, folds, pinning or wax attachment |
| Oxblood enamel | Danger and destructive command | Dark red body, chipped edges, brighter red indicator light |
| Dark timber or leather | Rare archival and officer elements | Almost black brown, matte, used sparingly against metal |
| Bone and ivory | Dice, reliquaries, high-value text | Warm off-white, never pure digital white |

Wear must explain use. Handled corners polish brighter, recesses collect grime, hot vents discolor, wax cracks, and exposed cables sag with gravity. Uniform procedural noise is not convincing wear.

## 4. Color system

| Role | Color | Working range |
|---|---|---|
| Void and deepest recess | Near black | `#050606`–`#0A0C0D` |
| Iron chassis | Blue charcoal | `#11171A`–`#20272A` |
| Worn steel | Neutral gunmetal | `#41484A`–`#70716B` |
| Aged brass | Tarnished warm metal | `#806B3D`–`#C3A669` |
| Bone text | Warm ivory | `#D8D0BC`–`#F0E9D8` |
| Secondary text | Ash | `#83847D`–`#AAA99E` |
| Operational phosphor | Desaturated green | `#527B5E`–`#9CCC8B` |
| Authority lamp | Warm amber | `#B9893C`–`#F0C46E` |
| Hostile state | Oxblood and ember | `#6E211D`–`#C34B39` |
| Psychic anomaly | Cold cyan | `#5A969B`–`#A5D9D4` |

The base interface is dark and materially neutral. Accent color should normally occupy less than 15% of a screen. One active state owns the brightest value. Faction colors may tint heraldry or a portrait mount, but they do not replace the system palette.

## 5. Portrait and character illustration

Character art uses painterly realism. The goal is authored concept art with controlled brushwork, not glossy photographic rendering and not uniformly sharpened generated imagery.

- Begin with a distinctive silhouette readable at thumbnail size.
- Use a three-quarter or frontal command portrait with clear posture and social rank.
- Resolve the face, hands, weapon, relic, and one narrative prop most sharply.
- Let clothing, lower body, and environment transition into broader, softer shapes.
- Use believable age, asymmetry, scars, fatigue, mechanical augmentation, and material wear.
- Light the face with one dominant source and one restrained secondary source.
- Limit emissive focal points to an augmetic eye, dataslate, halo, weapon, lumen, or psychic effect.
- Place the character in a relevant environment: bridge, archive, chapel, engine shrine, armoury, or observation deck.
- Preserve negative space for crop variants and interface text.
- Avoid centered glamour photography, plastic skin, perfect bilateral symmetry, excessive filigree, random cables, meaningless micro-detail, and galaxy scenery added without narrative reason.

Portrait assets should be painted at a minimum of 1600 px on the long edge. Keep a layered or uncropped master where possible. Export portrait crops for full briefing, roster card, dialogue bust, and small icon use rather than forcing one crop everywhere.

## 6. Typography and symbols

- Major titles, station names, and ritual declarations use a restrained engraved serif in uppercase.
- Controls, stats, captions, coordinates, and technical records use a narrow military sans-serif.
- Handwritten or blackletter styles are limited to seals, signatures, and environmental decoration; never use them for essential instructions.
- Primary text uses warm bone rather than pure white.
- Labels are short, tracked, and direct. Prose belongs in briefings, reports, and help views.
- Icons resemble heraldic line art, medallions, targeting marks, seals, and instrument symbols. Their silhouettes must remain legible at 20–24 px.
- Rank or progression can add rings, wings, rays, brackets, and brightness around a stable central symbol.
- Never depend on color alone. Pair state color with shape, label, position, or mechanical state.

Stable game symbols remain useful: `♥` attempts, `◆` Requisition, `★` campaign stars, `✦` Enhancements, `⌖` Stratagems, `⚙` Wargear, `▦` army, `⚄` dice, and `♛` Leader.

## 7. Layout and responsive rules

- Primary reference canvas: `480 × 854` CSS pixels in portrait orientation.
- Minimum supported width: `320` CSS pixels.
- Minimum touch target: `44 × 44` CSS pixels.
- The physical frame may consume 8–14% of the canvas edge, but the playable display must still fit critical decisions without horizontal scrolling.
- The shared CRT safe area is the only valid coordinate space for full-screen UI. No heading, map label, card, button, or scroll region may cross under the upper crest, side pillars, or bottom grille.
- Use an 8 px rhythm for large structure and a 4 px rhythm inside dense instruments.
- Consequential numbers and actions must remain readable above texture and scan effects.
- Desktop may reveal more of the surrounding bridge or machinery while retaining the same portrait instrument at the center.
- Safe-area padding must preserve hardware edges and the consistent return control at the bottom. Use the full vertical CRT field: do not crowd the heading against the bezel or leave a large unused band below the main content.
- Long screens scroll internally with hidden native scrollbars. The fixed chassis never moves. Sticky actions may pin to the bottom of the CRT plane, but they must not sit halfway up the screen when useful space remains below.
- A navigation transition leaves only one active screen. Previous-page controls must not remain visible beneath a briefing, map, or deployment state.

Avoid stacking identical bordered rectangles. Establish one dominant machine, then organize content inside it with recesses, rails, physical tabs, dossier sheets, or connected sub-displays.

### CRT compositing contract

- The WebGL terminal renders the chassis, environmental display image, procedural green-black phosphor field, scan interference, glass dust, vignette, and restrained reveal.
- HTML remains responsible for readable text, semantic structure, focus, and input. It should visually share the CRT image plane through translucent fields rather than opaque page backgrounds.
- Full-screen imagery crops to cover the CRT opening without stretching. Preserve the important face, ship, or chart landmark across 320–480 px widths.
- Use localized shadow or gradient backing only where text needs contrast. Large solid black rectangles, visible canvas bounds, generic modal backdrops, and bright outer card outlines break the illusion.
- Menu and command-deck controls may receive WebGL material response because they represent physical terminal controls. Dense lists and tactical controls remain HTML for clarity and performance, styled as embedded readouts.

## 8. Interaction states

Every state should look like the machine changed condition.

- **Idle:** dark glass, low lamp intensity, readable bone label.
- **Available:** one lamp or outline wakes; localized phosphor flicker confirms interactivity.
- **Focused/selected:** brass bracket, mechanical inset, brighter glass, or illuminated key.
- **Confirmed:** brief relay pulse, seal stamp, locking movement, or stable green lamp.
- **Hostile:** red instrument state with sharper contrast and restrained warning pulse.
- **Locked:** unpowered glass, obscured data, physical shutter, seal, or disconnected indicator.
- **Completed:** reduced intensity with a clear stamped, engraved, or green-confirmed state.

Hover can enrich desktop presentation but cannot be required. Touch and keyboard focus receive equivalent feedback.

## 9. Motion and sound character

Motion is deliberate and mechanical:

- CRT power-up, phosphor sweep, relay lamps, aperture opening, servo adjustment, paper feed, map calibration, and signal acquisition.
- Transitions generally take 180–600 ms. Ceremonial reveals may take longer when they do not delay repeated actions.
- Background motion is slow: dust, distant machinery, candle flame, a chart sweep, or subtle star drift.
- Avoid elastic web easing, floating-card bobbing, constant hover scaling, excessive parallax, motion blur, rapid strobing, and repeated full-screen shake.
- Respect `prefers-reduced-motion` and the in-game reduced-motion setting.

Sound should match physical causes: switch clacks, relay ticks, low transformer hum, servo strain, parchment movement, distant ship vibration, and short confirmation tones.

## 10. Screen direction

### Main menu

Place navigation in a substantial shipboard machine while a large environmental view establishes the vessel. The terminal owns the menu; the background supplies scale and atmosphere. The selected command illuminates like a glass key or powered module.

### Command deck

Treat Ordeal, Research, and Operation as three stations or command channels within one bridge environment. Preserve their consistent location. Status values live on an embedded instrument strip rather than a generic dashboard card.

### Galaxy and sector navigation

Show the galaxy on a dedicated cartographic display. The galaxy level communicates scale, labeled regions, and selectable stellar signals. Entering a sector changes to a deeper local chart with a distinct star field and system composition. Star systems are compact emissive neutron-star-like signals with light, spectral character, coordinates, and labels; they are not spheres or circular menu buttons.

Pan and zoom must feel like moving an instrument camera across a continuous chart. The background must cover the full navigable extent at every supported zoom. Starting position, current location, reachable systems, and locked signals require unmistakable states. Locked systems stay visible as low-energy blinking stars with grey labels. Keep star density controlled, then use sparse gas clouds and dust to give the void depth without competing with labels.

#### WebGL cartography specification

The chart is a restrained 2.5D instrument, not a free-flight space scene. Use a perspective camera, layered stars, sparse dust, and carefully placed depth to make the display feel expansive while preserving portrait-screen composition. Keep the camera upright and constrain its travel and zoom. Do not add unrestricted orbit rotation, a horizon, or exposed edges around the rendered field.

The galaxy and local-system views must be authored as different places:

- **Galaxy view:** broad, dark and sparse. Named sectors are compact stellar concentrations with a small emissive core, spectral variation, and enough separation for labels. The current or available sector carries a localized pulse; locked sectors remain legible without becoming bright buttons.
- **Local-system view:** closer and more dimensional. A sector-specific star, dust distribution, navigation reference, strike-cruiser marker, and reachable mission systems establish that the camera travelled inward. Do not reuse the galaxy field as a blurred background.

WebGL owns depth, light, star particles, travel motion, and hit targets. HTML owns names, threat and availability copy, focus order, and assistive semantics. Project every label from its three-dimensional anchor on each frame so text stays sharp and attached while panning, zooming, resizing, or travelling. A pointer raycast and its corresponding HTML control must select the same destination and must not fire twice.

Selection states use light and instrument response rather than animated planetary rings:

- **Available:** readable core, restrained emissive pulse, clear name and status.
- **Focused or hovered:** brighter core, thin acquisition reticle, and increased label contrast.
- **Selected:** short camera approach followed by the briefing or local chart.
- **Locked:** dim signal, visible name, and explicit lock reason where needed.
- **Current or starting position:** persistent navigation marker that remains visible at every allowed zoom.

The local-system screen follows the same single-plane hierarchy as sector selection: heading, compact campaign status, slim active-directive strip, uninterrupted chart, then return control. Do not rebuild it as stacked bordered cards. Place the chart low enough to clear the upper bezel and let it occupy the available lower CRT field.

Camera travel should take roughly 500–900 ms and settle cleanly. Direct manipulation stops the travel before accepting a new gesture. Reduced motion changes travel into an immediate camera placement and removes pulsing or drift that is not required for state recognition.

Keep the renderer practical on mobile. Load the WebGL module only when Operation opens, cap device pixel ratio, avoid full-screen bloom and expensive post-processing, and dispose of controls, geometry, material, texture, renderer, observers, and animation frames when leaving the chart. Prefer a few deterministic particle layers over a dense generated galaxy. If WebGL fails, retain the authored chart background and fully usable HTML destination controls.

### Deployment and army management

Use a tactical chart table or armoury terminal. Units appear as painted dossiers, pict feeds, or heraldic identification plates. Large walkers and knights must occupy visibly larger grid footprints; a single character uses the established 4×4 tile footprint rule where defined by gameplay. Locked units need a clear operational reason such as unrecovered pattern, insufficient allowance, or unavailable stock.

### Battle

The battle instrument prioritizes attacker, defender, health, target thresholds, dice, and damage. Environmental art may surround the board but cannot obscure combat math. Dice should feel physical: bone or ivory faces, weight, a short tumble, and a settled result.

### Briefings and contracts

Present each Inquisitorial directive as an authenticated transmission taking over the CRT. It is a dedicated screen, never a popup over the sector chart. The Inquisitorial officer portrait is environmental painterly art, cropped into the upper display and blended through the smoked glass. Objective, authority, and reward sit in a compact machine-readable block. Accept and Belay belong together at the bottom of the briefing.

Center the transmission within the CRT safe area. Remove the freestanding outer card border; use tonal separation, a restrained internal divider, and edge fade to bind portrait and text into the terminal. The previous page, its footer, and its buttons must be completely absent while the directive is active.

### Post-War Affairs

Present the available claims as recovered reports, seals, reliquaries, tactical ciphers, and supply manifests. Once claimed, a block physically closes, stamps, retracts, or powers down. The remaining claims become the next clear actions.

### Research

Use a reliquary, archive, or forge terminal. Permanent upgrades should feel engraved, installed, sanctioned, or wired into the vessel rather than purchased from a modern skill tree.

## 11. Combat readability and dice motion

- Resolve one visible stage at a time: Attacks → Hits → Wounds → Saves → Damage.
- Normal speed is about 520 ms per stage; fast speed is about 190 ms.
- Only the current stage animates. Completed stages remain stable and future stages stay obscured.
- Attacker and defender names remain visible throughout resolution.
- Target thresholds and totals must be readable without interpreting color.
- Apply damage when the Damage stage is revealed so the unit state and dice agree.
- `Resolve now` may bypass presentation but must produce the identical prepared result.

## 12. Asset production rules

- Keep reference images under `ref/`; runtime-ready original assets belong under `assets/` or `gif/`.
- Do not ship a reference image merely because it already fits a frame.
- Store transparent interface frames with enough interior padding for responsive content.
- Export large structural textures at 2× the intended CSS size.
- Use lossless PNG for alpha-heavy frames and WebP/JPEG for opaque paintings where quality remains acceptable.
- Name assets by function and variant, not by download hash.
- Preserve source attribution notes outside the runtime when an external reference informs a study.
- Test every asset at 320, 390, and 480 CSS px widths before considering it complete.

## 13. Quality bar

A finished screen must pass these questions:

1. Does it feel installed inside the same ancient vessel as the other screens?
2. Is the active decision readable before the decoration?
3. Can every glow be traced to a believable source?
4. Are materials distinguishable without relying on noise?
5. Does the portrait have a clear silhouette, focal face, and authored brush hierarchy?
6. Does the screen remain functional with motion disabled and at 320 px width?
7. Are all controls understandable by touch, keyboard, and screen reader?
8. Is the result original rather than a traced frame, copied composition, or reused faction insignia?
9. Is every visible element inside the CRT safe area, with no cropped title, floating card, leftover screen, or misplaced footer?

## 14. Avoid

- Flat webpage cards arranged in repetitive stacks.
- Opaque black canvases or rectangular overlays stamped onto the CRT frame.
- Popup briefings that leave previous-page controls visible behind them.
- Titles cropped by the upper bezel, return controls floating above unused space, or content crossing the terminal hardware.
- Cyan-heavy cyberpunk styling or unrestricted rainbow accents.
- Glassmorphism, generic HUD brackets, and decorative data that communicates nothing.
- Uniform edge glow around every object.
- Overly dense star fields or galaxy paintings that compete with map labels.
- Plastic, over-sharpened, or perfectly symmetrical character faces.
- Random filigree, skulls, cables, or scratches without structural purpose.
- Tiny faux-technical text.
- Official logos, traced character art, copied interface frames, or copied compositions.
- Applying damage before the visible Damage stage.
- Motion blur, constant screen shake, rapid flashes, or interactions that depend on hover.

### Sector route-chart extension — 24 October 2026

Preserve the existing CRT, star signals, pan/zoom and portrait composition. Reveal the entire saved sector network with thin dashed links, a clear start/current position, and future systems glowing neutral grey. Reachable signals retain their existing emission. Difficulty stars occupy their own larger line; keep destination names subordinate to the decision and avoid crowded faction text on locked systems. Do not label ordinary systems POST-WAR CHOICE. DISTRESS marks a survivor rescue, FIELD STORE a supply event. Every signal remains a projected semantic control; unavailable systems are visibly present and disabled.

The compact sector chart uses nine regular battle beacons and a single, clearly labelled FINAL SYSTEM. Keep the boss-tier choice inside its own CRT screen, with large one/two/three-star options, current collected stars, explicit lock requirements and a consistent Cancel return control. Never represent boss difficulty as three separate final destinations. Deployment exposes Cancel beside Battle rather than trapping navigation behind an army-validity requirement.
