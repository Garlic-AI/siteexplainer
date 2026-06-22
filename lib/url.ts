/**
 * URL normalization shared by the home form and the permanent `/[...slug]` pages.
 *
 * The whole product hinges on a stable mapping:  user input  ->  canonical URL
 * ->  canonical slug. The slug is what lives at `siteexplainer.com/<slug>` and is
 * also the cache key, so two spellings of the same site must collapse to one entry.
 */

export type NormalizedTarget = {
  /** Canonical absolute URL we actually fetch, e.g. "https://vercel.com". */
  url: string;
  /** Hostname, e.g. "vercel.com". */
  host: string;
  /** Canonical path used in our own URL + cache key, e.g. "vercel.com" or "vercel.com/pricing". */
  slug: string;
};

const STRIP_WWW = /^www\./i;

/**
 * Parse arbitrary user input ("vercel.com", "https://Vercel.com/", "vercel.com/x")
 * into a canonical target, or `null` if it can't be a real website.
 */
export function normalizeInput(raw: string): NormalizedTarget | null {
  if (!raw) return null;

  let input = raw.trim();
  if (!input || /\s/.test(input)) return null; // a real URL has no spaces

  if (!/^https?:\/\//i.test(input)) {
    input = `https://${input}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const host = parsed.hostname.toLowerCase().replace(STRIP_WWW, "");

  // Require a dotted, public-looking hostname so we never try to fetch localhost,
  // bare words, IPs, or internal hosts.
  if (!host.includes(".") || host.endsWith(".") || isPrivateHost(host)) return null;

  // Always serve over https and drop default ports / fragments.
  const path = parsed.pathname.replace(/\/+$/, ""); // strip trailing slashes
  const search = parsed.search || "";
  const url = `https://${host}${path}${search}`;

  const slug = `${host}${path}${search}`;

  return { url, host, slug };
}

/**
 * Rebuild a target from the catch-all route segments of `/[...slug]`.
 * Next.js gives us already-decoded segments; we re-join and re-normalize.
 */
export function targetFromSlug(slugSegments: string[]): NormalizedTarget | null {
  if (!slugSegments || slugSegments.length === 0) return null;
  const joined = slugSegments.map((s) => decodeURIComponent(s)).join("/");
  return normalizeInput(joined);
}

/** Block obvious non-public hosts so the fetcher can't be pointed at internal infra. */
export function isPrivateHost(host: string): boolean {
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host.endsWith(".local") || host.endsWith(".internal")) return true;
  // Raw IPv4 — including private ranges. We only ever explain public domains.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return false;
}
