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
- [x] T4a Intent parsing: Gemma turns a free-text request ("20 min walk, beginner, green areas, I remember places better than street names") into validated structured params (distance or time, pace, preferences, story style). The domain applies defaults and bounds, and the LLM never invents coordinates.
- [x] T4 StoryGenerator port. Remote Gemma adapter (Gemini API, Ollama in development) with the mnemonic prompt and a cached-story fallback.
- [ ] T5 Screens: setup (free-text request), memorize (map plus story text, with optional Android TTS), run (pocket mode with a black overlay, haptics, hints, give up), and results. Hints replay one unvisited checkpoint's story fragment via TTS, then give a direction, and each one costs score; giving up reveals the map. Map uses MapLibre with free OSM-based tiles. Split into:
  - [x] T5a Application layer, test-first: `planRoute` use case (intent → distance → loop → landmarks with snap 250 m and one 400 m retry → select → story), run session with hints and give up, visited-landmark history port, and the composition root config (Ollama in dev, Gemini via env). Route: delegated (writer trigger, 2+ non-trivial files).
  - [ ] T5b Expo Router screens, MapLibre (OpenFreeMap tiles, no key), expo-speech TTS, expo-haptics, pocket overlay, and foreground location during the run. Development build on the phone, checked manually. Route: delegated (writer trigger).
- [x] T4b LLM proxy, decided by the user on 2026-10-09: a Vercel function holds `GEMINI_API_KEY` server-side, with basic rate limiting. The app gets a `ProxyLlmClient` adapter and `resolveLlmConfig` selects it from `EXPO_PUBLIC_LLM_PROXY_URL`. The Gemini key is never embedded in the APK. Deploying needs explicit user authorization for the Vercel account. Route: delegated writer in an isolated git worktree (the user asked for parallel work while the T5b writer holds the main worktree); merged into feat/memory-route afterwards.
  - Parent design defaults:
    - A generic `/api/complete` endpoint with the model fixed server-side, maxTokens and prompt length capped, and best-effort per-IP rate limiting.
    - The key belongs to a Google project with no billing, so the worst abuse case is quota exhaustion, after which the app falls back to template stories.
    - The app-side `EXPO_PUBLIC_GEMINI_API_KEY` path is removed.
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

- RDD block, user chose "report and continue":
  - Found equivalent open issue gentle-ai#5141 (sync --agent claude-code aborts in the Pi CodeGraph step; also reproduced on 4.0.0, so no published fix exists).
  - Added one occurrence comment: issuecomment-6073026435.
  - No decline invocation was captured, so no substitute command was run.
  - The slice from 8e787f9 to a6ceb68 stays unreviewed. Delivery follows ordinary policy.

- 2026-10-08: T4a and T4 done by a delegated writer.
  - Commits: `66d8e3d` (intent) and `cda68ca` (story).
  - RED was a missing module for each new module; GREEN is 90/90.
  - Parent spot check: `npx jest` → 90 passed. tsc is clean. Lint is clean with `--no-cache`, because the expo cache was stale.
  - About 928 lines, roughly 55% of them tests.
  - Verified: the Gemini API serves Gemma 4 only (`gemma-4-26b-a4b-it`, `gemma-4-31b-it`) via `generateContent` with an `x-goog-api-key` header. JSON mode for Gemma is unverified, so the client relies on prompt-level JSON plus extraction.
  - Ollama dev model: the code defaults to `gemma3:4b`. Recommended: `gemma4:e4b`, to match production.
  - CachedStoryGenerator calls the model first and falls back to the cache on failure; cache-first is still an open choice.
  - The Android emulator reaches Ollama at `10.0.2.2:11434`.
