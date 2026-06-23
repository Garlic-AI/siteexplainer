/** Shared bits for the generated OG images (next/og). */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Hex approximations of the OKLCH theme — Satori can't parse oklch().
export const OG = {
  bg: "#0a0a0a",
  bgTop: "#121214",
  surface: "#161618",
  border: "#2a2a2a",
  ink: "#fafafa",
  muted: "#a1a1aa",
  faint: "#71717a",
  accent: "#5b9bf0", // light blue (text)
  accentFill: "#0a72c4", // button blue
};

type OgFont = { name: string; data: Buffer; weight: 400 | 600 | 700; style: "normal" };

let fontsPromise: Promise<OgFont[]> | null = null;

// Static `new URL(..., import.meta.url)` literals so Next traces and bundles the
// font files into the serverless function — no CDN fetch at render time, so the OG
// image is bulletproof even on a cold start (which matters for slow social crawlers).
const FONT_FILES = {
  400: new URL("./fonts/inter-400.woff", import.meta.url),
  600: new URL("./fonts/inter-600.woff", import.meta.url),
  700: new URL("./fonts/inter-700.woff", import.meta.url),
} as const;

/** Load the bundled Inter weights once, cached. Falls back to the default font. */
export function loadOgFonts(): Promise<OgFont[]> {
  if (!fontsPromise) {
    const read = (u: URL) => readFile(fileURLToPath(u));
    fontsPromise = Promise.all([
      read(FONT_FILES[400]),
      read(FONT_FILES[600]),
      read(FONT_FILES[700]),
    ])
      .then(
        ([r, m, b]): OgFont[] => [
          { name: "Inter", data: r, weight: 400, style: "normal" },
          { name: "Inter", data: m, weight: 600, style: "normal" },
          { name: "Inter", data: b, weight: 700, style: "normal" },
        ],
      )
      .catch((err) => {
        console.error("[og] font load failed, using default:", err);
        return [];
      });
  }
  return fontsPromise;
}

/** Small brand mark used in the corner of each image. */
export function OgWordmark() {
  return {
    mark: OG.accentFill,
    name: "SiteExplainer",
  };
}
