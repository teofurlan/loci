# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users
Casual walkers who head out around their own neighborhood or city. They want a light memory game that gives them a reason to go outside. The pace is relaxed and there is no performance pressure. The app also supports running, but walking is the primary scene.

## Product Purpose
Loci builds a random walking loop through real, named landmarks near the user. An open-weight model (Gemma) turns that loop into a vivid mnemonic story using the method of loci.

The user reads and hears the story once with the map visible. Then they put the phone away, map hidden, and walk the route from memory. GPS confirms each checkpoint with a vibration. At the end the app scores how many checkpoints they remembered.

Success means the user spends the walk looking at the street, not at the screen, and comes back wanting another route.

## Positioning
Orienteering "memory-O" drills, MapRun and UsynligO rely on courses made by an organizer. SpecTrek-style apps use random points with no memory element. Loci generates a fresh route on demand, snaps it to real landmarks, and makes remembering that route the game. The AI is the mechanism, not decoration: without the generated story there is no memory challenge.

## Operating Context
- **Setup, at home or on the doorstep:** the user types a free-text request such as "20 min walk, green areas, I remember places better than street names". Gemma parses it into route parameters; it never invents coordinates.
- **Memorize:** a map with numbered checkpoints plus the story text, optionally read aloud with Android text-to-speech. This is the only moment the full route is shown.
- **Run, outdoors:** the phone is in a pocket and the map is hidden behind a black pocket overlay. The screen may also be off. GPS hits trigger haptics. Hints replay one unvisited checkpoint's story fragment through TTS, then give a direction, and each one costs score. Giving up is always available and reveals the map.
- **Results:** checkpoints visited out of N, with points adjusted for hints.
- **Environment:** outdoor daylight, glare, one hand, often while moving. Signal may be weak, so the run itself must work offline.

## Capabilities and Constraints
- Expo SDK 57 React Native, Android only. A development build is required for native modules.
- Map: MapLibre with free OpenStreetMap-based tiles. Landmarks come from OpenStreetMap via Overpass.
- AI: Gemma 4 through the Gemini API in production and Ollama in development. If the model fails, the app falls back to cached or template stories.
- Checkpoint order does not matter. Familiar and new landmarks are mixed on purpose to increase memory interference.
- The device is never locked by the app, so calls and emergency help stay reachable.
- **Out of scope:** iOS, accounts, leaderboards, offline map bundles, and any claim that a route is "safe".
- UI language: English, chosen to match the DEV challenge audience. Stories follow the language of the request.
- The Gemini key never ships in the APK. The app calls a small server-side proxy that holds the key.

## Brand Commitments
Name: Loci, after the method of loci (the "memory palace").

## Evidence on Hand
No users, testimonials, metrics or screenshots exist yet. An outdoor test run and a DEV challenge post are planned (deadline 2026-10-11). Do not fabricate usage numbers or quotes.

## Product Principles
- **Off the screen is the goal.** Every screen should get the user outside faster and keep the phone in the pocket during the walk.
- **One look, then trust memory.** The route is shown once; the design must make that single look count.
- **The story carries the route.** The narrative, not the map, is what the user takes with them.
- **Forgiving, not punishing.** Hints and giving up are always within reach; the score rewards remembering without shaming help.

## Accessibility & Inclusion
Used outdoors in sunlight and on the move: high contrast, large touch targets, and audio (TTS) and haptic feedback alongside the visuals.
