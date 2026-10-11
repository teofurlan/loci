---
name: Loci
description: Your neighborhood as a Game Boy-era RPG overworld. Original 16x16 landmark sprites, a handheld dialogue box that speaks each story fragment, a night palette on a black field, pixel type.
colors:
  ground: "#000000"
  text: "#cfc8dc"
  muted: "#8f86a3"
  line: "#4a4160"
  line-strong: "#6e5f92"
  accent: "#6e5f92"
  on-accent: "#ffffff"
  pressed: "#d8ccf2"
  on-pressed: "#000000"
  aura: "#d8ccf2"
  found: "#ffcd75"
  on-found: "#000000"
  plate: "#cfc8dc"
  on-plate: "#000000"
  land: "#100d16"
  building: "#1d1828"
  grass: "#16301f"
  wood: "#1f4a2c"
  water: "#173a5e"
  road-minor: "#3a3250"
  trunk: "#8A4A3A"
  gold: "#FFCD75"
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
  pixel: "stepped corners, profile [2, 1] of 2px rules"
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
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.headline}"
    rounded: "{rounded.pixel}"
    padding: "8px 14px"
    height: "56px"
  button-primary-pressed:
    backgroundColor: "{colors.pressed}"
    textColor: "{colors.on-pressed}"
  button-secondary:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.pixel}"
    padding: "6px 14px"
    height: "44px"
  button-quiet:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pixel}"
    padding: "6px 14px"
  dialogue-box:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.pixel}"
    padding: "10px 12px"
  stamp:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.on-plate}"
    rounded: "{rounded.pixel}"
    width: "40px"
    height: "52px"
  badge-found:
    backgroundColor: "{colors.found}"
    textColor: "{colors.on-found}"
    rounded: "{rounded.pixel}"
    height: "84px"
---

# Design System: Loci (Overworld at night)

Recorded from the shipped build at `fcf5dd1` on `feat/pixel-world` (seed d6ecdf53, code-led). Tokens come from `src/ui/theme/theme.ts` and `palettes.ts`; where the earlier direction contract and the code differ, the code wins and the difference is noted. The colour system was rewritten for the night palette in T5.2 (2026-10-11).

## Overview

**Creative North Star: "The Overworld"**

The walker's neighborhood becomes an RPG overworld, seen at night. Every control is a real landmark drawn as a 16x16 sprite on a recolored map, and each landmark speaks its story fragment in a handheld dialogue box. In the method of loci the place is the memory hook, so the place is the hero of every screen. The era is the first Game Boy monster-RPGs; the homage is to the hardware and the genre, never to a game's content.

The system is one flat night scheme (the system light/dark setting is ignored): every screen sits on the chat home's true black field, with soft lavender text and lines, a violet accent as the single action colour, and gold for found. The user decided on 2026-10-11 that the chat home's black field is the ground of the whole app. Everything is hard-edged on 2 dp rules with stepped ("rounded pixel") corners. Type is pixel faces only. The 4-step fade on "Hide map & start" now takes the map itself down to black (see Palette fade).

Provenance: every sprite is original, drawn from scratch following generic sprite design rules (no copied or traced assets). The Loci path mark comes from the user's own logo work; `assets/branding/loci-mark.svg` is the vector master and `loci-mark-pixel.png` / `.svg` its pixel adaptation, which `src/ui/model/mark.ts` reads cell by cell. The sprite kinds keep their Sweetie 16 tones (GrafxKid, free to use); the UI palette is the night scheme derived from the chat home and approved by the user in `.pi/generated-images/loci-palette-study.html`. Fonts are OFL via `@expo-google-fonts`.

**Key Characteristics:**
- One night scheme on black, no light mode.
- Pixel boxes: a 2 dp line on black, no fill, rounded pixel corners; sprites sit on mist plates.
- 18 landmark sprites plus a "you" sprite, in one shared 3/4 top-down view.
- Jersey 10 speaks, Press Start 2P labels.
- Green only where it means nature: map parks and woods and the park sprite. Found is gold.
- Mobile-first, one-handed, outdoors: 48 dp targets, sp text, English only.

## Colors

A black night world: soft lavender for text and lines, violet as the only call to action, gold for found, and green rationed to nature on the map.

