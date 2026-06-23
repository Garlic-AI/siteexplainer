"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { normalizeInput } from "@/lib/url";
import { SAMPLE_SITES } from "@/lib/site";
import { ArrowRightIcon, SearchIcon, ShuffleIcon } from "./icons";

type Props = {
  /** Larger styling for the hero; compact for the in-page CTA. */
  size?: "hero" | "compact";
};

export function UrlForm({ size = "hero" }: Props) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function go(raw: string) {
    const target = normalizeInput(raw);
    if (!target) {
      setError("That doesn't look like a website URL. Try something like vercel.com");
      return;
    }
    setError(null);
    // Navigate to the permanent page — the explanation appears there and is cached.
    startTransition(() => router.push(`/${target.slug}`));
  }

  function surprise() {
    const pick = SAMPLE_SITES[Math.floor(Math.random() * SAMPLE_SITES.length)];
    setValue(pick);
    go(pick);
  }

  const hero = size === "hero";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go(value);
      }}
      className="w-full"
    >
      <div
        className={`flex items-center gap-2 rounded-xl border border-border bg-surface p-2 transition-colors focus-within:border-accent ${
          hero ? "sm:p-2.5" : ""
        }`}
      >
        <SearchIcon className="ml-2 shrink-0 text-faint" />
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Website URL"
          aria-invalid={error ? true : undefined}
          placeholder="paste any confusing website…"
          className={`w-full bg-transparent text-ink placeholder:text-faint focus:outline-none ${
            hero ? "px-1 py-2 text-base sm:text-lg" : "px-1 py-1.5 text-sm"
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent font-medium text-white transition-colors hover:bg-accent-strong disabled:opacity-60 ${
            hero ? "px-4 py-2.5 text-sm sm:text-base" : "px-3 py-2 text-sm"
          }`}
        >
          {pending ? "Explaining…" : "Explain"}
          {!pending && <ArrowRightIcon width={18} height={18} />}
        </button>
      </div>

      <div className="mt-3 flex min-h-5 items-center justify-between gap-3 px-1">
        <p
          className={`text-sm ${error ? "text-rose-400" : "text-faint"}`}
          role={error ? "alert" : undefined}
        >
          {error ?? "We fetch the page, then explain it in plain English."}
        </p>
        {hero && (
          <button
            type="button"
            onClick={surprise}
            disabled={pending}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink disabled:opacity-60"
          >
            <ShuffleIcon width={16} height={16} />
            Surprise me
          </button>
        )}
      </div>
    </form>
  );
}
