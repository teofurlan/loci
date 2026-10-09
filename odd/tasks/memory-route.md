# Feature: memory-route (Loci)

## Objective
Build an Android app for the DEV "Touch Grass" challenge (deadline 2026-10-11 23:59 PDT). The app generates a random walking or running route through real landmarks. An open-weight model (Gemma) turns the route into a mnemonic story, using the method of loci. The user sees the map and hears the story once, then runs with the phone in their pocket and the map hidden. GPS verifies each checkpoint, and the app scores how many the user remembered.

## Problem / Why
- The challenge asks for open AI that gets people off the screen. The write-up is weighted most, and actually using the project outdoors earns a bonus.
- Without the story, the AI would be decorative. Gemma makes the memory challenge possible, so the AI is central.
- Open stack: OpenStreetMap plus Gemma. The run works with no signal.

## Scope
- In: route generation, checkpoint hit detection and scoring, OSM landmarks, Gemma story generation (remote first, on-device as a stretch goal), background GPS while the screen is off, haptics, and the run and result screens.
- Out: offline OSM data bundles, iOS, accounts, leaderboards, and AI "safety" claims about routes.

## Constraints
- Expo React Native with TypeScript, Android only. A development build is required for native modules.
- Gemma in development: local Ollama. In production: the Gemini API free tier, with cached stories as a fallback.
- The device is never locked, so calls and emergency help stay available.
- Strict TDD for domain logic and adapters. UI is checked manually on a device.

## TDD
- Mode: ON. Source: the user's global CLAUDE.md ("Strict TDD Mode: enabled").
- Runner: jest via jest-expo (`npx jest`).

## Delivery
- Strategy: ask-on-risk (default). Forecast: about 1,500 to 2,500 authored lines across all tasks, which exceeds the 400-line budget. Ask about the chain strategy before the first PR.
- Branch: `feat/memory-route`. Each task ends with at least one work-unit commit using a conventional commit message.

## Tasks
- [x] T1 Scaffold the Expo TypeScript app, jest-expo, lint and typecheck scripts, `.gitignore`, and a README stub. Route: delegated (scaffold plus T2, 2+ non-trivial files).
- [x] T2 Domain core in pure TypeScript, test-first: haversine distance, random checkpoint generation within a target distance, checkpoint hit detection with a radius, and scoring. Route: delegated with T1.
- [x] T3 Landmarks: Overpass adapter behind a LandmarkSource port (query builder, response parser, injected fetch; fixtures, no network in tests) plus a domain `selectCheckpoints` that snaps loop candidates to real landmarks. It weights by user preferences (green areas, recognizable landmarks) and mixes new and already-visited landmarks by ratio. Route: delegated (2+ non-trivial files).
- [ ] T4a Intent parsing: Gemma turns a free-text request ("20 min walk, beginner, green areas, I remember places better than street names") into validated structured params (distance or time, pace, preferences, story style). The domain applies defaults and bounds, and the LLM never invents coordinates.
- [ ] T4 StoryGenerator port. Remote Gemma adapter (Gemini API, Ollama in development) with the mnemonic prompt and a cached-story fallback.
- [ ] T5 Screens: setup (free-text request), memorize (map plus story text, with optional Android TTS), run (pocket mode with a black overlay, haptics, hints, give up), and results. Hints replay one unvisited checkpoint's story fragment via TTS, then give a direction, and each one costs score; giving up reveals the map. Map uses MapLibre with free OSM-based tiles.
- [ ] T6 Background location: expo-location with task-manager and a foreground service, so GPS keeps working with the screen off.
- [ ] T7 Stretch, timeboxed to 4 hours: on-device Gemma adapter using llama.rn, with a small Gemma model.
- [ ] T8 Outdoor test run, screenshots or clips, and a draft of the DEV post.

## Acceptance criteria
- A route of N checkpoints, each snapped to a named landmark, is generated near the user.
- A story is generated from the landmark sequence and shown once before the run.
- During the run, GPS hits are detected with the screen off and each one triggers a vibration.
- The score equals the number of checkpoints visited out of N.

## Checks
- `npx jest`, `npx tsc --noEmit`, lint.
- Manual on-device check for UI and GPS.

## Progress
- 2026-10-08: Created the repo at `Code/loci` and the branch `feat/memory-route`. The user is installing Android Studio for local builds.

- 2026-10-08: T1 and T2 done by a delegated writer. Stack: Expo SDK 57, RN 0.86.3, jest-expo 57, TS 6.0. Commits `8e787f9` (chore: scaffold) and `77ac686` (feat(domain)). RED was a missing module for each behavior; GREEN was 22/22 tests. Parent spot check: `npx jest` → 3 suites, 22 passed. tsc and lint clean, as reported by the writer. About 338 authored lines.
- Open defaults: hitRadiusMeters ~25 and maxAccuracyMeters ~30, to be decided in T5/T6.
- Pending product decisions: story delivery (text, TTS, or both), whether checkpoint order matters, default checkpoint count and distance, and the "give up" flow.

- 2026-10-08 product decisions (user):
  - Story delivered as text and TTS.
  - Checkpoint order does not matter; ordered or hard modes may come later.
  - Hints first, and giving up is always available.
  - Free-text request parsed by Gemma.
  - Mix new and already-visited landmarks to raise memory interference.
- Defaults proposed by the parent:
  - Distance comes from the request (time × pace). Without a request: 3 km walk or 5 km run, clamped to 1-10 km.
  - About 1 checkpoint per 700 m, clamped to 4-8, default 5.
  - Familiar ratio 0.4 when history exists.
  - The user suggested a 4 km minimum, but that conflicts with their own "20 min walk" example (about 1.6 km). Flagged to the user.
- RDD: assess of 77ac686 against base 8e787f9 → medium, under_budget (395 lines). The slice stays pending.

- 2026-10-08: T3 done by a delegated writer.
  - Commits: `e3be1f9` and `906a761`.
  - RED was a missing module for select, query, parse and source; GREEN is 43/43 tests.
  - Parent spot check: `npx jest` → 43 passed.
  - About 550 lines: roughly 220 of production code, the rest tests and the fixture.
  - Live Overpass smoke test by the parent (600 m around the Obelisco): HTTP 200 with 43 elements. Confirmed that `nw` combined with `around` works and that ways come back as `center: {lat, lon}`.
  - Writer recommendations: snapRadius 250 m, with one retry at about 400 m when a checkpoint is unmatched. The query radius should be about targetDistance/π + snap. The caller handles 429 backoff.
- The user accepted the distance defaults and the rule that Gemma picks only from OSM landmarks.
- RDD: assess against base 8e787f9 → medium, slice_budget_reached (958 lines), so a review is due. Preflight STATUS stopped with `managed_assets_outdated`. The continuation `gentle-ai sync --agent claude-code` failed because the Pi MCP adapter extension is missing, and a re-queried STATUS gives the same stop. The review is blocked pending the user's decision.

## Next step
Resolve the RDD block, then T4a and T4 (intent parsing and the story generator).
