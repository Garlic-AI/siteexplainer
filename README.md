# [SiteExplainer](https://www.siteexplainer.com/)

Paste any confusing website and get a clear, jargon-free explanation of what it
actually is and does. Every URL you explain becomes a permanent, server-rendered,
cached page at **`siteexplainer.com/<url>`** (e.g.
[`siteexplainer.com/vercel.com`](https://siteexplainer.com/vercel.com)).

## How it works

1. You paste a URL (or go straight to `siteexplainer.com/<url>`).
2. We fetch the page's own HTML and distill it down to the meaningful text.
3. We send that to [OpenRouter](https://openrouter.ai) — using a structured-output
   model with a fallback — to explain what the site does, why it helps, and how
   someone might use it, grounded in the page's real content.
4. The result is cached by Next.js and optionally in Redis, then rendered
   server-side on repeat visits.

Generation uses paid models and consumes OpenRouter credits. Incomplete or malformed
answers are rejected rather than saved as permanent explanations.

## Stack

- **Next.js 16** (App Router, React 19, server components + streaming)
- **Tailwind CSS v4**
- **OpenRouter** structured-output models for generation, with a provider fallback
  (pin one via `OPENROUTER_MODEL`)
- **Upstash Redis** (optional) — durable explanations and the "recently explained" list
- Deployed on **Vercel**

## Running locally

Copy `.env.example` to `.env` and fill in the keys:

```bash
cp .env.example .env
```

- `OPENROUTER_API_KEY` — from https://openrouter.ai/keys (required)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — optional cache; create a
  free DB at https://console.upstash.com
- `OPENROUTER_MODEL` — optional, pin a JSON-schema-capable model instead of the fallback pair
- `NEXT_PUBLIC_SITE_URL` — your public origin (used for canonical/OG + sitemap)

Then:

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`. Without Redis credentials, Next.js still
caches generated explanations; the recent list and sitemap won't be populated.

## Notes

The app degrades gracefully: if Redis is unavailable, explanations are still
generated, just not cached. SSRF-hardened fetcher (DNS + private-IP checks on every
redirect hop). SSR + per-page metadata, sitemap, and robots make every `/<url>`
page indexable.
