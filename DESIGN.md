---
name: Loci
description: Your neighborhood as a Game Boy-era RPG overworld. Original 16x16 landmark sprites, a handheld dialogue box that speaks each story fragment, Sweetie 16 colour, pixel type.
colors:
  ground: "#94B0C2"
  panel: "#C9D8E1"
  ink: "#1A1C2C"
  muted: "#333C57"
  action: "#B13E53"
  on-action: "#F4F4F4"
  run-field: "#1A1C2C"
  run-text: "#F4F4F4"
  found: "#38B764"
  grass: "#A7F070"
  trunk: "#8A4A3A"
  water: "#41A6F6"
  gold: "#FFCD75"
  boundary: "#566C86"
typography:
  display:
    fontFamily: "Press Start 2P, monospace"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: "32px"
  headline:
    fontFamily: "Press Start 2P, monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "26px"
  title:
    fontFamily: "Jersey 10, monospace"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: "34px"
  label:
    fontFamily: "Press Start 2P, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "20px"
  body:
    fontFamily: "Jersey 10, monospace"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: "30px"
  body-small:
    fontFamily: "Jersey 10, monospace"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: "26px"
rounded:
  none: "0px"
spacing:
  rule: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  target: "48px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-action}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "8px 14px"
    height: "56px"
  button-primary-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-action}"
  button-secondary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-action}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "6px 14px"
    height: "44px"
  button-on-ink:
    backgroundColor: "{colors.run-field}"
    textColor: "{colors.run-text}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "6px 14px"
  button-on-ink-pressed:
    backgroundColor: "{colors.run-text}"
    textColor: "{colors.run-field}"
  dialogue-box:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
  stamp:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    width: "40px"
    height: "52px"
  badge-found:
    backgroundColor: "{colors.found}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "84px"
---

# Design System: Loci (Overworld)

Recorded from the shipped build at `fcf5dd1` on `feat/pixel-world` (seed d6ecdf53, code-led). Tokens come from `src/ui/theme/theme.ts` and `palettes.ts`; where the earlier direction contract and the code differ, the code wins and the difference is noted.

## Overview

**Creative North Star: "The Overworld"**

The walker's neighborhood becomes an RPG overworld. Every control is a real landmark drawn as a 16x16 sprite on a recolored map, and each landmark speaks its story fragment in a handheld dialogue box. In the method of loci the place is the memory hook, so the place is the hero of every screen. The era is the first Game Boy monster-RPGs; the homage is to the hardware and the genre, never to a game's content.

The system is one flat scheme (the system light/dark setting is ignored): a blue-grey ground, pale panel paper, deep ink, and a single crimson action colour. Everything is hard-edged with 0 radius and 2 dp rules. Type is pixel faces only. The run screen drops to a deep ink field with light text. The signature moment is the 4-step palette fade from ground to run field when the walker taps "Hide map & start".

Provenance: every sprite is original, drawn from scratch following generic sprite design rules (no copied or traced assets). The Loci path mark comes from the user's own logo work; `assets/branding/loci-mark.svg` is the vector master and `loci-mark-pixel.png` / `.svg` its pixel adaptation, which `src/ui/model/mark.ts` reads cell by cell. The palette is Sweetie 16 by GrafxKid (free to use), chosen by the user from three captured options. Fonts are OFL via `@expo-google-fonts`.

**Key Characteristics:**
- One Sweetie 16 scheme, no dark mode.
- Pixel boxes: 2 dp ink rules, stepped (notched) corners, a double border for emphasis.
- 18 landmark sprites plus a "you" sprite, in one shared 3/4 top-down view.
- Jersey 10 speaks, Press Start 2P labels.
- Green only where it means nature or "found".
- Mobile-first, one-handed, outdoors: 48 dp targets, sp text, English only.

## Colors

A cool blue-grey world with crimson as the only call to action and green rationed to nature and success.

### Primary
- **Crimson Button** (`action`): the pressable fill for primary and secondary buttons. Text on it is Screen White (`on-action`). Never used on non-pressable elements.

### Secondary
- **Found Green** (`found`): the found state only: badge fill on results, found tags. Ink text on it.
- **Park Lime** (`grass`): parks, gardens and plazas on the map; the highlight of the park sprite.

### Tertiary (map and sprite colours, not UI chrome)
- **Map Water Blue** (`water`): water polygons and waterways on the map, water sprite base.
- **Trunk Brown** (`trunk`): the park sprite's trunk shade.
- **Spark Gold** (`gold`): the gold of the found sparkle and the warm highlights of artwork, library, square and statue sprites.
- Further sprite tones come from Sweetie 16 and live in `palettes.ts`: reds and corals (`#B13E53`, `#EF7D57`) for worship, artwork, theatre, stadium, tower; blues (`#3B5DC9`, `#29366F`) for playground and station; slate (`#566C86`) for monument, museum, viewpoint; purple (`#5D275D`) for the theatre shade.