### Primary
- **Violet Accent** (`accent` `#6e5f92`, `on-accent` `#ffffff`): primary buttons, the selected stamp's border, map number tags and the dialogue pointer. A pressed or selected button flips to Pale Aura (`pressed` `#d8ccf2`) with black text (`on-pressed`).
- **Soft Lavender** (`text` `#cfc8dc`): all text and the glyph ink on the black field. `muted` (`#8f86a3`) is secondary text, the quiet button label and the missed badge number.

### Secondary
- **Found Gold** (`found` `#ffcd75`, `on-found` `#000000`): the found state: badge fill on results, found tags, the found flash border. Black text on it.
- **Pale Aura** (`aura` `#d8ccf2`): the aura around Loci and, later, the hint direction text.

### Tertiary (map and sprite colours, not UI chrome)
- **Night map** (`pixel-style.ts` from `MapTokens`): land `#100d16`, buildings `#1d1828`, parks `#16301f`, woods `#1f4a2c`, water `#173a5e`, major roads and wide-road fill `#6e5f92`, minor roads `#3a3250`, boundaries `#4a4160`, labels `#cfc8dc` with a black halo.
- **Trunk Brown** (`trunk`): the park sprite's trunk shade. **Spark Gold** (`gold`): the found sparkle and the warm highlights of artwork, library, square and statue sprites.
- Further sprite tones come from Sweetie 16 and live in `palettes.ts`: reds and corals (`#B13E53`, `#EF7D57`) for worship, artwork, theatre, stadium, tower; blues (`#3B5DC9`, `#29366F`) for playground and station; slate (`#566C86`) for monument, museum, viewpoint; purple (`#5D275D`) for the theatre shade. Every sprite keeps its dark `#1A1C2C` outline.

### Neutral
- **Black Field** (`ground` `#000000`): every screen (setup/chat, memorize, run, results), and the fill of boxes, rows and secondary buttons: a box is a line on black, with no panel fill.
- **Night Line** (`line` `#4a4160`): decorative borders only: dialogue box, chips, quiet buttons, the results map frame, missed badges. It is about 2.2:1 on black, too soft for a control outline.
- **Strong Line** (`line-strong` `#6e5f92`): outlines of interactive controls (secondary buttons), which reach 3:1 on black.
- **Mist Plate** (`plate` `#cfc8dc`, `on-plate` `#000000`): the plate a sprite sits on: stamps, map markers and row sprites.

### Named Rules
**The Meaningful Green Rule.** Green marks nature: map parks and woods and the park sprite, and nothing else. Found is gold, never green. Every other element takes colours suited to what it is.

**The One Action Colour Rule.** Violet belongs to pressable primary actions, the selected stamp, number tags and the dialogue pointer. It flips to Pale Aura when pressed. Nothing else wears it.

**The Black Field Rule.** Every screen sits on the chat home's black ground (decided by the user on 2026-10-11); there is no dark-ink or paper ground. The only other dark ground is Splash Ink, for the opening screen.

**The Strong Outline Rule.** An interactive outline uses `line-strong` (3:1 on black); `line` is decoration only.

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

**The No System Face Rule.** No default sans or serif appears in the UI. MapLibre map labels cannot use the pixel font; they use the style's glyph font, kept sparse, in soft lavender with a black halo.

## Layout

Mobile, single column, Expo Router screens in `src/app`. Spacing is a small hand-set rhythm on a 2 dp rule: 4, 8, 12, 16 and 24 dp, with 48 dp as the minimum touch target (`SHAPE.target`).

- **Memorize** (first viewport): the real MapLibre map takes 55% of window height (minimum 160 dp), yielding at large font scales so two story rows stay visible. Below it: a header row (title, Read aloud), a horizontal stamp strip (40x52 dp stamps, 6 dp gap), the dialogue box filling the remaining height (its header row holds a small waiting Loci, 64 dp wide at one dp per cell and no aura, beside the landmark name and the "Control i of n · m min" line; Loci is decorative and hidden from accessibility because the name already reads; the layout reserves 30 dp extra for the taller header), and the primary "Hide map & start" button in the footer.
- **Run**: the full-height black field, 24 dp side padding, everything centred. "N/M PLACES" counter, the timer in muted label type, Loci with its aura (2 dp per cell, 240 dp, smaller when the window is short), the tracking notice in muted small text under it, then the clue or Loci's message, and at the bottom a secondary Hint button, its cost line and an isolated quiet Give up.
- **Results**: ground, score line, badge case, then the map and the per-control list, with "New course" pinned at the bottom. Badge rows are one row up to four controls, otherwise two balanced rows.
- **Loading**: on the black field, the mark centered and written like handwriting in Loci light `#a99cc2` (the left ring, then one continuous stroke at an even speed, up the slanted strand, over the top and down the stem like a cursive l, then the right ring); the right ring gives way to a gold four-point sparkle, the whole mark turns gold and the logo and star twinkle together. Text-free so it draws before fonts load.

