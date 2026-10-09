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

`maxTokens` is clamped to 1,024 and defaults to 1,024 when omitted. Errors never include the key or the upstream body.

Rate limiting is an in-memory token bucket (20 requests per 10 minutes per IP, from `x-forwarded-for`, then `x-real-ip`).
It lives in the function instance, so it is **per instance and best-effort**: cold starts reset it and parallel instances do not share it.
For a hard quota, add the Vercel WAF rate limiting or a shared store.

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | yes | Google AI Studio key |
| `GEMINI_MODEL` | no | Defaults to `gemma-4-26b-a4b-it` |

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