### Neutral
- **Harbor Haze** (`ground`): the screen ground on setup, memorize and results.
- **Paper Mist** (`panel`): dialogue boxes, stamps, menu rows, map plates and map land.
- **Night Ink** (`ink`): all text and lines on ground or panel, roads, sprite outlines. Also the run field (`run-field`) with `run-text` (#F4F4F4), and the opening loading screen and native splash ground.
- **Dusk Slate** (`muted`): secondary text and minor roads.
- Map-only: boundary `#566C86`, label halo `#F4F4F4`, buildings and wide-road fill `#94B0C2`.

### Named Rules
**The Meaningful Green Rule.** Green marks parks, woods, the park sprite and the found state, and nothing else. Every other element takes colours suited to what it is. The map is not all green; it is green where there is green.

**The One Action Colour Rule.** Crimson belongs to pressable primary actions. It flips to ink when pressed. No other element wears it.

**The No-Black-Slab Rule.** Grounds are never pure black or white. The deepest field is Night Ink `#1A1C2C`, used for the run screen and nothing larger.

## Typography

**Display / Label Font:** Press Start 2P (with monospace fallback)
**Body Font:** Jersey 10 (with monospace fallback)

**Character:** Jersey 10 is a warm, legible pixel face that carries the story; Press Start 2P is the wide, chunky console face for names, buttons and numbers.

Deviation from the contract: the contract named Pixelify Sans for body. The build ships Jersey 10 because Pixelify Sans failed two checks (its 5 read as an S, and it lacks the (c) sign needed for map attribution). Both faces load in `src/app/_layout.tsx` via `useFonts`; there is only one weight (400), so `bodyBold` aliases the same face.

### Hierarchy
- **Display** (Press Start 2P 400, 22/32): rare large headings.
- **Headline** (Press Start 2P 400, 16/26): the primary button label and screen headings.
- **Title** (Jersey 10 400, 30/34): course and screen titles.
- **Body** (Jersey 10 400, 26/30): the story fragment in the dialogue box.
- **Body Small** (Jersey 10 400, 22/26): metadata lines such as "Control 1 of 4 · 8 min".
- **Label** (Press Start 2P 400, 12/20): speaker names, secondary buttons, the run counter. Badge and stamp numbers use 11/14 with font scaling off.

### Named Rules
**The Two Faces Rule.** Jersey 10 speaks; Press Start 2P labels. Press Start 2P is wide, so keep it short and sparse. All text scales with the system font size, and wide labels cap it with `maxFontSizeMultiplier` (1.2 to 1.3).

**The No System Face Rule.** No default sans or serif appears in the UI. MapLibre map labels cannot use the pixel font; they use the style's glyph font, kept sparse, in ink with a light halo.

## Layout

Mobile, single column, Expo Router screens in `src/app`. Spacing is a small hand-set rhythm on a 2 dp rule: 4, 8, 12, 16 and 24 dp, with 48 dp as the minimum touch target (`SHAPE.target`).

- **Memorize** (first viewport): the real MapLibre map takes 55% of window height (minimum 160 dp), yielding at large font scales so two story rows stay visible. Below it: a header row (title, Read aloud), a horizontal stamp strip (40x52 dp stamps, 6 dp gap), the dialogue box filling the remaining height, and the primary "Hide map & start" button in the footer.
- **Run**: a full-height ink field, 24 dp side padding. "N/M PLACES" counter, timer, Hint button, a scrolling hint dialogue, and an isolated Give up.
- **Results**: ground, score line, badge case, then the map and the per-control list, with "New course" pinned at the bottom. Badge rows are one row up to four controls, otherwise two balanced rows.
- **Loading**: on the dark run-field ground, the mark centered exactly where the native splash would draw it, written like handwriting in Harbor Haze (the left ring, then one continuous stroke at an even speed, up the slanted strand, over the top and down the stem like a cursive l, then the right ring); the right ring gives way to the gold found star, the whole mark turns gold and the logo and star twinkle together. Text-free so it draws before fonts load.

### Known limits
- At font scale 1.3 a 7-line story fragment scrolls inside the dialogue box instead of fitting.
- The mark is not in the setup header: at the integer scale it is too tall (96x112 at 1x).

## Elevation & Depth

Flat. There are no shadows, gradients or blur anywhere. Depth is conveyed by the 2 dp ink outline, the double border (two rules with a gap of fill) on emphasis, tone steps within a sprite, and a 2-row dithered ground shadow drawn as pixels at the foot of each landmark sprite. Pressed buttons flip fill (crimson to ink; on the run field, dark to light).

### Named Rules
**The No-Soft-Edges Rule.** No radius, no anti-aliased or blurred or offset shadow. The corner of a pixel box is stepped by painting a rule-sized notch in the colour behind it.

## Shapes

Hard pixel geometry. Radius is always 0. Borders are 2 dp ink (light on the run field), with corners notched one rule wide (`PixelBox`). The double border is two rules separated by a rule of fill. Missed badge slots are dashed 2 dp ink outlines.

Sprites are 16x16 grids with four colours indexed [outline, shade, base, highlight]: a 1 px ink outline, a shade and base tone, one highlight, and a dithered ground shadow in the last two rows, all in one 3/4 top-down view. They draw as crisp rects at integer scales (2x on stamps, 3x on badges and glyph buttons, 6x for the found flash). Small icons are drawn pixel glyphs (`glyphs.ts`: pointer, mic, stop, mark and arrows), never font or emoji glyphs.

The 18 landmark kinds: park, water, monument, artwork, worship, fountain, viewpoint, library, square, other, plus the eight newer museum, theatre, playground, stadium, statue, tower, station, market. Support sprites: you, unknown, found-a, found-b.

The Loci mark is a 96x112 grid rendered nearest-neighbor at integer multiples (`AppMark`, default 2x), recoloured to ink. Below roughly 48 dp the checkpoint holes fill in, so never draw it below scale 1.

### Named Rules
**The Integer Scale Rule.** Sprites and the mark render at whole-number multiples of their native grid. Never stretch or smooth.

## Components

### Buttons
- **Shape:** 0 radius, 2 dp ink border; the primary button gets the double border.
- **Primary** (`PixelButton`, "Hide map & start", "New course"): crimson fill, Screen White headline label, minimum 56 dp tall.
- **Secondary** ("Read aloud"): single border, crimson fill, label type, 44 dp minimum content plus rules to reach the 48 dp target.
- **On-ink** (run screen: Hint, Give up): run-field fill with light border and text; pressed or selected inverts to a light fill with dark text.
- **Pressed / selected:** flips to an ink fill. Disabled drops to 50% opacity. Loading appends an ellipsis.

### Dialogue box
The double-bordered handheld box (`DialogueBox`) on a Paper Mist fill, headed with the landmark name in label type. A `dark` tone exists for the run screen. The fragment types out at 70 ms per character, one cadence with or without speech (Read aloud). A pixel pointer glyph (ink outline with a crimson fill) sits bottom-right, shows only after typing finishes, and blinks every 500 ms; tapping it advances to the next landmark and highlights its sprite on the map. Tapping the text reveals the whole fragment. The full text reserves height so the box never jumps while typing.

### Stamps and stamp strip
Number above a 2x kind sprite on a 40x52 panel box; the selected stamp takes the double border. The strip scrolls horizontally and jumps between controls.

### Map
The OpenFreeMap style is recoloured by `pixel-style.ts` into one terrain language: land Paper Mist, parks Park Lime and woods Found Green (the only large green on screen), water Map Water Blue, major roads ink, minor roads Dusk Slate, wide-road fill and buildings Harbor Haze. A 16x16 landmark sprite on a panel plate with a number tag marks each control; a "you" sprite marks the start. Attribution stays visible. Labels are sparse ink with a light halo.

### Palette fade (signature)
On "Hide map & start" the screen steps through four tones from ground to run field, one hard cut per tone, 140 ms each (`fadeSequence`). Reduced motion is a single instant cut.

### Run screen
Deep ink field with light text: "N/M PLACES", the timer, Hint, and an isolated Give up behind a confirm step. A hint speaks the nearest missing fragment and shows it in a dark dialogue box with a direction; hinted finds score half. A find plays a two-frame flash (`found-a`, `found-b`, 6x on a 96x96 plate) with vibration.

### Results badge case
One slot per control. Found: Found Green box with double border, kind sprite at 3x and the number. Hinted: the same with a small pixel "?" in the corner. Missed: a dashed ink outline with the number. Score line: "N of M controls visited · P points".

### Loading screen
Dark: the ground is the run-field ink `#1A1C2C` for the whole sequence, native splash included, because gold reads best on black; the status and navigation bar icons are light while it shows. The mark is centered at 1.7 dp per mark cell (a deliberate non-integer deviation from the integer-scale rule: the Android 12+ splash draws the 192 dp image at about 0.85 of its size, and the first JS frame has to land on the native one). On cold start the mark is written like handwriting, in Harbor Haze `#94B0C2` (7.4:1 on ink, and a clearly different hue from gold): nothing is drawn at first, the left checkpoint ring is drawn in 140 ms as the pen's starting point, then the stroke grows from it at a constant speed along its arc length (about 2 mark cells of pen travel per 60 Hz frame, redrawn every frame, 1.76 s), up the left side, over the top of the loop, down the right side and across the bottom curve, and the right ring is drawn as the pen arrives (100 ms), 2.0 s in all. The drawn part is always one connected stroke ending at the pen tip: each cell takes the distance of the nearest point of a hand-placed centre line, and a cell the stroke has not yet touched waits for it (the loop's two passes cross near its base). The right checkpoint ring is then replaced by the gold found star (the `found-b` sprite at 4 cells per pixel, centred on the ring), the whole mark turns gold `#FFCD75` (11.4:1 on ink), and the logo and the star twinkle together, in phase, on the found-flash cadence: 200 ms frames alternating the bright frame (gold mark, full star `found-b`) and the dim frame (mark in a half-strength gold `#8D7451`, 3.8:1 on ink, with the small cross `found-a` in that same dim gold); the star is always exactly the logo's colour and nothing in the finale is blue; it starts and ends bright, two blinks, 1.0 s in all. The trace clock starts after the first frame has painted and advances at most 20 ms per tick, so a busy start-up slows the pen but never makes it jump ahead. The screen stays until the animation and the fonts are both done, and plays once per cold start (about 3 s). The native splash image is fully transparent, so the first screen is plain ink (the same `#1A1C2C` as the JS screen) and the pen starts writing on that ground with no hand-over to see; it is generated by `scripts/generate-splash-icon.js`. Under reduced motion the final state (gold mark, full star, no twinkle) shows still for 0.5 s.

