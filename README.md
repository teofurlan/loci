# Loci

Memory route: an Android app that generates a loop route through real landmarks, turns it into a mnemonic story with an open Gemma model (method of loci), and scores how many checkpoints you remember while running with the map hidden.

## Scripts

- `npm test` runs the jest unit tests (jest-expo).
- `npm run typecheck` runs `tsc --noEmit`.
- `npm run lint` runs `expo lint`.
- `npm run android` starts the dev server (a development build is required for native modules).

## Structure

- `src/domain/` pure TypeScript domain core (no React Native imports).
