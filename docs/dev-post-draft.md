---
title: "TODO: choose the final title"
tags: "TODO: verify the exact DEV challenge tag; TODO: select remaining tags"
cover_image: "TODO: add a real cover image URL, if available"
---
<!-- Title options: “A Memory Palace for Your Neighborhood”; “I Built a Walking Game That Hides the Map”; “Gemma, Landmarks, and a Walk You Have to Remember” -->

# A walk you have to remember

I often walk my dog, and too many walks become the same loop: I hesitate over where to go, then choose the familiar route again. I do the same when I head somewhere nearby, like the supermarket. I wanted a reason to explore on foot—and a little more purpose than scrolling through a walk.

Recently I enabled my phone’s warning for using it while walking. I was surprised by how often I was reading social media or chatting as I moved. That made me want to try using technology against the pull of technology: a memory game that gives me something to think about, then asks me to put the phone away. Loci turns nearby landmarks into a short story I can carry with me. I want players to feel that they are using their brains as well as moving their bodies: a small memory challenge that gives an ordinary walk a purpose.

## The Overworld: places become characters

The moment I chose a colorful retro pixel-art direction was one of my favorite parts of building Loci. It made the app more inviting to use, and the familiar RPG look gives me a nostalgic feeling. I built an original Overworld with the Sweetie 16 palette: little 16×16 landmark sprites speak their story fragments in a typewriter-style dialogue box, then the results appear in a badge case. The sprites turn map places into memory hooks rather than interchangeable pins.

![Memorize screen: a pixel-art map, landmark sprites, and a story fragment in the dialogue box](../dist/release-4-course.png)

![Course setup screen with a free-text request and walking examples](../dist/release-2-setup.png)

These are captures from the release build. The screenshots are local repository files for now; **TODO: upload the selected screenshots to DEV and replace these relative links with their hosted URLs.**

## What it does

Loci plans a randomized walking or running loop through named places from OpenStreetMap. I can describe an outing in plain language—“20 min walk, green areas,” for example—and Gemma parses the request into bounded route parameters. Loci generates candidate points around my starting location and snaps them to nearby real landmarks. Gemma then makes a mnemonic story using the method of loci: each place becomes a vivid image, and the images link together.

I study the map and read or hear the story once before leaving. During the run, the map is hidden in pocket mode; GPS can check for checkpoints with the screen off, and a vibration marks a hit. Checkpoint order does not matter in the current mode. At the end, the badge-case results show what I remembered. A hint replays a checkpoint’s story fragment and gives a direction; reaching that checkpoint after a hint earns half credit. Giving up reveals the map and ends the run with the score earned so far.

The phone is never locked by the app, so calls and emergency help remain available. Planning requires connectivity; a prepared checkpoint run can work offline. Loci is not turn-by-turn navigation and makes no route-safety guarantee.

## How to play

1. Describe a walk or run, then review the planned course and its story.
2. Study the landmarks while the map is visible. The story is the cue to remember.
3. Put the phone in your pocket and follow the story from memory. A vibration marks a detected checkpoint.
4. Ask for a hint if you need one, or give up to reveal the map. Hints halve that checkpoint’s score.

## How Gemma is used

Gemma is the mechanic, not a chat feature added for decoration. Without a story connecting places to memorable images, there is no memory challenge to carry away from the screen.

Gemma has two jobs: parse the free-text course request into structured route parameters, and create a short mnemonic fragment for each supplied landmark. The story input contains landmark IDs, names, and kinds; coordinates are not sent to the story model. The app validates and clamps model-supplied intent values, and landmark IDs are checked against the fetched set. Gemma does not get to invent landmarks or coordinates. Dictation feeds the same text path.

In development, the LLM adapter can use Ollama. The production app calls the open-weight Gemma 4 model through the Gemini API behind a small Vercel proxy. The proxy fixes the model, caps inputs and output budgets, applies best-effort per-IP rate limiting, and keeps the API key server-side rather than embedding it in the APK. If generation fails, Loci can use a cached or template story.

## Architecture

The app keeps route and memory-game logic in TypeScript, with external services behind small adapters:

```text
Free-text request ──> intent parser ──> bounded route intent
                                           │
GPS origin ──> loop candidates ──> Overpass landmarks ──> snapped checkpoints
                                           │
                                           └──> story generator ──> Gemma via Vercel proxy
                                                                      │
                         Expo / React Native screens <── route + story┘
                         GPS fixes ──> hit detection ──> score + vibration
```

The domain handles distance calculations, randomized loop candidates, landmark selection, GPS hit detection, session state, hints, and scoring. Application code composes those steps into route planning. Adapters connect the ports to Overpass mirrors, LLM clients, story templates and cache, and local visited-landmark history. Expo and React Native provide the Android app; MapLibre displays the map with OpenFreeMap tiles. I used strict test-first development for domain logic and adapters; the documented suite now has 416 passing Jest tests.

The stack is open: OpenStreetMap data, OpenFreeMap, MapLibre, Gemma, Expo, and React Native. A small server-side proxy keeps the model key out of the app. The Overworld currently recognizes 18 kinds of places, so the same memory mechanic can land on more than the handful of familiar map symbols. I wanted those landmarks to feel distinct both on the map and in the story, without pretending the model knows more than the real place data supplies.

The screen-off run is deliberately simple: it checks proximity to the prepared checkpoints, not whether I followed a particular street between them. The interface keeps hints and giving up available rather than making the score the point of the walk. That balance matters to me: I want a small reason to pay attention to where I am, while still being free to keep walking or stop.

## Lessons learned

- **Leave room for model thinking.** Gemma’s reasoning consumed small token budgets and could leave an empty visible answer. More headroom fixed the observed case; the minimal thinking setting that helped is unofficial tuning, not a guarantee.
- **A failed request can hide the next one.** A transient proxy 502 plus an over-eager, client-wide cooldown meant the story request could silently fall back to a template. Retrying transient proxy failures and limiting cooldown to Ollama stopped that failure pattern.
- **Public data services need alternatives.** Overpass returned 504s, so the app can try mirrors instead of depending on a single endpoint.
- **Screen-off GPS needs Android foreground work.** A foreground service keeps the run’s location tracking active while the screen is off.

## Try it

The project is [on GitHub](https://github.com/teofurlan/loci). The Android release APK has been built locally as `dist/loci-release.apk` (57.6 MB); native capabilities require an installed app build. **TODO: publish the APK as a GitHub Release and replace this repository-file reference with the exact release download link.**

<!-- TODO: clip of the outdoor walk -->
<!-- TODO: outdoor walk story: where, distance, score -->

The DEV challenge asks how open AI can help people get off screens; the write-up carries the most weight, and actually using the project outdoors earns a bonus. Loci is my attempt: let AI prepare the memory game, then take the story outside and leave the map behind. The actual outdoor walk and its result are still to come; I’ll add them when I have them. The stated deadline is October 11, 2026 at 23:59 PDT. **TODO: confirm the exact challenge title, required tag spelling, and any applicable rules before submission.**

## What’s next

1. Take Loci outside, record where the walk happened, its distance, and the resulting score, and add a genuine clip or captures.
2. Explore an ordered quest mode, where remembering each place unlocks the next clue.
3. Treat on-device Gemma as a stretch goal, not a shipped capability.
