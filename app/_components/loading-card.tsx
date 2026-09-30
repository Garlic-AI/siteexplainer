"use client";

import { useEffect, useState } from "react";

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
      <div className="space-y-3">
        <div className="h-5 w-full animate-pulse rounded bg-surface-2" />
        <div className="h-5 w-[82%] animate-pulse rounded bg-surface-2" />
        <div className="pt-4">
          <div className="h-4 w-36 animate-pulse rounded bg-surface-2" />
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-surface-2" />
          <div className="mt-3 h-4 w-[90%] animate-pulse rounded bg-surface-2" />
        </div>
        <div className="pt-3">
          <div className="h-4 w-28 animate-pulse rounded bg-surface-2" />
          <div className="mt-3 h-4 w-[86%] animate-pulse rounded bg-surface-2" />
        </div>
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
