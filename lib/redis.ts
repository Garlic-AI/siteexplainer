import { Redis } from "@upstash/redis";

/**
 * A single shared Upstash Redis client, created lazily from env vars.
 *
 * Redis is the app's only datastore: it caches generated explanations, keeps the
 * "latest searches" list, and backs rate limiting. If the env vars are missing
 * (e.g. local dev without credentials) we return `null` and every caller degrades
 * gracefully rather than crashing the render.
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
      "[redis] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — caching and rate limiting are disabled.",
    );
    return null;
  }

  client = new Redis({ url, token });
  return client;
}
