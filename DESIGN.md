---
name: Loci
description: A Score-O control sheet for a memory walk. White card paper, ink rules, one orange flag, purple overprint.
colors:
  paper: "#FFFFFF"
  ink: "#111111"
  flag-orange: "#F26B1D"
  overprint-purple: "#A3238E"
  paper-shade: "#F1F1F1"
  ink-soft: "#4A4A4A"
  error-red: "#B3261E"
  night-black: "#000000"
  night-paper-shade: "#1B1B1B"
  night-ink-soft: "#C4C4C4"
  night-overprint: "#E066CC"
  night-error: "#FFB4AB"
  night-on-error: "#690005"
  on-error: "#FFFFFF"
typography:
  display:
    fontFamily: "BarlowCondensed_700Bold"
    fontSize: "56px"
    fontWeight: 700
    lineHeight: "60px"
  headline:
    fontFamily: "BarlowCondensed_700Bold"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: "36px"
  title:
    fontFamily: "BarlowCondensed_600SemiBold"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: "26px"
    letterSpacing: "0.4px"
  label:
    fontFamily: "BarlowCondensed_600SemiBold"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: "20px"
    letterSpacing: "0.8px"
  body:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "0.15px"
  body-small:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "0.25px"
rounded:
  rule: "2px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  section: "28px"
  target: "48px"
components:
  button-flag:
    backgroundColor: "{colors.flag-orange}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.rule}"
    height: "64px"
    padding: "0 16px"
  button-rule:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.rule}"
    height: "48px"
    padding: "8px 16px"
  control-row-number:
    textColor: "{colors.overprint-purple}"
    typography: "{typography.headline}"
    width: "52px"
    height: "56px"
  punch-box:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.overprint-purple}"
    typography: "{typography.label}"
    rounded: "{rounded.rule}"
    height: "84px"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.rule}"
    padding: "12px"
    height: "112px"
---

# Design System: Loci

## Overview

**Creative North Star: "The Control Sheet"**

Every walk is an orienteering Score-O course. The app is the paper you are handed at the start: a control description sheet, a map with overprint, and at the end a punch card. It is white, ruled in hard ink, and almost entirely monochrome, so that the two colors it does own carry meaning. Material 3 supplies structure (insets, system Back, 48 dp targets, role-based type scale); the brand lives in the theme layer on top of it.

The density is that of a printed form: rows divided by 2 dp rules, condensed uppercase labels, tabular numerals, near-square corners. Nothing is soft. It is built for glare and one hand, so contrast is maximal and decoration is absent. The memorable moment is hiding the map: the overprint rings shrink to their numbers, the map fades, and the screen cuts to black pocket mode.

**Key Characteristics:**
- Pure white paper and ink `#111111`; never cream, never tinted grey surfaces beyond one pale variant.
- Color is quarantined: purple is overprint and control numbers, orange is the flag and the one primary action.
- Hard 2 dp rules form the grid; corners are 2 dp.
- Barlow Condensed for sheet voice, the system face for story text.
- Flat: no shadows, no elevation. Depth is rules and the black cut of pocket mode.
- Night-O theme follows the system: white rules on black, lighter purple.

## Colors

A printed-sheet palette: white, ink, one orange, one purple. Both light and night themes resolve the same Material roles.

### Primary
- **Control-Flag Orange** (`{colors.flag-orange}`): the diagonal half of the flag button and the orange "H" on a hinted punch. Identical in light and night. Nothing else is orange.

### Secondary
- **Course-Overprint Purple** (`{colors.overprint-purple}`): map rings, start triangle, and control numbers in the sheet and on the punch card. In night theme it becomes **Night Overprint** (`{colors.night-overprint}`) so it reads on black.

### Neutral
- **Description-Card Paper** (`{colors.paper}`): background and surface in light theme. In night theme the ground is **Night Black** (`{colors.night-black}`).
- **Control Ink** (`{colors.ink}`): text, every rule, outlines, the flag label. In night theme the ink is paper white (`#FFFFFF`).
- **Paper Shade** (`{colors.paper-shade}`) and **Ink Soft** (`{colors.ink-soft}`): the variant surface and secondary text such as minutes and attributions. Night counterparts: `{colors.night-paper-shade}` and `{colors.night-ink-soft}`.
- **Error Red** (`{colors.error-red}`, night `{colors.night-error}`): error states only; text on it uses `{colors.on-error}` (night `{colors.night-on-error}`).
- **Pocket values:** the run screen ignores the theme and uses only pure `#000000` and `#FFFFFF`, swapping them on a checkpoint hit.

### Named Rules
**The Quarantine Rule.** Purple belongs to overprint and control numbers. Orange belongs to the flag mark and the single primary action. Any other use of either is a defect.

**The Two-Value Pocket Rule.** On the run screen there is black, white, and nothing between: no grey, no accent.

## Typography

**Display / Sheet Font:** Barlow Condensed (Medium 500, SemiBold 600, Bold 700 bundled)
**Body Font:** Roboto, the Android system face, with system fallback

**Character:** A condensed, printed-form voice for anything that is structure (headings, numbers, labels) against a plain, readable face for the story the walker must absorb. Sizes follow system font scale; the flag, number and label roles cap their growth (`maxFontSizeMultiplier` 1.2 to 1.4) to protect the grid.

