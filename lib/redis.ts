import { Redis } from "@upstash/redis";

/**
 * A single shared Upstash Redis client, created lazily from env vars.
 *
 * Redis is the app's cache: it stores generated explanations and the "latest
 * explained" list. If the env vars are missing (e.g. local dev without credentials)
 * we return `null` and every caller degrades gracefully — explanations are still
 * generated, just not cached — rather than crashing the render.
 */
let client: Redis | null = null;
let resolved = false;

export function getRedis(): Redis | null {
  if (resolved) return client;
  resolved = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "[redis] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — caching is disabled.",
    );
    return null;
  }

  client = new Redis({ url, token });
  return client;
}
