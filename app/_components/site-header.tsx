import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { GitHubIcon, SparklesIcon } from "./icons";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white shadow-sm">
            <SparklesIcon width={16} height={16} />
          </span>
          <span>
            {SITE_NAME.replace("Explainer", "")}
            <span className="text-muted group-hover:text-ink">
              Explainer
            </span>
          </span>
        </Link>
        <a
          href="https://github.com/Garlic-AI/siteexplainer"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-faint hover:text-ink"
        >
          <GitHubIcon />
          <span className="hidden sm:inline">Star on GitHub</span>
        </a>
      </div>
    </header>
  );
}
