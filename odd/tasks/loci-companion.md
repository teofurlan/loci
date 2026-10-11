# Feature: loci-companion

## Objective
Introduce Loci, the app's companion character, as an animated pixel-art component, and rebuild the home screen as a chat-style entry point where the user asks Loci for a route.

## Problem
The setup screen is a form ("Set your course"). The redesign makes Loci the face of the route: the user talks to Loci, Loci "listens to the place" while planning, then hands over the map and stories. Loci reappears at transitions (pocket screen, results) and when a hint is requested.

## Why
The user wants the app's dynamic and aesthetics to centre on a calm companion. Character brief: Engram topic `loci/character-redesign-brief`. Approved motion study: `.pi/generated-images/loci-pixel-motion-study-v2.html` (concept B silhouette, 64 cells wide, no dark rim, corner light shading, 12 fps, offsets snapped to whole cells, tilt snapped to 3.5° steps).

## Scope (authorized)
- Animated `Loci` component with the three states from the study: waiting, listening (thinking), hint.
- Chat-style home screen: Loci centred and waiting; compact example prompts above the input; bottom input bar with mic (voice) and send on the right; no message history; thinking state shows Loci listening; errors are spoken by Loci in a short bubble. The existing location, dictation and planning flow is kept.

## Out of scope for now (follow-up tasks, need their own go-ahead)
- Loci asking a clarification question (needs a domain change: `RouteIntent` has no ask-back field).
- Loci on the pocket, hint and results screens.
- Landmark sprites redrawn at 32x32 (22 grids, sprite tests, ~10 scale call sites).

## Constraints
- Expo SDK 57, Android only. No reanimated/Skia: animate with a JS frame clock and `react-native-svg`, like the existing logo trace.
- Testable logic lives in pure functions under `src/ui/model/` with co-located `*.test.ts`.
- Honour `useReducedMotion()` (static poses).
- Generated artifacts (code, comments, UI copy, tests) in English.
- JS-only changes: verify on the installed dev build with Metro; no release rebuilds.

## TDD
Mode: strict (source: user global CLAUDE.md "Strict TDD Mode: enabled"). Runner: jest via `jest-expo` (`npm test`, `npx jest <path>`). RED before GREEN for every model function.

## Delivery
Strategy: ask-on-risk (default). Forecast ~800 authored lines across T1-T3, above the ~400 budget: chain strategy to be asked before the first commit that crosses it.

## Tasks
- [x] T1 Loci model (84d8623): pure pose sampler (keyframes, 12 fps, snapping) and rasterizer (body mask from the concept B path, corner light shading, axis-aligned pill eyes, blink) returning a pixel grid; run-length SVG paths; memoized by quantized pose. Route: delegated writer (2+ non-trivial files).
- [x] T2 `Loci` component (84d8623): renders the grid with `react-native-svg`, frame clock, `state` prop (waiting / listening / hint), optional attention toward the input, reduced motion. Route: delegated writer (same writer as T1).
- [x] T3 Chat-style home screen (cda770d, captures bacd31d) in `src/app/index.tsx` (+ view model and tests). Route: delegated writer.
- [ ] T4 (pending go-ahead) Loci clarification question.
- [ ] T5 (pending go-ahead) Loci on pocket/hint/results screens.
- [ ] T6 (pending go-ahead) 32x32 landmark sprites.

## Acceptance criteria
- Loci's three states match the motion study at 64 cells wide with corner light and no rim; held poses never shimmer.
- Home screen: Loci centred and waiting; examples compact above the input; input bar at the bottom with mic and send on the right; submitting shows Loci listening; errors shown by Loci; the route still plans and opens Memorize.
- `npm test`, `npm run typecheck`, `npm run lint` pass.

## Progress
- 2026-10-11: branch `feat/loci-companion` created from `main` (32bc5ee). Exploration done.
- 2026-10-11: T1+T2 implemented by the delegated writer (uncommitted): `src/ui/model/loci.ts` (+23 tests), `src/ui/components/Loci.tsx`, `PALETTE.loci` in `src/ui/theme/palettes.ts`. RED observed (missing module), then GREEN. `npm test` 468/468, typecheck clean, lint clean; parent re-ran `loci.test.ts` 23/23. Diff 601 lines: over the ~400 budget, chain strategy asked before committing.

- 2026-10-11: user previewed Loci on the phone (temporary route `src/app/loci-preview.tsx`, not committed) and approved it. PR chain strategy deferred by the user until they see the result.
- 2026-10-11: T1+T2 committed as 84d8623 `feat(loci): add the animated pixel-art Loci companion`. RDD assess: medium (`executable_change`), review_due `slice_budget_reached`; preflight STATUS stopped with `managed_assets_outdated` (continuation `gentle-ai sync --agent claude-code`), awaiting user OK to run the sync.
- 2026-10-11: chat home design approved in `.pi/generated-images/loci-aura-study.html`: black field, lavender aura fading outward (size 43, asymmetry 8, rough 17, strength 65, 7 steps, no breathing), square 44 dp mic/send buttons inside the input bar, "rounded pixel" corners (profile [2,1]) on input, buttons, chips and message panel. T3 delegated to a writer (route: delegated writer, 2+ non-trivial files).

- 2026-10-11: user authorized `gentle-ai sync --agent claude-code`; it failed (it probed the Pi CodeGraph MCP adapter, which is not installed). User chose to continue without reporting: 84d8623 proceeds without native review (outcome: unavailable), ordinary repository policy applies.

- 2026-10-11: T3 done by the delegated writer: `src/app/index.tsx` rebuilt; new `chat-view`, `loci-aura`, `pixel-corners` models (+tests), `LociStage`, `ChatChip`, `LociMessage`, `SendButton`, `use-loci-paths`; `PixelBox corners="round"`; `PALETTE.chat`; `send` glyph; `setup-view` removed. RED observed then GREEN; `npm test` 495/495 (parent re-ran), typecheck and lint clean. Device captures: idle, keyboard open, planning (`.impeccable/review/chat-home-*.png`). Not exercised on device: message panel (errors, denied), stopped mic, completed plan. Native review: unavailable (same `managed_assets_outdated` stop; ordinary policy).
- Open points: with the keyboard open Loci shrinks to ~64 dp because the four chips take ~170 dp; chips are 36 dp tall (+4 dp hit slop), under the 44-48 dp target.
- 2026-10-11: user feedback applied (same writer): examples hidden while the keyboard is open; Loci stage sized once for the worst case (`chat-layout.ts` `stageCellDp`: keyboard estimated at 45% of window height, input bar 80 dp, message slot 150 dp; 2-3 dp per cell; 2 dp = 240 dp stage on the test phone); errors and dictation problems are said by Loci in the slot under the stage with inline action chips (panel above the input removed); placeholder gets a leading space so the caret no longer overlaps the "A". RED then GREEN; `npm test` 501/501 (parent re-ran), typecheck and lint clean; captures idle, focused, planning, error, error+keyboard. Remaining: Loci shifts vertically (not in size) when the chips show or hide; keyboard height estimated, not measured; chip height still 36 dp.

## Next step
User review of the chat home on the phone; then decide the PR chain strategy.
