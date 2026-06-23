/** Shared bits for the generated OG images (next/og). */

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

type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 600 | 700; style: "normal" };

let fontsPromise: Promise<OgFont[]> | null = null;

/** Load Inter (400/600/700) once, cached. Falls back to the default font on failure. */
export function loadOgFonts(): Promise<OgFont[]> {
  if (!fontsPromise) {
    const url = (w: number) =>
      `https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-${w}-normal.woff`;
    fontsPromise = Promise.all([
      fetch(url(400)).then((r) => r.arrayBuffer()),
      fetch(url(600)).then((r) => r.arrayBuffer()),
      fetch(url(700)).then((r) => r.arrayBuffer()),
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
