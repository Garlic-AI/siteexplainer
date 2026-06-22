import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

/**
 * Two layers of protection so a runaway URL spree can't drain the OpenRouter budget:
 *
 *  1. Per-IP daily cap  — stops a single visitor from hammering us.
 *  2. Global daily cap  — the hard wallet guard across ALL users combined.
 *
 * Only *new* generations (cache misses) are ever counted, so cached pages stay free
 * and unlimited. Limits are checked lazily and share the one Upstash client.
 */

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const PER_IP_PER_DAY = intFromEnv("RATE_LIMIT_PER_IP_PER_DAY", 20);
const GLOBAL_PER_DAY = intFromEnv("RATE_LIMIT_GLOBAL_PER_DAY", 1000);

let perIp: Ratelimit | null = null;
let global: Ratelimit | null = null;
let built = false;

function build() {
  if (built) return;
  built = true;
  const redis = getRedis();
  if (!redis) return;

  perIp = new Ratelimit({
    redis,
    prefix: "se:rl:ip",
    limiter: Ratelimit.fixedWindow(PER_IP_PER_DAY, "1 d"),
    analytics: false,
  });
  global = new Ratelimit({
    redis,
    prefix: "se:rl:global",
    limiter: Ratelimit.fixedWindow(GLOBAL_PER_DAY, "1 d"),
    analytics: false,
  });
}

export type RateDecision =
  | { ok: true }
  | { ok: false; scope: "ip" | "global" };

/**
 * Consume one unit of quota for a new generation. Returns whether it's allowed.
 *
 * The per-IP cap is checked first; the global cap is only consumed if it passes,
 * so a blocked visitor never burns global budget. If Redis is unavailable we fail
 * OPEN — the site keeps working; the global cap is the real guard during normal ops.
 */
export async function consumeGenerationQuota(ip: string): Promise<RateDecision> {
  build();
  if (!perIp || !global) return { ok: true };

  try {
    const ipResult = await perIp.limit(ip);
    if (!ipResult.success) return { ok: false, scope: "ip" };

    const globalResult = await global.limit("all");
    if (!globalResult.success) return { ok: false, scope: "global" };

    return { ok: true };
  } catch (err) {
    console.error("[ratelimit] check failed, allowing request:", err);
    return { ok: true };
  }
}

export const limits = { perIpPerDay: PER_IP_PER_DAY, globalPerDay: GLOBAL_PER_DAY };