### Known limits
- At font scale 1.3 a 7-line story fragment scrolls inside the dialogue box instead of fitting.
- The mark is not in the setup header: it is 70 dp tall at 1x (60x70 grid), too tall for the header.

## Elevation & Depth

Flat. There are no shadows, gradients or blur anywhere. Depth is conveyed by the 2 dp line outline, tone steps within a sprite, and a 2-row dithered ground shadow drawn as pixels at the foot of each landmark sprite. Pressed buttons flip fill to Pale Aura with black text.

### Named Rules
**The No-Soft-Edges Rule.** No radius, no anti-aliased or blurred or offset shadow. The corner of a pixel box is stepped in two (the "rounded pixel" profile) by painting blocks in the colour behind it.

## Shapes

Hard pixel geometry. Radius is always 0 and corners are stepped: borders are 2 dp rules and `PixelBox corners="round"` steps each corner in two. Buttons, boxes, rows, stamps and badges all use it. The older notched and double-border `PixelBox` modes remain in the component but no screen uses them. Missed badge slots are dashed 2 dp `line` outlines.

Sprites are 16x16 grids with four colours indexed [outline, shade, base, highlight]: a 1 px ink outline, a shade and base tone, one highlight, and a dithered ground shadow in the last two rows, all in one 3/4 top-down view. They draw as crisp rects at integer scales (2x on stamps, 3x on badges and glyph buttons, 6x for the found flash). Small icons are drawn pixel glyphs (`glyphs.ts`: pointer, mic, stop, mark and arrows), never font or emoji glyphs.

The 18 landmark kinds: park, water, monument, artwork, worship, fountain, viewpoint, library, square, other, plus the eight newer museum, theatre, playground, stadium, statue, tower, station, market. Support sprites: you, unknown, found-a, found-b.

The Loci mark is a 60x70 grid (one cell is one art pixel; the opening study derived it from the approved 48 px art, coverage-resampled through a lightly smoothed copy, approved on 2026-10-11) rendered nearest-neighbor (`AppMark`, default 2 dp per cell), recoloured to the text colour. Below roughly 48 dp wide the checkpoint holes fill in, so never draw it below 1 dp per cell. The launcher and adaptive icon assets are separate generated files and keep the 96x112 pixel art.

### Named Rules
**The Integer Scale Rule.** Sprites and the mark render at whole-number multiples of their native grid. Never stretch or smooth.

## Components

### Buttons
- **Shape:** rounded pixel corners on a 2 dp border, always on the black field.
- **Primary** (`PixelButton`, "Hide map & start", "New course"): violet accent fill and border, white headline label, minimum 56 dp tall.
- **Secondary** ("Read aloud", "Hint", "Keep walking", "End run"): black fill, `line-strong` border, text-colour label, 44 dp minimum content plus rules to reach the 48 dp target.
- **Quiet** ("Give up"): black fill, `line` border, muted label.
- **Pressed / selected:** flips to the Pale Aura fill with a black label. Disabled drops to 50% opacity. Loading appends an ellipsis.

### Dialogue box
The handheld box (`DialogueBox`): a `line` border on black with rounded pixel corners, headed with the landmark name in label type. The same box serves memorize and the run screen. The fragment types out at 70 ms per character, one cadence with or without speech (Read aloud). A pixel pointer glyph (a lavender outline with a violet accent fill) sits bottom-right, shows only after typing finishes, and blinks every 500 ms; tapping it advances to the next landmark and highlights its sprite on the map. Tapping the text reveals the whole fragment. The full text reserves height so the box never jumps while typing.

