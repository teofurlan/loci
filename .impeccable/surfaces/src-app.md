---
version: 1
slug: "src-app"
primary_target: "src/app"
related_targets: []
---

# Surface brief: Loci app screens (setup, memorize, run, results). Pixel world.

## Scope and mode
- Scope: the whole native app flow in `src/app` (Expo Router). It covers setup (with the T9 mic), memorize, run and results, plus loading, empty, error and permission states.
- This is a REDESIGN that replaces the Control Sheet world. The old look is evidence, not authority.
- Mode: Operate. Material 3 structure stays: system Back, insets, 48 dp targets and sp text. The brand is expressed through the pixel world.

## Audience, job, constraints
- Casual walkers. Set a course, look once, put the phone away, walk, get scored. Used outdoors in daylight, one-handed.
- English UI. The device is never locked.
- Pinned by the user:
  - Pixel art in the spirit of the first Game Boy monster-RPGs (the Red/Yellow era).
  - The map must show green areas.
  - Less black.
  - It must not read as orange-on-black branding.
- IP rule: every sprite, glyph, name and line of copy is original. Homage the era and the handheld hardware, never copy a game's characters, creatures, sprites, fonts, badges, place names or UI text.

## Chosen direction
Overworld. The parent's pick (seed d6ecdf53, which assigned Dungeon Floor). The user first chose Dungeon Floor, then switched to Overworld after comparing them, because in the method of loci the PLACE is the memory hook.

Memorable moment: tapping "Hide map & start". The screen fades through the four greens to the darkest one, Game Boy style, and the overworld disappears.

## Direction contract
- **THESIS:** Your neighborhood becomes an RPG overworld. Every control is a real landmark drawn as a sprite, and each landmark "speaks" its fragment of the story in a dialogue box. That spoken fragment is what you carry in your head. It refuses the category default: a full-bleed map with pins and a bottom sheet.
- **OWN-WORLD:**
  - One self-contained 4-shade handheld LCD palette, with no system light or dark split:
    - ink `#0F380F`
    - shade `#306230`
    - ground `#8BAC0F`
    - lit `#9BBC0F`
  - In UI chrome, lit is reserved for things you can press: buttons, the tappable dialogue box, landmark sprites and example rows.
  - The map is terrain, with its own fixed language:
    - parks and grass: lit
    - land: ground
    - water: shade
    - roads: ink lines
    - buildings: shade, quiet
  - No black, white, orange or purple anywhere.
  - Hard pixel edges: 0 radius, 2 dp borders drawn as pixel steps, no anti-aliased shadows. Sprites are 16×16 on an integer scale.
  - Type: a readable pixel face for the story and body (for example Pixelify Sans) and a chunky pixel face for labels and numbers (for example Press Start 2P), both OFL via @expo-google-fonts.
- **STORY:** The walker understands that every sprite is a real named place, and that what it "says" is the clue to find it again without the map. They believe the game is fair: hints and giving up are visible and cost points. They read once, hear it, tap "Hide map & start", and walk.
- **FIRST VIEWPORT:** The memorize screen.
  - The top ~55% (responsive to font scale, as today) is the real MapLibre map, recolored in the terrain language. A pixel "you" sprite marks the start, and a 16×16 landmark sprite per control shows its kind (tree, fountain, statue, bell tower, book, bench or plaza tile, viewpoint, water, frame, signpost), with its number on a small pixel tag. No legs.
  - Below is a strip of stamp-sized control thumbnails (number plus kind sprite) to jump between controls.
  - At the bottom is a bordered dialogue box, in the classic double-border handheld style, headed with the landmark's name. Its fragment types out at one cadence, matched to TTS when Read aloud is on. A blinking ▼ advances to the next landmark and highlights its sprite.
  - The primary action "Hide map & start" is a lit pixel button.
- **SIGNATURE:** the 4-step palette fade to ink on start.
- **RUN:** an ink field with lit text: "N/M PLACES", the timer, a Hint button (the landmark's fragment is spoken and shown in a dialogue box with a direction), and an isolated Give up.
- **PUNCH:** the landmark sprite does a 2-frame "found" animation, with vibration.
- **RESULTS:** a badge case. Each found place earns an original pixel badge carrying its kind sprite. Hinted finds carry a small pixel "?" mark, and missed slots stay as empty outlines. The score line reads "N of M controls visited · P points", followed by the map reveal.
- **FORM:** Game Boy-era RPG overworld, position 1 on the parent's ordered list (the IMPECCABLE'S PICK card). Seed key: d6ecdf53.
- **FINISH:** "unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance"

## Raises kept from declined challengers
- Orienteering map: a fixed terrain color language under the course.
- Warm consumer app: lit is used only on pressable chrome.
- Doujin catalog: a stamp-sized sprite plus number per control, reused on map, strip and results.
- Split-flap board: one synchronized typewriter cadence for the story.
- Saville catalog: the control number is the only headline; nothing is labeled twice.
- Cassette: walking minutes per control, totaling the requested time.

## Unresolved
- The MapLibre glyphs cannot use the pixel font, so map labels stay sparse in ink using an available glyph font. Verify they are legible.
- Sprite authoring: there is no image generation, so sprites are authored as 16×16 pixel grids in code and rendered as crisp rects, or as PNGs generated from those grids with their provenance recorded.
