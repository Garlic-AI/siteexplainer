# [SiteExplainer](https://www.siteexplainer.com/)

Paste any confusing website and get a clear, jargon-free explanation of what it
actually is and does. Every URL you explain becomes a permanent, server-rendered,
cached page at **`siteexplainer.com/<url>`** (e.g.
[`siteexplainer.com/vercel.com`](https://siteexplainer.com/vercel.com)).

## How it works

1. You paste a URL (or go straight to `siteexplainer.com/<url>`).
2. We fetch the page's own HTML and distill it down to the meaningful text.
3. We send that to [OpenRouter](https://openrouter.ai) using the cheap
   `openrouter/auto` model to write a short, plain-English explanation.
4. The result is cached in Redis forever and rendered server-side, so the page
   loads instantly and is fully indexable.

## Stack

- **Next.js 16** (App Router, React 19, server components + streaming)
- **Tailwind CSS v4**
- **Upstash Redis** — caches explanations, the "recently explained" list, and
  powers per-IP **and** global daily rate limits (the wallet guard)
- **OpenRouter** (`openrouter/auto`) for generation
- Deployed on **Vercel**

## Running locally

Copy `.env.example` to `.env` and fill in the keys:

```bash
cp .env.example .env
```

- `OPENROUTER_API_KEY` — from https://openrouter.ai/keys
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — create a free DB at
  https://console.upstash.com
- `RATE_LIMIT_PER_IP_PER_DAY` / `RATE_LIMIT_GLOBAL_PER_DAY` — optional tuning
- `NEXT_PUBLIC_SITE_URL` — your public origin (used for canonical/OG + sitemap)

Then:

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`. Without Redis credentials it still
works — it just won't cache or rate-limit.

## Notes

The app degrades gracefully: if Redis is unavailable, explanations are still
generated (no caching, rate-limit checks fail open). Only **new** generations
count against the rate limits — cached pages are always free and unlimited.
