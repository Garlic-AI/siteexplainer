import { cache } from "react";
import { getRedis } from "./redis";
import { consumeGenerationQuota } from "./ratelimit";
import { fetchSiteContent, SiteFetchError } from "./fetch-site";
import { generateExplanation } from "./openrouter";
import type { NormalizedTarget } from "./url";

/**
 * The orchestration layer. `getOrCreateExplanation` is the single entry point used
 * by the permanent `/[...slug]` pages:  cache hit -> serve;  miss -> rate-limit ->
 * fetch -> generate -> persist forever.  Reads are deduped per request via React
 * `cache()` so `generateMetadata` and the page body share one Redis round-trip.
 */

const PAGE_PREFIX = "se:page:";
const SLUGS_SET = "se:slugs"; // every generated slug, for the sitemap
const LATEST_LIST = "se:latest"; // recent slugs, for the home page marquee
const LATEST_MAX = 40;

export type StoredPage = {
  url: string;
  slug: string;
  title: string;
  summary: string;
  createdAt: number;
};

export type ExplanationResult =
  | { status: "ok"; page: StoredPage; cached: boolean }
  | { status: "rate_limited"; scope: "ip" | "global" }
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
 * Get the cached explanation for a target, or create it (counting a cache miss
 * against the rate limits). The cheap dedup that matters — sharing one Redis read
 * with `generateMetadata` — lives in `getStoredPage`'s `cache()`, which this calls.
 */
export async function getOrCreateExplanation(
  target: NormalizedTarget,
  ip: string,
): Promise<ExplanationResult> {
  const existing = await getStoredPage(target.slug);
  if (existing) return { status: "ok", page: existing, cached: true };

  // Cache miss -> this will cost money, so it must pass the rate limits.
  const decision = await consumeGenerationQuota(ip);
  if (!decision.ok) return { status: "rate_limited", scope: decision.scope };

  let content;
  try {
    content = await fetchSiteContent(target.url);
  } catch (err) {
    if (err instanceof SiteFetchError) {
      return { status: "fetch_error", message: err.message };
    }
    console.error("[summary] fetch failed:", err);
    return { status: "fetch_error", message: "We couldn't read that site." };
  }

  let summary: string;
  try {
    summary = await generateExplanation(target.url, content);
  } catch (err) {
    console.error("[summary] generation failed:", err);
    return { status: "error", message: "We couldn't generate an explanation right now." };
  }

  const page: StoredPage = {
    url: target.url,
    slug: target.slug,
    title: content.title,
    summary,
    createdAt: Date.now(),
  };

  await persist(page);
  return { status: "ok", page, cached: false };
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
