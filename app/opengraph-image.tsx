import { ImageResponse } from "next/og";
import { OG, loadOgFonts } from "@/lib/og";

export const alt = "SiteExplainer — understand any website in seconds";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const fonts = await loadOgFonts();

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
        <Brand />

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 82,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: -2,
              maxWidth: 960,
            }}
          >
            Understand any website in seconds
          </div>
          <div style={{ fontSize: 32, color: OG.muted, maxWidth: 820 }}>
            Paste a confusing URL and get a clear, jargon-free explanation of what
            it actually does.
          </div>
        </div>

        <UrlChip slug="vercel.com" />
      </div>
    ),
    { ...size, fonts },
  );
}

function Brand() {
  return (
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
      <div style={{ fontSize: 34, fontWeight: 600 }}>SiteExplainer</div>
    </div>
  );
}

function UrlChip({ slug }: { slug: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 4,
        padding: "16px 24px",
        borderRadius: 14,
        background: OG.surface,
        border: `1px solid ${OG.border}`,
        fontSize: 30,
      }}
    >
      <span style={{ color: OG.muted }}>siteexplainer.com/</span>
      <span style={{ color: OG.accent, fontWeight: 600 }}>{slug}</span>
    </div>
  );
}
