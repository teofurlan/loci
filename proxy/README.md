# Loci LLM proxy

A single Vercel Function, `POST /api/complete`, that holds the Gemini API key so it never ships in the APK.
The app sends `{ prompt, json?, maxTokens? }` and gets `{ text }` back. The model is fixed server-side.

## Behavior

| Case | Response |
| --- | --- |
| Method other than POST | 405 with `Allow: POST` |
| Malformed body, or invalid `prompt`, `json` or `maxTokens` | 400 `bad_request` |
| Prompt over 8,000 characters | 413 `prompt_too_large` |
| Over the per-IP budget | 429 `rate_limited` with `Retry-After` |
| Missing `GEMINI_API_KEY` | 500 `server_misconfigured` |
| Gemini failed, timed out or returned no text | 502 `upstream_error` or `upstream_empty` |

`maxTokens` is the visible-answer budget: clamped to 2,048 and defaulting to 2,048 when omitted. Gemma 4 reasoning counts against the upstream `maxOutputTokens`, so the proxy adds 2,048 tokens of thinking headroom on top. Errors never include the key or the upstream body.

## Timeouts

| Layer | Limit |
| --- | --- |
| App `ProxyLlmClient` | 120 s |
| Function `maxDuration` (`vercel.json`, `api/complete.ts`) | 120 s |
| Upstream call to Gemini | 110 s |

Each layer is shorter than the one outside it, so the proxy answers with a clean 502 instead of being cut off. Gemma 4 thinking can push a long story past a minute.

Rate limiting is an in-memory token bucket (20 requests per 10 minutes per IP, from `x-forwarded-for`, then `x-real-ip`).
It lives in the function instance, so it is **per instance and best-effort**: cold starts reset it and parallel instances do not share it.
For a hard quota, add the Vercel WAF rate limiting or a shared store.

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | yes | Google AI Studio key |
| `GEMINI_MODEL` | no | Defaults to `gemma-4-26b-a4b-it` |
| `GEMINI_THINKING_LEVEL` | no | Experimental. Sent as `generationConfig.thinkingConfig.thinkingLevel` (for example `MINIMAL`) to cut Gemma 4 thinking time. Not officially documented for Gemma, so unset by default; blank means unset. Server-only, never read from the request. `MINIMAL` was verified on 2026-10-09: the 5-landmark story went from over 70 s (empty) to about 7 s |

## Local run

```bash
cd proxy
cp .env.example .env.local   # fill in GEMINI_API_KEY
npx vercel dev
curl -X POST http://localhost:3000/api/complete \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Say hi","maxTokens":50}'
```

Tests run from the repository root with `npx jest proxy`. They use no network.

## Deploy

Run these yourself; nothing here is deployed automatically.

1. Create a Vercel project from this repository with **Root Directory** set to `proxy`. Framework preset: Other.
2. Add `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) under Settings, Environment Variables, for Production.
3. Deploy: `npx vercel --prod` from `proxy/`, or push to the connected branch.
4. In the app, set `EXPO_PUBLIC_LLM_PROXY_URL=https://<your-project>.vercel.app` (no trailing path).