### Stamps and stamp strip
Number above a 2x kind sprite on a 40x52 mist plate with black text; the selected stamp takes a violet accent border. The strip scrolls horizontally and jumps between controls.

### Map
The OpenFreeMap style is recoloured by `pixel-style.ts` into the night map: land `#100d16`, buildings `#1d1828`, parks `#16301f` and woods `#1f4a2c` (the only greens on screen), water `#173a5e`, major roads and the wide-road fill lavender `#6e5f92`, minor roads `#3a3250`, boundaries `#4a4160`. A 16x16 landmark sprite on a mist plate with a violet number tag (gold with black text once found) marks each control; a missed control on the results map is a black plate with a `line` border. A "you" sprite marks the start. Attribution stays visible in a black box with a `line` border. Labels are sparse lavender with a black halo.

### Palette fade
On "Hide map & start" the map steps down to black in four hard cuts: a black overlay over the map at 25, 50, 75 and 100% opacity, 140 ms each (`mapFadeSequence`), like the overworld disappearing step by step; then the run begins on the black field. Reduced motion is a single instant cut to black.

### Run screen
The black field with soft lavender text: "N/M PLACES", the timer, Loci centred in its aura, a secondary Hint button, and an isolated quiet Give up behind a confirm step (the confirmation box takes the place of the buttons). Loci is decorative (hidden from screen readers; the texts say everything) and its state follows the walk (`runLociState`): waiting while idle and while the give-up confirmation is shown; listening from the Hint tap until the hint exists (a GPS fix, the computing); the hint pose while the clue is said or typed, then waiting again; celebrating for 3 s after a find. A hint speaks the nearest missing fragment, then its direction, and shows them under Loci, centred and without a box: the fragment in body text, the direction (`hintSentence`) in Pale Aura. The fragment types out on the speech start event (70 ms per character) and its space is reserved so nothing jumps; the clue is a polite live region. Hinted finds score half. A find plays a two-frame flash (`found-a`, `found-b`, 6x on a 96x96 mist plate with a gold border) with vibration, in the message slot under Loci so it never covers it. "Still waiting for a GPS fix" is said under Loci like any Loci message. The stage is sized once from the window (`runStageSize`: whole dp per cell, 1 to 3) so everything fits a 360 x 760 dp phone at font scale 1.0; the message slot scrolls if a clue is long.

### Results badge case
One slot per control. Found: a Found Gold box with rounded pixel corners, kind sprite at 3x and the number in black. Hinted: the same with a small pixel "?" in the corner. Missed: a dashed `line` outline with a muted number. Score line: "N of M controls visited · P points".

### Loading screen
Dark: the field is the app ground, black `#000000`, for the whole sequence, native splash included, because gold reads best on black; the status and navigation bar icons are light while it shows. The mark is the 60 x 70 grid (one cell is one art pixel) centered at 163/60 dp per cell, about 163 dp wide (a deliberate non-integer deviation from the integer-scale rule; the native splash image is fully transparent, so there is no image hand-over to match, only the background colour). On cold start the mark is written like handwriting, in Loci light `#a99cc2` (8.2:1 on black, a clearly different hue from gold): nothing is drawn at first, the left checkpoint ring is drawn in 175 ms as the pen's starting point (7% of the writing), then the stroke grows from it at a constant speed along its arc length (2.2 s, redrawn every frame), up the slanted right strand, counter-clockwise over the top of the loop, down the left stem (crossing the upstroke) and across the bottom curve, and the right ring is drawn clockwise as the pen arrives (125 ms, 5%), 2.5 s in all. The drawn part is one connected stroke ending at the pen tip (bar the ring's two east-wall cells, which show beside the ring for its 125 ms): each cell takes the distance of the first pass of a hand-placed centre line within a stroke half-width of it, and a cell the stroke has not yet touched waits for it (the loop's two passes cross near its base); the centre line, the ring boxes and the star live in the original 96-wide mark space and map onto the grid by cell centre (cell size 96/60). The right checkpoint ring is then replaced by a gold four-point sparkle (an astroid, 15 source cells in radius, centred on the ring; a diamond light core `#fff3d6` on the bright frame), the whole mark turns gold `#ffcd75` (14.2:1 on black), and the logo and the star twinkle together, in phase, in 220 ms frames (its own constant; the run screen's found flash keeps 200 ms) alternating the bright frame (gold mark, full star with its light core) and the dim frame (mark in a half-strength gold `#806a46`, 4.1:1 on black, with the star at 62% of its radius in that same dim gold, no core); the star is always exactly the logo's colour (bar the core), it starts and ends bright, two twinkles (five frames), 1.1 s in all. The trace clock starts after the first frame has painted and advances at most 20 ms per tick, so a busy start-up slows the pen but never makes it jump ahead. The screen stays until the animation and the fonts are both done, and plays once per cold start (about 3.6 s). The native splash image is fully transparent, so the first screen is plain black (the same `#000000` as the JS screen) and the pen starts writing on that field with no hand-over to see; it is generated by `scripts/generate-splash-icon.js`. Under reduced motion the final state (gold mark, full star with its core, no twinkle) shows still for 0.5 s.

