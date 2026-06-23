import { ImageResponse } from "next/og";
import { normalizeInput } from "@/lib/url";
import { getStoredPage } from "@/lib/summary";
import { OG, loadOgFonts } from "@/lib/og";

// Per-URL OG image. A catch-all segment can't host an `opengraph-image` file, so the
// slug pages point their og:image at `/og?slug=<url>` and we render it here.
export const revalidate = 3600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = normalizeInput(searchParams.get("slug") ?? "");
  const host = target?.host ?? "this site";
  const fonts = await loadOgFonts();

  let sub = `What ${host} actually is and does — in plain English.`;
  if (target) {
    try {
      const stored = await getStoredPage(target.slug);
      if (stored?.summary) sub = clamp(stored.summary, 165);
    } catch {
      /* fall back to the tagline */
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: `linear-gradient(150deg, ${OG.bgTop}, ${OG.bg})`,
          color: OG.ink,
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: OG.accentFill,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
              <path d="m6.3 6.3 1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4" />
            </svg>
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, color: OG.muted }}>SiteExplainer</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 52, color: OG.muted }}>What is</span>
            <span style={{ fontSize: 92, fontWeight: 700, letterSpacing: -2, color: OG.accent }}>
              {host}
            </span>
            <span style={{ fontSize: 52, color: OG.muted }}>?</span>
          </div>
          <div style={{ display: "flex", fontSize: 32, lineHeight: 1.3, color: OG.muted, maxWidth: 1020 }}>
            {sub}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            alignSelf: "flex-start",
            padding: "16px 24px",
            borderRadius: 14,
            background: OG.surface,
            border: `1px solid ${OG.border}`,
            fontSize: 28,
          }}
        >
          <span style={{ color: OG.muted }}>siteexplainer.com/</span>
          <span style={{ color: OG.ink, fontWeight: 600 }}>{target?.slug ?? ""}</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts },
  );
}

function clamp(text: string, max: number): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}
