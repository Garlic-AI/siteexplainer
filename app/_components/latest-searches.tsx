import Link from "next/link";
import { getLatestSlugs } from "@/lib/summary";
import { SAMPLE_SITES } from "@/lib/site";
import { SearchIcon } from "./icons";

export async function LatestSearches() {
  const latest = await getLatestSlugs(14);
  // Fall back to curated samples so the strip always looks alive.
  const slugs = latest.length > 0 ? latest : SAMPLE_SITES;
  const heading = latest.length > 0 ? "Recently explained" : "Try one of these";

  // Duplicate the list so the CSS marquee can loop seamlessly.
  const loop = [...slugs, ...slugs];

  return (
    <section aria-label={heading} className="w-full">
      <h2 className="mb-4 text-center text-sm font-medium uppercase tracking-wider text-faint">
        {heading}
      </h2>
      <div className="marquee-mask overflow-hidden">
        <ul className="marquee-track gap-3">
          {loop.map((slug, i) => (
            <li key={`${slug}-${i}`} className="shrink-0">
              <Link
                href={`/${slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted transition-colors hover:border-faint hover:text-ink"
              >
                <SearchIcon width={14} height={14} className="text-faint" />
                {slug}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
