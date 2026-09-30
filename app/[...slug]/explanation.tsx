import Link from "next/link";
import { getOrCreateExplanation } from "@/lib/summary";
import type { NormalizedTarget } from "@/lib/url";
import { ShareRow } from "../_components/share-button";
import { ExternalIcon } from "../_components/icons";

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

  const { page } = result;
  const { overview, whatItDoes, whyUseful, example, developerDetails } = page.explanation;
  const sections = [
    { title: "What it does", text: whatItDoes },
    { title: "Why it's useful", text: whyUseful },
    { title: "One way to use it", text: example },
    { title: "For developers", text: developerDetails },
  ].filter((section) => section.text);

  return (
    <div>
      <div className="raised rounded-xl p-6 sm:p-8">
        <p className="text-pretty text-xl font-medium leading-relaxed text-ink">
          {overview}
        </p>
        <div className="mt-7 space-y-6">
          {sections.map(({ title, text }) => (
            <section key={title}>
              <h2 className="text-sm font-semibold text-ink">{title}</h2>
              <p className="mt-2 text-pretty leading-relaxed text-muted">{text}</p>
            </section>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
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
        Based on the site's content. Examples illustrate possible uses.{" "}
        <Link href="/" className="underline hover:text-muted">Explain another site →</Link>
      </p>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="raised rounded-xl p-6 sm:p-8">
      <h2 className="flex items-center gap-2 font-medium text-danger">
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
