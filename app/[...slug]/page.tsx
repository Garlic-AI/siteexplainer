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

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: `What is ${target.host}? · ${SITE_NAME}`,
      description,
      url: canonical,
      images: ["/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `What is ${target.host}?`,
      description,
      images: ["/og-image.png"],
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
        <div className="relative overflow-hidden">
          <div className="aurora pointer-events-none absolute inset-x-0 top-0 h-64" />
          <div className="relative mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-sm text-faint">
              <Link href="/" className="transition-colors hover:text-muted">
                SiteExplainer
              </Link>{" "}
              / explanation
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              What is{" "}
              <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
                {target.host}
              </span>
              ?
            </h1>

            <div className="mt-8">
              <Suspense fallback={<ExplanationSkeleton />}>
                <Explanation target={target} />
              </Suspense>
            </div>

            <div className="mt-12 border-t border-border/60 pt-8">
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
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
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
