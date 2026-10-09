---
version: 1
slug: "src-app"
primary_target: "src/app"
related_targets: []
---

# Surface brief: Loci app screens (setup, memorize, run, results)

## Scope and mode
- Scope: the whole native app flow in `src/app` (Expo Router). The four screens are setup, memorize, run and results, plus their loading, empty and error states.
- Mode: Operate. Material 3 governs structure, navigation, system Back, insets and touch targets. The brand is expressed through Material theming.

## Audience, job, constraints
- Casual walkers. Set a course, look once, put the phone away, walk, get scored.
- Used outdoors in daylight and glare, with one hand. Type size follows the system (sp units). Touch targets are at least 48 dp.
- English UI. The device is never locked, so calls and emergency help stay reachable.

## Chosen direction
Control Sheet: orienteering Score-O. It was the parent's pick, chosen by the user on the decision page.

Memorable moment: hiding the map. The overprint collapses to its numbers and the sheet drops to black.

## Direction contract
- **THESIS:** Every walk is a Score-O orienteering course. The landmarks are controls that can be punched in any order, and the story is the control description you carry in your head. It refuses the category default: a full-bleed map with a bottom sheet and pins.
- **OWN-WORLD:**
  - Palette: pure white description-card paper (never cream), ink `#111111`, control-flag orange `#F26B1D` with its white diagonal split as the signature mark, and course-overprint purple `#A3238E`.
  - Color is quarantined. Purple appears only on the map overprint and control numbers, orange only on the flag mark and the single primary action.
  - Material: hard 2 dp ink rules forming the description-sheet grid, near-square corners (2 dp), and tabular figures.
  - Type: Barlow Condensed for sheet headings, control numbers and labels. Roboto, the system face, for story text.
  - Dark theme: a night-O sheet, with white rules on black and a lighter purple.
- **STORY:** The walker understands that every control is a real named place, and that the story fragments are how to find them without the map. They believe the game is fair, because hints and giving up are visible but cost points. They read once, tap "Hide map", and walk.
- **FIRST VIEWPORT:** The memorize screen.
  - Top 55%: the real map with IOF Score-O overprint. A purple start triangle sits at the user and numbered purple control circles sit on the landmarks, with no legs because order is free.
  - Below: the control description sheet. Each row is number, kind pictogram, landmark name and walking minutes, and the story fragment spans the row beneath.
  - A "Read aloud" control sits in the sheet header.
  - The primary action is an orange-and-white flag block reading "Hide map & start", pinned at the bottom.
  - Signature interaction: on Hide map, the circles shrink into their numbers, the map fades, and the screen cuts to black pocket mode.
  - Run: two-value black. A checkpoint hit is one full-frame inversion plus vibration. Give up sits alone, separated from Hint.
  - Results: a punch card. Each control box shows its pin-punch pattern, an orange "H" marks a hinted punch, and missed boxes stay empty.
- **FORM:** An orienteering Score-O course (control description sheet, overprint and punch card). It ranked first on the parent's ordered list. Seed key: 8e7e888b.
- **FINISH:** "unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance"

## Raises kept from declined challengers
- Ikeda: the run is strictly two-value (pure black and white, no grey).
- Graphite console: Give up is isolated by empty space and never sits next to Hint.
- Lexicon: color stays quarantined to the overprint and the flag mark.
- Cassette: walking minutes per control, totaling the requested time.

## Unresolved
- MapLibre basemap style: an OpenFreeMap muted style (positron-like) so the purple overprint reads. Verify on device in sunlight.
