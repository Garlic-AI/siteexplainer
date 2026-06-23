import { Suspense } from "react";
import { SiteHeader } from "./_components/site-header";
import { Footer } from "./_components/footer";
import { UrlForm } from "./_components/url-form";
import { LatestSearches } from "./_components/latest-searches";
import { Faq } from "./_components/faq";
import { ArrowRightIcon, SearchIcon, SparklesIcon } from "./_components/icons";

// Statically render + refresh every minute so `curl` always gets full HTML
// while "recently explained" stays reasonably fresh.
export const revalidate = 60;

const STEPS = [
  {
    title: "Paste a URL",
    body: "Drop in any confusing landing page — or skip the form and type the address bar directly.",
    icon: SearchIcon,
  },
  {
    title: "We read the page",
    body: "We fetch the site's own content and distill it down to what actually matters.",
    icon: SparklesIcon,
  },
  {
    title: "Get a plain-English explainer",
    body: "A short, jargon-free summary of what the site is and does — saved to a permanent page.",
    icon: ArrowRightIcon,
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section>
          <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
              <SparklesIcon width={14} height={14} className="text-muted" />
              AI website explainer
            </span>

            <h1 className="text-balance text-4xl font-semibold sm:text-6xl">
              Understand any website in seconds
            </h1>

            <p className="mt-5 max-w-xl text-pretty text-lg text-muted">
              Paste a confusing landing page and get a clear, jargon-free explanation of
              what it actually is and does.
            </p>

            <div className="mt-9 w-full max-w-xl">
              <UrlForm size="hero" />
            </div>

            {/* The key behavior users should learn. */}
            <p className="mt-6 text-sm text-faint">
              Pro tip: open{" "}
              <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-ink">
                siteexplainer.com/<span className="text-muted">vercel.com</span>
              </span>{" "}
              and any URL explains itself.
            </p>
          </div>
        </section>

        {/* Latest searches */}
        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
          <Suspense fallback={<div className="h-12" />}>
            <LatestSearches />
          </Suspense>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
            <h2 className="text-center text-2xl font-semibold sm:text-3xl">
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted">
              Every site you explain becomes a permanent, shareable page at{" "}
              <span className="font-mono text-ink">siteexplainer.com/&lt;url&gt;</span>.
            </p>
            <ol className="mt-12 grid gap-4 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="rounded-xl border border-border bg-surface p-6"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-lg border border-border bg-surface-2 text-ink">
                      <step.icon width={18} height={18} />
                    </span>
                    <span className="font-mono text-sm text-faint">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-medium">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <Faq />
        </section>
      </main>

      <Footer />
    </div>
  );
}