### Launcher icon and native splash
`app.json` sets the splash background to black `#000000` (light and dark), image `splash-icon.png` (fully transparent, so the splash is plain black; see Loading screen) at 192 dp wide, resizeMode contain. Changing the native splash colour needs a native rebuild (a release or dev-client build, not Metro): it is done once, at the end of the opening-screen work, so until then the native splash still shows the old `#1A1C2C` for a moment before the black JS screen. The adaptive icon background is Paper Mist `#C9D8E1` (an icon-only colour, not a UI token) with the ink mark as foreground and a black monochrome layer. `icon.png` and both adaptive layers are generated from `loci-mark-pixel.png`, nearest-neighbor 4x (5x for `icon.png`), recoloured to ink, centered on a 1024 canvas (the splash image is the exception: it is blank); provenance is in `assets/splash-icon.source.txt`. The app is light-only (`userInterfaceStyle: light`).

### Named Rules
**The One Cadence Rule.** Every typed fragment uses the same 70 ms per character; speech is matched to it, never the reverse. Speech uses the best voice Android already offers for the story language (`pickVoice`): an exact locale, then the base language, Enhanced over Default, and never a "network" voice, because the walk has no signal; with no match the engine default speaks.

## Do's and Don'ts

### Do:
- **Do** use the one night palette in a single scheme, ignoring the system theme.
- **Do** build every box from `PixelBox corners="round"`: a 2 dp rule, 0 radius, stepped corners, no fill on black.
- **Do** set story text in Jersey 10 and labels and numbers in Press Start 2P, at the sizes in the ramp.
- **Do** draw new landmark kinds as original 16x16 grids with a 1 px ink outline, base plus shade, one highlight, and the dithered shadow, then add them to `palettes.ts`; they sit on a mist plate.
- **Do** render sprites and the mark at integer scales only.
- **Do** keep green for map parks, woods and the park sprite; found is gold.
- **Do** reserve the violet accent for pressable primary actions, the selected stamp, number tags and the pointer, outline controls with `line-strong`, and keep targets at 48 dp or more.
- **Do** honour reduced motion: the fade becomes one cut, blinks stop and the opening writing is skipped.

### Don't:
- **Don't** add radii, blurred or offset shadows, gradients or glass.
- **Don't** put a light or paper ground behind a screen, or fill a box: the field is black and boxes are lines.
- **Don't** copy another game's sprites, creatures, fonts, badges, place names or UI text; assets stay original or the user's own logo work.
- **Don't** put green on anything that is not nature, and never use it for found.
- **Don't** use `line` as the outline of a control: it is 2.2:1 on black.
- **Don't** use emoji, font glyphs or a system face for icons or display text.
- **Don't** stretch, smooth or shrink the mark below scale 1.
- **Don't** inherit the recorded drift below as a rule for new surfaces.

### Recorded drift and limits (not rules)
- Seven-line fragments scroll at font scale 1.3.
- The mark is absent from the setup header because it is too tall at integer scale.
- The `found-a` flash frame is drawn only in ink (corner brackets) and `found-b` adds gold (corner sparkles); the two frames differ in colour as well as shape.
- The adaptive-icon mark is small inside the safe zone, so it reads small on some launcher masks.
- Pixelify Sans from the contract was replaced by Jersey 10 (see Typography).
