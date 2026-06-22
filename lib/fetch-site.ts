/**
 * Intelligent site fetch + text extraction.
 *
 * We fetch the page ourselves (no third-party scraping proxy) with a real browser
 * User-Agent and a hard timeout, then distill it down to the few signals that tell
 * an LLM what the site is: <title>, the meta/OG description, and the main visible
 * copy with boilerplate (scripts, styles, nav, svg) stripped out.
 */

import { assertPublicHost, BlockedHostError } from "./safe-net";

const FETCH_TIMEOUT_MS = 9000;
const MAX_TEXT_CHARS = 12_000; // ~3–4k tokens, plenty to characterize a site
const MAX_REDIRECTS = 5;
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

export type SiteContent = {
  title: string;
  description: string;
  text: string;
};

export class SiteFetchError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "SiteFetchError";
    this.status = status;
  }
}

export async function fetchSiteContent(url: string): Promise<SiteContent> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetchValidated(url, controller.signal);
  } catch (err) {
    if (err instanceof SiteFetchError) throw err;
    if (err instanceof BlockedHostError) {
      throw new SiteFetchError("That site points somewhere we don't fetch.", 400);
    }
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new SiteFetchError(
      aborted ? "The site took too long to respond." : "We couldn't reach that site.",
      504,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new SiteFetchError(`The site returned an error (${res.status}).`, 502);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("html") && !contentType.includes("text")) {
    throw new SiteFetchError("That URL doesn't point to a readable web page.", 415);
  }

  const html = await res.text();
  const content = extractContent(html);

  if (content.text.length < 40 && !content.title && !content.description) {
    throw new SiteFetchError("There wasn't enough readable content on that page.", 422);
  }

  return content;
}

const BROWSER_HEADERS = {
  // A realistic browser UA — many sites' WAFs reject anything that looks like a
  // bot, and our only job is to read the page a human would see.
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

/**
 * Fetch with manual redirect handling, validating each hop's host against the SSRF
 * guard *before* connecting — so a public URL can never bounce us into internal infra.
 */
async function fetchValidated(startUrl: string, signal: AbortSignal): Promise<Response> {
  let current = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const { hostname } = new URL(current);
    await assertPublicHost(hostname); // throws BlockedHostError if non-public

    const res = await fetch(current, { signal, redirect: "manual", headers: BROWSER_HEADERS });

    if (!REDIRECT_CODES.has(res.status)) return res;

    const location = res.headers.get("location");
    if (!location) return res; // redirect with no target — let caller treat as error
    current = new URL(location, current).toString();
  }

  throw new SiteFetchError("That site redirects too many times.", 508);
}

/** Pull title, description, and cleaned body text out of raw HTML — no DOM, no deps. */
export function extractContent(html: string): SiteContent {
  const title = decodeEntities(
    matchFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i) ?? "",
  ).trim();

  const description = decodeEntities(
    metaContent(html, "description") ??
      metaContent(html, "og:description") ??
      metaContent(html, "twitter:description") ??
      "",
  ).trim();

  // Prefer <body>; fall back to the whole document.
  const body = matchFirst(html, /<body[^>]*>([\s\S]*?)<\/body>/i) ?? html;

  const text = decodeEntities(
    body
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_CHARS);

  return { title, description, text };
}

function matchFirst(input: string, re: RegExp): string | null {
  const m = input.match(re);
  return m ? m[1] : null;
}

/** Read a <meta name="..."> or <meta property="..."> content value, attribute-order agnostic. */
function metaContent(html: string, key: string): string | null {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${esc}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${esc}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return m[1];
  }
  return null;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  "#39": "'",
};

function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, code: string) => {
    const lower = code.toLowerCase();
    if (lower in NAMED_ENTITIES) return NAMED_ENTITIES[lower];
    if (code[0] === "#") {
      const num = code[1] === "x" || code[1] === "X"
        ? Number.parseInt(code.slice(2), 16)
        : Number.parseInt(code.slice(1), 10);
      if (Number.isFinite(num)) return String.fromCodePoint(num);
    }
    return whole;
  });
}
