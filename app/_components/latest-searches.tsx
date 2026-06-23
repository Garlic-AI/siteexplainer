import Link from "next/link";
import { getLatestSlugs } from "@/lib/summary";
import { SAMPLE_SITES } from "@/lib/site";
import { SearchIcon } from "./icons";

export async function LatestSearches() {
  const latest = await getLatestSlugs(12);
  // Fall back to curated samples so the section always has something to show.
  const slugs = latest.length > 0 ? latest : SAMPLE_SITES.slice(0, 12);
  const heading = latest.length > 0 ? "Recently explained" : "Try one of these";

  return (
    <section aria-label={heading} className="w-full">
      <h2 className="mb-4 text-center text-sm font-medium text-faint">{heading}</h2>
      <ul className="flex flex-wrap justify-center gap-2">
        {slugs.map((slug) => (
          <li key={slug}>
            <Link
              href={`/${slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-muted transition-colors hover:border-faint hover:text-ink"
            >
              <SearchIcon width={14} height={14} className="text-faint" />
              {slug}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
