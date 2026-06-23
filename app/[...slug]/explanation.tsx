import Link from "next/link";
import { getOrCreateExplanation } from "@/lib/summary";
import type { NormalizedTarget } from "@/lib/url";
import { ShareRow } from "../_components/share-button";
import { ExternalIcon, SparklesIcon } from "../_components/icons";

/**
 * Async server component that resolves the explanation. Rendered inside a Suspense
 * boundary so the page shell streams instantly while this awaits fetch + generation.
 */
export async function Explanation({ target }: { target: NormalizedTarget }) {
  const result = await getOrCreateExplanation(target);

  if (result.status === "fetch_error") {
    return (
      <Notice title="Couldn't read that site">
        {result.message} Double-check the address, or try a different site.
      </Notice>
    );
  }

  if (result.status === "error") {
    return (
      <Notice title="Something went wrong">
        {result.message} Please try again in a moment.
      </Notice>
    );
  }

  const { page, cached } = result;

  return (
    <div className="animate-fade-up">
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-2 text-sm text-accent">
          <SparklesIcon width={16} height={16} />
          <span className="font-medium">In plain English</span>
        </div>
        <p className="text-pretty text-lg leading-relaxed text-ink">
          {page.summary}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-5">
          <ShareRow host={target.host} slug={target.slug} />
          <a
            href={page.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
          >
            Visit {target.host}
            <ExternalIcon width={15} height={15} />
          </a>
        </div>
      </div>

      <p className="mt-3 px-1 text-xs text-faint">
        {cached ? "Served from cache" : "Freshly explained"} · grounded in the site's own
        content. <Link href="/" className="underline hover:text-muted">Explain another site →</Link>
      </p>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="animate-fade-up rounded-2xl border border-rose-500/40 bg-surface p-6 sm:p-8">
      <h2 className="flex items-center gap-2 font-medium text-rose-400">
        <span aria-hidden>●</span>
        {title}
      </h2>
      <p className="mt-2 text-muted">{children}</p>
      <Link
        href="/"
        className="mt-5 inline-flex text-sm text-muted underline transition-colors hover:text-ink"
      >
        ← Back to SiteExplainer
      </Link>
    </div>
  );
}
