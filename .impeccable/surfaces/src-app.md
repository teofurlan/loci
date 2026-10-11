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
  - NOT all green (added after the first build): every element gets colors suited to what it is, and green is used only where it marks a difference.
- IP rule: every sprite, glyph, name and line of copy is original. Homage the era and the handheld hardware, never copy a game's characters, creatures, sprites, fonts, badges, place names or UI text.

## Chosen direction
Overworld. The parent's pick (seed d6ecdf53, which assigned Dungeon Floor). The user first chose Dungeon Floor, then switched to Overworld after comparing them, because in the method of loci the PLACE is the memory hook.

Memorable moment: tapping "Hide map & start". The screen fades through the four greens to the darkest one, Game Boy style, and the overworld disappears.

## Direction contract
- **THESIS:** Your neighborhood becomes an RPG overworld. Every control is a real landmark drawn as a sprite, and each landmark "speaks" its fragment of the story in a dialogue box. That spoken fragment is what you carry in your head. It refuses the category default: a full-bleed map with pins and a bottom sheet.
- **OWN-WORLD:**
  - Palette: Sweetie 16 by GrafxKid (a free, widely used 16-color pixel palette), chosen by the user from three captured options. One scheme, which ignores the system light/dark setting:
    - ground `#94B0C2`
    - panel `#C9D8E1`
    - ink `#1A1C2C`
    - muted `#333C57`
    - action `#B13E53` on `#F4F4F4`
    - run field `#1A1C2C` with `#F4F4F4` text
  - Green is meaningful only. `#38B764` and `#A7F070` appear only on parks and grass on the map, on the park sprite and on the "found" state.
  - Map terrain language:
    - land `#C9D8E1`
    - park `#A7F070`, wood `#38B764`
    - water `#41A6F6`
    - roads `#1A1C2C`
    - buildings `#94B0C2`
  - Each LandmarkKind sprite uses its own Sweetie 16 colors: water blues, brick reds for worship, stone greys for monuments, warm yellows and corals for artwork and library.
  - The action color appears only on pressable primary actions.
  - No pure black or white grounds, and no orange-on-black.
  - Hard pixel edges: 0 radius, 2 dp borders drawn as pixel steps, no anti-aliased shadows.
  - Sprites: 16×16 on an integer scale, with a 1 px ink outline, base plus shade, one highlight, a dithered ground shadow, and one shared 3/4 top-down view.
  - Type: Pixelify Sans for the story and body, and Press Start 2P for labels and numbers, both OFL via @expo-google-fonts.
- **STORY:** The walker understands that every sprite is a real named place, and that what it "says" is the clue to find it again without the map. They believe the game is fair: hints and giving up are visible and cost points. They read once, hear it, tap "Hide map & start", and walk.
- **FIRST VIEWPORT:** The memorize screen.
  - The top ~55% (responsive to font scale, as today) is the real MapLibre map, recolored in the terrain language. A pixel "you" sprite marks the start, and a 16×16 landmark sprite per control shows its kind (tree, fountain, statue, bell tower, book, bench or plaza tile, viewpoint, water, frame, signpost), with its number on a small pixel tag. No legs.
  - Below is a strip of stamp-sized control thumbnails (number plus kind sprite) to jump between controls.
  - At the bottom is a bordered dialogue box, in the classic double-border handheld style, headed with the landmark's name. Its fragment types out at one cadence, matched to TTS when Read aloud is on. A blinking ▼ advances to the next landmark and highlights its sprite.
  - The primary action "Hide map & start" is an action-colored pixel button.
- **SIGNATURE:** on start, a 4-step palette fade from ground to the run field.
- **RUN:** a deep `#1A1C2C` field with light text: "N/M PLACES", the timer, a Hint button (the landmark's fragment is spoken and shown in a dialogue box with a direction), and an isolated Give up.
- **PUNCH:** the landmark sprite does a 2-frame "found" animation, with vibration.
- **RESULTS:** a badge case. Each found place earns an original pixel badge carrying its kind sprite. Hinted finds carry a small pixel "?" mark, and missed slots stay as empty outlines. The score line reads "N of M controls visited · P points", followed by the map reveal.
- **FORM:** Game Boy-era RPG overworld, position 1 on the parent's ordered list (the IMPECCABLE'S PICK card). Seed key: d6ecdf53.
- **FINISH:** "unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance"

## Raises kept from declined challengers
- Orienteering map: a fixed terrain color language under the course.
- Warm consumer app: the action color is used only on pressable primary actions.
- Doujin catalog: a stamp-sized sprite plus number per control, reused on map, strip and results.
- Split-flap board: one synchronized typewriter cadence for the story.
- Saville catalog: the control number is the only headline; nothing is labeled twice.
- Cassette: walking minutes per control, totaling the requested time.

## Unresolved
- The MapLibre glyphs cannot use the pixel font, so map labels stay sparse in ink using an available glyph font. Verify they are legible.
- Sprite authoring: there is no image generation, so sprites are authored as 16×16 pixel grids in code and rendered as crisp rects, or as PNGs generated from those grids with their provenance recorded.
