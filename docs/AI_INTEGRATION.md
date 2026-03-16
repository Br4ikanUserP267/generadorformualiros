AI integration (Gemini / Generative) — secure setup

1) IMPORTANT: revoke the leaked API key now
- You posted an API key in chat. Rotate/revoke that key immediately in the Google Cloud Console (or provider console) and create a new key.
- Never store keys in source control or share them in chat.

2) Environment variables (example)
Create a file `.env.local` at the project root (do NOT commit it):

# Option A: Google-style API key (common for quick testing). The server will append `?key=` to the
# default Google Generative endpoint if `GEMINI_KEY` is present. WARNING: API keys should be
# treated as secrets and rotated if leaked.
GEMINI_KEY=AIza...YOUR_KEY_HERE

# Option B: Bearer/OAuth-style key + explicit endpoint (preferred for production/service accounts)
GEN_AI_KEY=ya29...   # bearer token or service account token
GEN_AI_ENDPOINT=https://YOUR_PROVIDER_ENDPOINT

- If `GEMINI_KEY` is present the server route will call the Google Generative Language default
  endpoint and append `?key=...`. If you set `GEN_AI_KEY`/`GEN_AI_ENDPOINT`, the route will use
  those values and pass `Authorization: Bearer <GEN_AI_KEY>`.

3) Server-side route
- The app includes `app/api/ai/autocomplete/route.ts` which proxies requests to the provider using the environment variables.
- Keep calls server-side to avoid exposing keys to browsers.

4) Client usage
- Use the helper `lib/use-ai-autocomplete.ts` to call the route from React.

Example:

import { aiAutocomplete } from '@/lib/use-ai-autocomplete'

async function handleComplete() {
  const response = await aiAutocomplete('Completa esto: Hola, mi nombre es')
  console.log(response)
}

5) Provider specifics
- The server route sends a simple JSON body { prompt, maxTokens, model } — adapt the shape to match the provider's API.
- For Google Generative or Gemini, you may need to send { "instances": [{ "input": "..." }] } or other shapes. Refer to the provider docs and update `app/api/ai/autocomplete/route.ts` accordingly.

6) Security & best practices
- Rate-limit the API route and enforce authentication (only allow logged-in users) before exposing it.
- Add logging and monitoring for quota/errors.
- Prefer service accounts with limited permissions for production workloads.

If you want, I can:
- Add an example integration for Google Generative API (exact payloads) or Prisma migration for storing completions.
- Implement server-side auth to restrict the route to logged-in users.
