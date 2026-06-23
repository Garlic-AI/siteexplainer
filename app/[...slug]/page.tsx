import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { targetFromSlug } from "@/lib/url";
import { getStoredPage } from "@/lib/summary";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { SiteHeader } from "../_components/site-header";
import { Footer } from "../_components/footer";
import { UrlForm } from "../_components/url-form";
import { Explanation } from "./explanation";

type RouteParams = { params: Promise<{ slug: string[] }> };

// On-demand ISR: nothing is prebuilt, but the first visit to /<url> renders the
// page once and caches it as STATIC HTML served from the CDN. The generation itself
// is cached forever (unstable_cache), so the hourly background revalidate just
// re-renders from cached data — no repeat fetch or LLM call. This is what makes
// /vercel.com a static page after the first hit instead of re-rendering every time.
export const dynamicParams = true;
export const revalidate = 3600;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const target = targetFromSlug(slug);
  if (!target) return { title: "Not found", robots: { index: false } };

  // Read-only: rich metadata once cached, generic before first generation.
  const stored = await getStoredPage(target.slug);
  const canonical = `${SITE_URL}/${target.slug}`;
  const title = `What is ${target.host}?`;
  const description = stored?.summary
    ? stored.summary.slice(0, 200)
    : `A plain-English explanation of what ${target.host} is and does, by ${SITE_NAME}.`;
  const ogImage = `/og?slug=${encodeURIComponent(target.slug)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: `What is ${target.host}? · ${SITE_NAME}`,
      description,
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `What is ${target.host}?`,
      description,
      images: [ogImage],
    },
  };
}

export default async function SitePage({ params }: RouteParams) {
  const { slug } = await params;
  const target = targetFromSlug(slug);
  if (!target) notFound();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div>
          <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-sm text-faint">
              <Link href="/" className="transition-colors hover:text-muted">
                SiteExplainer
              </Link>{" "}
              / explanation
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              What is <span className="text-accent">{target.host}</span>?
            </h1>

            <div className="mt-8">
              <Suspense fallback={<ExplanationSkeleton />}>
                <Explanation target={target} />
              </Suspense>
            </div>

            <div className="mt-12 border-t border-border pt-8">
              <p className="mb-3 text-sm text-muted">Explain another site</p>
              <UrlForm size="compact" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ExplanationSkeleton() {
  return (
    <div className="raised rounded-xl p-6 sm:p-8">
      <div className="mb-5 h-4 w-32 animate-pulse rounded bg-surface-2" />
      <div className="space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-[92%] animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-[78%] animate-pulse rounded bg-surface-2" />
      </div>
      <p className="mt-6 text-sm text-faint">Reading the site and writing a plain-English explanation…</p>
    </div>
  );
}
