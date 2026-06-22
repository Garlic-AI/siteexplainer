"use client";

import { useState } from "react";
import { SITE_URL } from "@/lib/site";
import { CheckIcon, CopyIcon, TwitterIcon } from "./icons";

export function ShareRow({ host, slug }: { host: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const pageUrl = `${SITE_URL}/${slug}`;
  const tweet = `I finally understand what ${host} does, thanks to ${pageUrl}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-muted transition-colors hover:border-faint hover:text-ink"
      >
        {copied ? <CheckIcon width={16} height={16} className="text-emerald-400" /> : <CopyIcon width={16} height={16} />}
        {copied ? "Copied link" : "Copy link"}
      </button>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-muted transition-colors hover:border-faint hover:text-ink"
      >
        <TwitterIcon />
        Share
      </a>
    </div>
  );
}
