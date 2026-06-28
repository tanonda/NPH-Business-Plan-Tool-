"use client";

import { useMemo, useState } from "react";

type ExecutiveReportButtonProps = {
  /** The saved BusinessPlan id from the database. */
  planId?: string | null;
  /** Optional display title used for the browser tab/window title only. */
  planTitle?: string | null;
  /** Optional custom label for the button. */
  label?: string;
  /** Optional CSS classes if your app uses Tailwind/shadcn styling. */
  className?: string;
  /** Opens in a new browser tab by default. */
  openInNewTab?: boolean;
};

/**
 * Drop-in button for opening the executive report print/PDF route.
 *
 * Place this file at:
 *   src/components/ExecutiveReportButton.tsx
 *
 * Then import it where you show a saved plan:
 *   import { ExecutiveReportButton } from "@/components/ExecutiveReportButton";
 *
 * Usage:
 *   <ExecutiveReportButton planId={selectedPlan.id} planTitle={selectedPlan.title} />
 */
export function ExecutiveReportButton({
  planId,
  planTitle,
  label = "Executive Report",
  className = "",
  openInNewTab = true,
}: ExecutiveReportButtonProps) {
  const [copied, setCopied] = useState(false);

  const reportUrl = useMemo(() => {
    if (!planId) return "";
    return `/api/plans/${encodeURIComponent(planId)}/executive-report`;
  }, [planId]);

  const disabled = !planId;

  function openReport() {
    if (!reportUrl) return;

    if (openInNewTab) {
      const win = window.open(reportUrl, "_blank", "noopener,noreferrer");
      if (win) {
        win.document.title = planTitle
          ? `${planTitle} - Executive Report`
          : "Executive Report";
      }
      return;
    }

    window.location.href = reportUrl;
  }

  async function copyReportLink() {
    if (!reportUrl) return;

    const absoluteUrl = `${window.location.origin}${reportUrl}`;

    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can fail on non-secure origins. Fallback: open the report.
      openReport();
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={openReport}
        disabled={disabled}
        title={
          disabled
            ? "Save or select a plan before generating the executive report."
            : "Open printable executive report. Use your browser's Print > Save as PDF."
        }
        className={[
          "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
          "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/30 hover:bg-cyan-500/25 hover:ring-cyan-300/50",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-cyan-500/15 disabled:hover:ring-cyan-400/30",
          className,
        ].join(" ")}
      >
        <span aria-hidden="true">📄</span>
        <span>{label}</span>
      </button>

      <button
        type="button"
        onClick={copyReportLink}
        disabled={disabled}
        title="Copy executive report link"
        className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 ring-1 ring-slate-600/60 transition hover:bg-slate-800/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

export default ExecutiveReportButton;