### Hierarchy
- **Display** (Bold 700, 56/60, uppercase): the results score figure.
- **Headline** (Bold 700, 32/36, uppercase): screen titles and the flag button label (set at 26/32 inside the flag).
- **Title** (SemiBold 600, 22/26, +0.4): place names in sheet rows (set at 20/24 in rows) and the route title.
- **Label** (SemiBold 600, 17/20, +0.8, uppercase): buttons, minutes, section labels, punch numbers.
- **Body** (Roboto 400, 16/24, +0.15): story fragments and the request field.
- **Body Small** (Roboto 400, 14/20, +0.25): secondary explanation.

### Named Rules
**The Tabular Rule.** Control numbers, minutes, timers and scores use tabular figures so they never jitter.

**The Two Voices Rule.** Barlow Condensed speaks for the sheet; Roboto speaks for the story. Do not set story text in the condensed face or labels in Roboto.

## Layout

A stacked, full-width sheet. Screens use 16 to 20 dp horizontal margins (24 on the run screen, which has no sheet), an 8 dp-based rhythm (8, 12, 16, 20, 24, 28), and a pinned footer for the primary action, divided from content by a 2 dp top rule. Memorize splits the screen: the real map above (the contract specifies about 55% of the height; the ratio was not verified in source), the control description sheet below. The sheet row is a three-cell grid: 52 dp number cell, 52 dp pictogram cell, flexible name and minutes cell, with the story fragment on a full-width row beneath, all separated by 2 dp rules. Results use a punch-card grid with 8 dp gaps and a column count chosen from the control total. Minimum touch target is 48 dp. Setup copy is capped near 520 dp line width.

## Elevation & Depth

Flat. There are no shadows and no elevation anywhere in the build. Depth is carried by 2 dp ink rules, the map-to-sheet division, and tonal contrast between paper and black in pocket mode. Press feedback is the Android ripple at 20% ink (`#00000033` on the flag, ink at `33` alpha on rule buttons).

### Named Rules
**The Flat-Sheet Rule.** Surfaces stay flat at rest and under touch. Separate with a rule, not a shadow.

## Shapes

Near-square: every box, field, button and punch cell has a 2 dp radius and a 2 dp ink border. The recurring silhouettes are the circle (control ring), the triangle (start), and the diagonal split of the flag, drawn as two SVG triangles. Control pictograms are line glyphs drawn in the sheet's ink in the 52 dp pictogram cell; they are part of the description-sheet notation, not decoration.

## Components

### Buttons
- **Flag (primary):** the one primary action per screen. 64 dp tall, 2 dp ink border, 2 dp radius, orange upper-left triangle and white lower-right triangle split on the diagonal, centered ink Headline label (uppercase). Disabled at 45% opacity; loading appends an ellipsis.
- **Rule (secondary):** transparent fill, 2 dp ink border, 2 dp radius, 48 dp minimum, Label text in ink, 16 dp horizontal padding. On the run screen it takes the pocket ink. Give up sits alone, separated from Hint by space, never beside it.

### Control Row
Number in overprint purple (Headline at 30), pictogram, place name (Title) with minutes beneath (Label, Ink Soft), story fragment (Body) in a full-width row below. On results the minutes slot can read a short status such as "Punched".

### Punch Card
One 84 dp box per control, 2 dp ink border. The control number sits top-left in purple. A visited box carries a pin-punch pattern of ink dots (radius 2.6 on a grid); a hinted punch also shows an orange "H" top-right; a missed box stays empty; surplus grid slots are borderless.

### Inputs / Fields
Multiline request field, 112 dp minimum, 2 dp ink border, 12 dp padding, Body type, 2 dp radius. Example prompts below it are 48 dp rule boxes with 12 by 10 dp padding.

### Map Overprint
IOF-style: purple ring (stroke ~2 dp, filled with ground so labels do not cross the numeral), purple number inside, a start triangle at the user, no legs. On Hide map the rings shrink to a 2 dp radius and the stroke thins to nothing as the map fades. Punched controls invert: purple fill, ground-colored number. The basemap is a muted light OpenFreeMap style by day and a night style on black.

### Navigation
System Back and Android insets govern. No custom tab bar; flow is linear: setup, memorize, run, results. The run screen owns the system bars (light on black, dark while inverted).

### Pocket Run (signature)
Black ground, white text, no theme. A checkpoint hit inverts the whole frame to white for a beat with vibration. Hint and Give up are separated by space.

## Do's and Don'ts

### Do:
- **Do** separate content with 2 dp ink rules (`{colors.ink}` in light, white in night) and keep corners at 2 dp.
- **Do** reserve orange for the flag button and the "H" hint mark, and purple for overprint and control numbers.
- **Do** use Barlow Condensed uppercase for headings and labels, tabular figures for any number, and Roboto for story text.
- **Do** keep every touch target at 48 dp or more, and the flag button at 64 dp.
- **Do** keep the run screen strictly black and white.
- **Do** resolve colors through the theme roles so night-O comes along for free.

### Don't:
- **Don't** add shadows, elevation, gradients, or rounded cards.
- **Don't** introduce cream or tinted paper; the sheet is pure white.
- **Don't** use orange or purple as general accents, links, or decoration.
- **Don't** place Give up next to Hint.
- **Don't** fall back to the generic category layout: a full-bleed map with a bottom sheet and pins.
