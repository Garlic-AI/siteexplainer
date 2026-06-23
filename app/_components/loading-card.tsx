"use client";

import { useEffect, useState } from "react";
import { SparklesIcon } from "./icons";

/**
 * The loading state shown while an explanation is generated. It mirrors the real
 * result card (so the swap is seamless) and walks through the actual steps —
 * fetching, reading, writing — so the wait reads as progress, not a hang.
 */
export function LoadingCard({ host }: { host?: string }) {
  const steps = [
    `Fetching ${host ?? "the site"}`,
    "Reading the page",
    "Writing a plain-English explanation",
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Advance through the steps and hold on the last one.
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }, 1300);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div className="raised rounded-xl p-6 sm:p-8" aria-busy="true" aria-live="polite">
      <div className="mb-4 flex items-center gap-2 text-sm text-accent">
        <SparklesIcon width={16} height={16} />
        <span className="font-medium">In plain English</span>
      </div>

      <div className="space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-[94%] animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-[88%] animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-[62%] animate-pulse rounded bg-surface-2" />
      </div>

      <div className="mt-6 flex items-center gap-2.5 text-sm text-muted">
        <span
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-border border-t-accent"
          aria-hidden
        />
        <span>{steps[step]}…</span>
      </div>
    </div>
  );
}
