/** Shared site-level constants. */

export const SITE_NAME = "SiteExplainer";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://siteexplainer.com"
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
