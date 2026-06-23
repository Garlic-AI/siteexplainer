# [SiteExplainer](https://www.siteexplainer.com/)

Paste any confusing website and get a clear, jargon-free explanation of what it
actually is and does. Every URL you explain becomes a permanent, server-rendered,
cached page at **`siteexplainer.com/<url>`** (e.g.
[`siteexplainer.com/vercel.com`](https://siteexplainer.com/vercel.com)).

## How it works

1. You paste a URL (or go straight to `siteexplainer.com/<url>`).
2. We fetch the page's own HTML and distill it down to the meaningful text.
3. We send that to [OpenRouter](https://openrouter.ai) — by default the **free**
   models (`openrouter/free` + a fallback list of free instruct models) — to write
   a short, plain-English explanation grounded only in the page's real content.
4. The result is cached in Redis forever and rendered server-side, so the page
   loads instantly and is fully indexable.

Because generation runs on free models, there's no per-request cost — OpenRouter's
own free-tier limits are the rate limiter, so the app has no rate-limiting code.

## Stack

- **Next.js 16** (App Router, React 19, server components + streaming)
- **Tailwind CSS v4**
- **OpenRouter** free models for generation (clean instruct models with automatic
  fallback when one is rate-limited; pin one via `OPENROUTER_MODEL`)
- **Upstash Redis** — caches explanations and the "recently explained" list
- Deployed on **Vercel**

## Running locally

Copy `.env.example` to `.env` and fill in the keys:

```bash
cp .env.example .env
```

- `OPENROUTER_API_KEY` — from https://openrouter.ai/keys (required)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — optional cache; create a
  free DB at https://console.upstash.com
- `OPENROUTER_MODEL` — optional, pin a single model instead of the free fallback list
- `NEXT_PUBLIC_SITE_URL` — your public origin (used for canonical/OG + sitemap)

Then:

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`. Without Redis credentials it still
works — it just won't cache (every visit regenerates).

## Notes

The app degrades gracefully: if Redis is unavailable, explanations are still
generated, just not cached. SSRF-hardened fetcher (DNS + private-IP checks on every
redirect hop). SSR + per-page metadata, sitemap, and robots make every `/<url>`
page indexable.
