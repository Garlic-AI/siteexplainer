/** Shared site-level constants. */

export const SITE_NAME = "SiteExplainer";

// Use the canonical serving host (www). The apex 308-redirects here, and social
// crawlers (notably X/Twitter) won't follow a redirect for og:image — so canonical
// and image URLs must be direct, non-redirecting www URLs.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.siteexplainer.com"
).replace(/\/+$/, "");

export const SITE_TAGLINE =
  "Instantly understand what any website actually does — minus the marketing jargon.";

/** A handful of recognizable sites for the "Surprise me" button + empty states. */
export const SAMPLE_SITES = [
  "linear.app",
  "vercel.com",
  "notion.com",
  "stripe.com",
  "figma.com",
  "supabase.com",
  "anthropic.com",
  "cloudflare.com",
  "railway.app",
  "huggingface.co",
  "raycast.com",
  "posthog.com",
  "retool.com",
  "clerk.com",
];
