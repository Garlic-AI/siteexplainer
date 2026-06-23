const FAQ_ITEMS = [
  {
    q: "What is SiteExplainer?",
    a: "SiteExplainer reads a website for you and explains, in plain English, what it actually is and does — cutting through the marketing jargon on confusing landing pages.",
  },
  {
    q: "How do I use it?",
    a: "Paste a URL on the home page, or go straight to siteexplainer.com/<url> — for example siteexplainer.com/vercel.com. Either way you land on a permanent page with the explanation.",
  },
  {
    q: "Does every URL get its own page?",
    a: "Yes. The first time a site is explained we fetch it, generate a summary, and save it. After that, siteexplainer.com/<url> serves the cached explanation instantly and stays live for everyone.",
  },
  {
    q: "How does it work under the hood?",
    a: "We fetch the page's own HTML, strip it down to the meaningful text, and pass that to an AI model to summarize. We never make things up — the explanation is grounded in the page's real content.",
  },
  {
    q: "Is it accurate?",
    a: "It's a fast, automated summary of the page text, so treat it as a helpful overview rather than a guarantee. It's great for quickly grasping what a site is about.",
  },
  {
    q: "Is it free?",
    a: "Yes, it's free to use. There are generous rate limits in place to keep the service sustainable.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto w-full max-w-3xl scroll-mt-20">
      <h2 className="text-center text-2xl font-semibold sm:text-3xl">
        Frequently asked questions
      </h2>
      <div className="mt-8 divide-y divide-border/70 overflow-hidden rounded-xl border border-border bg-surface">
        {FAQ_ITEMS.map((item) => (
          <details key={item.q} className="group px-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium">
              {item.q}
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border text-muted transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="pb-5 text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
