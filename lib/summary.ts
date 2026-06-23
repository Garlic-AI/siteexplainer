import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getRedis } from "./redis";
import { fetchSiteContent, SiteFetchError } from "./fetch-site";
import { generateExplanation } from "./openrouter";
import type { NormalizedTarget } from "./url";

/**
 * The orchestration layer behind the permanent `/[...slug]` pages.
 *
 * An explanation is expensive to make (fetch + LLM) but identical on every visit, so
 * we cache it in TWO layers and only generate on a true miss:
 *   1. Upstash Redis (optional) — durable store that also powers the sitemap and the
 *      "recently explained" list. Skipped entirely if not configured.
 *   2. Next.js Data Cache via `unstable_cache` — always on, persists across requests
 *      and deployments on Vercel, so even without Redis a URL is generated once and
 *      then served from cache. Errors are thrown (never cached) so transient failures
 *      retry on the next visit.
 *
 * Generation runs on OpenRouter's free models, so there's no per-request cost and no
 * app-level rate limiting. Reads are deduped per request via React `cache()` so
 * `generateMetadata` and the page body share one round-trip.
 */

const PAGE_PREFIX = "se:page:";
const SLUGS_SET = "se:slugs"; // every generated slug, for the sitemap
const LATEST_LIST = "se:latest"; // recent slugs, for the home page list
const LATEST_MAX = 40;

// Bump to invalidate every Data-Cache explanation (e.g. after a prompt change).
const CACHE_VERSION = "v1";

export type StoredPage = {
  url: string;
  slug: string;
  title: string;
  summary: string;
  createdAt: number;
};

export type ExplanationResult =
  | { status: "ok"; page: StoredPage }
  | { status: "fetch_error"; message: string }
  | { status: "error"; message: string };

/** Pure cached read of a stored page — safe to call from generateMetadata. */
export const getStoredPage = cache(async (slug: string): Promise<StoredPage | null> => {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return await redis.get<StoredPage>(PAGE_PREFIX + slug);
  } catch (err) {
    console.error("[summary] redis read failed:", err);
    return null;
  }
});

/**
 * Get the cached explanation for a target, or create it (once). Tries durable Redis
 * first, then the Data-Cache-backed generator, which only runs the fetch + LLM on a
 * genuine miss. Failures surface as typed error results without being cached.
 */
export async function getOrCreateExplanation(
  target: NormalizedTarget,
): Promise<ExplanationResult> {
  const existing = await getStoredPage(target.slug);
  if (existing) return { status: "ok", page: existing };

  try {
    const page = await generatePageCached(target);
    return { status: "ok", page };
  } catch (err) {
    if (err instanceof SiteFetchError) {
      return { status: "fetch_error", message: err.message };
    }
    console.error("[summary] generation failed:", err);
    return { status: "error", message: "We couldn't generate an explanation right now." };
  }
}

/**
 * Fetch + generate a single page, wrapped in the Next.js Data Cache keyed by slug.
 * On a cache hit this returns instantly with no fetch/LLM call. Throwing (rather than
 * returning) on failure keeps errors out of the cache.
 */
function generatePageCached(target: NormalizedTarget): Promise<StoredPage> {
  return unstable_cache(
    async () => {
      const content = await fetchSiteContent(target.url);
      const summary = await generateExplanation(target.url, content);
      const page: StoredPage = {
        url: target.url,
        slug: target.slug,
        title: content.title,
        summary,
        createdAt: Date.now(),
      };
      // Best-effort durable copy for the sitemap / latest list (no-op without Redis).
      await persist(page);
      return page;
    },
    ["explanation", CACHE_VERSION, target.slug],
    { tags: [`explanation:${target.slug}`] },
  )();
}

async function persist(page: StoredPage): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await Promise.all([
      redis.set(PAGE_PREFIX + page.slug, page),
      redis.sadd(SLUGS_SET, page.slug),
      redis.lpush(LATEST_LIST, page.slug),
    ]);
    await redis.ltrim(LATEST_LIST, 0, LATEST_MAX - 1);
  } catch (err) {
    // A failed write just means this page isn't cached yet — never fatal to the render.
    console.error("[summary] persist failed:", err);
  }
}

/** Recently explained slugs, newest first, de-duplicated. For the home page. */
export const getLatestSlugs = cache(async (limit = 14): Promise<string[]> => {
  const redis = getRedis();
  if (!redis) return [];
  try {
    const raw = await redis.lrange(LATEST_LIST, 0, LATEST_MAX - 1);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const slug of raw) {
      if (!seen.has(slug)) {
        seen.add(slug);
        out.push(slug);
      }
      if (out.length >= limit) break;
    }
    return out;
  } catch (err) {
    console.error("[summary] latest read failed:", err);
    return [];
  }
});

/** Every generated slug — used by the sitemap so each page gets indexed. */
export async function getAllSlugs(): Promise<string[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    return await redis.smembers(SLUGS_SET);
  } catch (err) {
    console.error("[summary] slugs read failed:", err);
    return [];
  }
}