### Launcher icon and native splash
`app.json` sets the splash background to Night Ink `#1A1C2C` (light and dark), image `splash-icon.png` (fully transparent, so the splash is plain ink; see Loading screen) at 192 dp wide, resizeMode contain. The adaptive icon background is Paper Mist `#C9D8E1` with the ink mark as foreground and a black monochrome layer. `icon.png` and both adaptive layers are generated from `loci-mark-pixel.png`, nearest-neighbor 4x (5x for `icon.png`), recoloured to ink, centered on a 1024 canvas (the splash image is the exception: it is the generated first frame of the opening animation, which is blank); provenance is in `assets/splash-icon.source.txt`. The app is light-only (`userInterfaceStyle: light`).

### Named Rules
**The One Cadence Rule.** Every typed fragment uses the same 70 ms per character; speech is matched to it, never the reverse.

## Do's and Don'ts

### Do:
- **Do** use the one Sweetie 16 palette in a single scheme, ignoring the system theme.
- **Do** build every box from `PixelBox`: 2 dp ink rule, 0 radius, stepped corners.
- **Do** set story text in Jersey 10 and labels and numbers in Press Start 2P, at the sizes in the ramp.
- **Do** draw new landmark kinds as original 16x16 grids with a 1 px ink outline, base plus shade, one highlight, and the dithered shadow, then add them to `palettes.ts`.
- **Do** render sprites and the mark at integer scales only.
- **Do** keep green for parks, woods, the park sprite and the found state.
- **Do** reserve crimson for pressable primary actions, and keep targets at 48 dp or more.
- **Do** honour reduced motion: the fade becomes one cut, blinks stop and the opening writing is skipped.

### Don't:
- **Don't** add radii, blurred or offset shadows, gradients or glass.
- **Don't** use pure black or white grounds, or orange on black.
- **Don't** copy another game's sprites, creatures, fonts, badges, place names or UI text; assets stay original or the user's own logo work.
- **Don't** put green on anything that is not nature or found.
- **Don't** use emoji, font glyphs or a system face for icons or display text.
- **Don't** stretch, smooth or shrink the mark below scale 1.
- **Don't** inherit the recorded drift below as a rule for new surfaces.

### Recorded drift and limits (not rules)
- Seven-line fragments scroll at font scale 1.3.
- The mark is absent from the setup header because it is too tall at integer scale.
- The `found-a` flash frame is drawn only in ink (corner brackets) and `found-b` adds gold (corner sparkles); the two frames differ in colour as well as shape.
- The adaptive-icon mark is small inside the safe zone, so it reads small on some launcher masks.
- Pixelify Sans from the contract was replaced by Jersey 10 (see Typography).
