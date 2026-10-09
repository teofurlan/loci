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
- [ ] T3 Landmarks adapter: query Overpass for named POIs near candidate points and snap checkpoints to landmarks, test-first with fixtures.
- [ ] T4 StoryGenerator port. Remote Gemma adapter (Gemini API, Ollama in development) with the mnemonic prompt and a cached-story fallback.
- [ ] T5 Screens: setup, memorize (map and story shown once), run (pocket mode with a black overlay and haptics), and results. Map uses MapLibre with free OSM-based tiles.
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

## Next step
Resolve the product decisions, then T3 (landmarks adapter).