- RDD: the slice from 8e787f9 is due (1902 lines). STATUS still stops with `managed_assets_outdated` (gentle-ai#5141), so the slice stays unreviewed.

- 2026-10-09: Resumed in a new session inside the repo.
  - Android environment verified: SDK with cmdline-tools, JDK 17, and the phone `ZT322SKLL5` connected over adb.
  - gentle-ai is still 3.7.0, so the review stays blocked by gentle-ai#5141.
  - T5 split into T5a (application layer) and T5b (UI).
  - Parent defaults for T5a, open to change: a checkpoint reached after a hint about it counts 0.5 instead of 1, and giving up ends the run with the current score. In development the phone reaches Ollama through `adb reverse tcp:11434 tcp:11434`. The Gemini key comes from `EXPO_PUBLIC_GEMINI_API_KEY`, which ships inside the APK; a proxy is the alternative and still needs a user decision before release.

- 2026-10-09: T5a done by a delegated writer.
  - Commits: `290bf99` (domain session, bearing, OverpassHttpError) and `0cf789d` (planRoute, VisitedHistory port, LLM config, createServices).
  - RED was a missing module or export per behavior. Two plan-route fixture tests were rewritten without code changes.
  - GREEN is 119/119. Parent spot check: `npx jest` → 19 suites, 119 passed. tsc and lint (`--no-cache`) are clean, as reported by the writer.
  - About 717 added lines: roughly 330 of production code and 390 of tests, covering four behaviors.
  - Writer choices:
    - A single landmark fetch with radius ceil(target/π + 400). The 400 m retry is used only when it yields more checkpoints.
    - Fewer than 3 checkpoints throws `NotEnoughLandmarksError`.
    - The session score reports points, visited, total, ratio and hintsUsed; reaching the last checkpoint ends the run as completed.
    - Writing visited ids back to history is left to T5b.
  - `.atl/` (the gentle-ai skill-registry cache) is now in `.git/info/exclude` so the review inventory is clean. This is local only; the repo is unchanged.
- RDD: assess from 8e787f9 (untracked excluded) → medium, slice_budget_reached (2615 lines). Preflight STATUS stopped again with `managed_assets_outdated`. The sync continuation failed the same way (gentle-ai 3.7.0, gentle-ai#5141, already reported), so the slice stays unreviewed.

- 2026-10-09: The user picked the proxy and asked for `/impeccable` on the screens.
  - PRODUCT.md written: primary user casual walkers, English UI.
  - Direction: Control Sheet (orienteering Score-O), seed 8e7e888b, code-led. The contract is in `.impeccable/surfaces/src-app.md` (commit `069ef30`).
- T5b, partial: the delegated writer committed `bd296dc` (store, walking minutes, pictograms, punch pattern, kv VisitedHistory), `c20fe55` (expo-router, theme, fonts) and `fc85896` (four screens with the MapLibre overprint).
  - The dev build was installed on the phone (`com.teofurlan.loci`). Captures exist only for setup (`.impeccable/review/01-*`, `02-setup-busy.png`).
  - The session died when the terminal closed, mid-verification. The parent committed the leftover tweaks as `c5ee326`.
- T4b done by a delegated writer in a worktree: `b204185` (proxy function with validation, caps, rate limiter and Gemini call) and `e40ded1` (ProxyLlmClient; the app-side Gemini client was removed).
  - RED was a missing module per behavior; 213 tests GREEN.
  - Parent spot check in the worktree: `npx jest` → 213 passed.
  - Merged as `86c2e71`. The user edited `.env.example`, committed as `4d70dca` and `89293ae`; the agent was denied `.env*` access by the global settings, which the user keeps as they are.
  - Nothing deployed.
- Dependency fix `fe0f321`:
  - `jest-expo` 57 needs the `@react-native/jest-preset` peer, which was undeclared, so jest failed in the main checkout.
  - `react-dom` had resolved to 19.3 against React 19.2.3. It is now installed through expo at 19.2.3.
  - `npm ci --dry-run` is OK, and the parent saw `npx jest` 213 passed, tsc clean, lint clean.
- RDD: the slice is still unreviewed (gentle-ai#5141).

- 2026-10-09: The T5b verification was finished by a delegated writer. The full device flow works: setup → memorize → run (hint: a fragment plus "North-east, 530 meters") → give up → results.
  - `a1e0adb`:
    - FallbackLandmarkSource tries Overpass mirrors in turn, because the public endpoint returned 504s.
    - CooldownLlmClient skips a failed model for 2 minutes.
  - `2b25c09`:
    - Setup redirects to the current phase after Android recreates the activity, for example on a font-scale change.
    - The run status line reserves its height so Hint does not jump.
    - H shows only on punched controls.
  - RED was a missing module for each new unit; GREEN is 224/224. Parent spot check: `npx jest` → 224 passed. expo-doctor 21/21.
  - Captures are in `.impeccable/review/phone-*.png`.
  - **The story came from the template fallback in every run.** Ollama 0.30.10 with `gemma4:e4b` fails on this host ("Gemma4Assistant requires ctx_other"), so the LLM path (proxy or Ollama) was never exercised end to end. The intent fell back to defaults, so "20 min" gave courses of 27 to 43 minutes.
  - Untested on the device: a real GPS punch (inversion and haptic), read aloud, and the collapse animation.
- The impeccable finish reviewer returned **fix** with 8 material fixes: opaque control rings, a responsive story window, the visible hint cost, attribution as text, the punch-card grid, sentence-case examples, footer rules, and a world-native score. A delegated fix writer is applying them as one batch.
- 2026-10-09: The user authorized deploying the proxy with their Vercel account (team `teofurlans-projects`).
  - Project `loci-llm-proxy`, root `proxy/`, preset Other. The user set `GEMINI_API_KEY` (Production) in the dashboard.
  - Production alias: https://loci-llm-proxy.vercel.app.
  - The first deploy failed at runtime with `ERR_MODULE_NOT_FOUND`: ESM needs explicit `.js` relative imports.
  - Fix `8bf7882`:
    - `.js` imports, with a jest `moduleNameMapper` stripping `.js`.
    - A strict `proxy/tsconfig.json` (NodeNext) and `@types/node`; Node pinned to 24.x.
    - A `.vercelignore` for tests, because files under `api/` become functions.
  - Smoke tests on production:
    - GET returns 405.
    - POST "hello from gemma" returns 200 with that text.
    - An intent-style JSON prompt with maxTokens 300 returns 200 and fenced JSON.
  - Gotcha: with maxTokens 20, Gemma 4 returns empty (`upstream_empty`), because thinking consumes the budget. The app uses 300 and 1200, which works.
  - The repo has no git remote; pushing to GitHub is the user's decision. The CLI deploy does not need it.

## Next step
Act on the finish review verdict, then the documenter (DESIGN.md). Get the real Gemma path working (proxy deploy or a working Ollama model). Then T6.

## Previous next step (done)
Finish the T5b verification: device captures of memorize, run and results (plus dark theme and font scale 1.3), fixes, then the impeccable finish reviewer and documenter (DESIGN.md). Then T6.
