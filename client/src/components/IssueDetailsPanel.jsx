import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { summarizeIssue } from "../services/api.js";
import IssueMarkdown from "./IssueMarkdown.jsx";

const categoryColors = {
  Bug: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  Question: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  Documentation: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  Enhancement: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  Performance: "border-teal-500/30 bg-teal-500/10 text-teal-300",
};

const priorityColors = {
  critical: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  high: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

function Section({ title, description, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-slate-800 bg-[#0b1220] p-5 sm:p-6 ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-400">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function IssueDetailsPanel({ issue, onClose }) {
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const requestId = useRef(0);

  const originalLabels = issue?.original_labels ?? issue?.labels ?? [];
  const predictedLabel = issue?.predicted_label || "Unknown";
  const priority = issue?.suggested_priority || "Unknown";

  useEffect(() => {
    requestId.current += 1;
    setSummary("");
    setSummaryError("");
    setSummaryLoading(false);

    return () => {
      requestId.current += 1;
    };
  }, [issue?.id, issue?.number]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const scrollableElements = document.querySelectorAll(
      "main, [class*='overflow-y-auto'], [class*='overflow-auto']"
    );

    scrollableElements.forEach((element) => {
      element.scrollTop = 0;
    });
  }, [issue?.number]);

  if (!issue) return null;

  async function handleSummarize() {
    const currentRequest = ++requestId.current;

    setSummaryLoading(true);
    setSummaryError("");
    setSummary("");

    try {
      const data = await summarizeIssue(issue.title, issue.body || "");

      if (requestId.current !== currentRequest) return;

      setSummary(data.summary || "No summary was returned.");
    } catch (error) {
      if (requestId.current !== currentRequest) return;

      setSummaryError(error.message || "Failed to summarize this issue.");
    } finally {
      if (requestId.current === currentRequest) {
        setSummaryLoading(false);
      }
    }
  }

  const scores = Object.entries(issue.category_scores ?? {})
    .map(([category, score]) => ({
      category,
      percentage: Math.min(100, Math.max(0, Number(score) * 100 || 0)),
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="min-h-screen text-slate-200">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 border-b border-slate-800 pb-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            >
              <span aria-hidden="true">←</span>
              Back to dashboard
            </button>

            <a
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
            >
              View on GitHub ↗
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-300">
              #{issue.number}
            </span>

            <span
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${String(issue.state || "open").toLowerCase() === "closed"
                  ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                }`}
            >
              {issue.state || "Open"}
            </span>

            <span
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${categoryColors[predictedLabel] ||
                "border-slate-700 bg-slate-800 text-slate-300"
                }`}
            >
              {predictedLabel}
            </span>
          </div>

          <h1 className="mt-5 max-w-4xl text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
            {issue.title}
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Issue details and ML-powered analysis
          </p>
        </header>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <Section
              title="Issue Description"
              description="Original issue content from GitHub."
            >
              {issue.body?.trim() ? (
                <IssueMarkdown content={issue.body} />
              ) : (
                <p className="text-sm text-slate-500">
                  No description provided for this issue.
                </p>
              )}
            </Section>

            <Section
              title="AI Summary"
              description="A concise overview to help you understand the issue quickly."
              className="border-indigo-500/20"
            >
              <button
                type="button"
                onClick={handleSummarize}
                disabled={summaryLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {summaryLoading ? (
                  <>
                    <span className="animate-spin">◌</span>
                    Summarizing...
                  </>
                ) : summary ? (
                  "Regenerate summary"
                ) : (
                  "Generate AI summary"
                )}
              </button>

              {summaryError && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-sm leading-6 text-rose-300"
                >
                  {summaryError}
                </p>
              )}

              {summaryLoading && (
                <p className="mt-4 text-sm text-slate-400">
                  Analyzing the issue description...
                </p>
              )}

              {summary && !summaryLoading && (
                <div className="mt-5 border-t border-slate-800 pt-4">
                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                    {summary}
                  </p>
                </div>
              )}
            </Section>

            <Section
              title="Similar Issues"
              description="Related issues identified using semantic and text similarity."
            >
              {issue.similar_issues?.length ? (
                <div className="space-y-3">
                  {issue.similar_issues.map((similar, index) => {
                    const similarity = Math.min(
                      100,
                      Math.max(0, Number(similar.hybrid_score) * 100 || 0)
                    );

                    return (
                      <a
                        key={similar.id ?? similar.number ?? index}
                        href={similar.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block rounded-xl border border-slate-800 bg-[#101827] p-4 transition hover:border-indigo-500/40 hover:bg-[#131d30]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <p className="min-w-0 break-words text-sm font-medium leading-6 text-slate-200 transition group-hover:text-indigo-300">
                            <span className="mr-2 font-mono text-slate-500">
                              #{similar.number}
                            </span>
                            {similar.title}
                          </p>

                          <span className="shrink-0 text-xs font-semibold text-indigo-300">
                            {similar.hybrid_score != null
                              ? `${similarity.toFixed(1)}%`
                              : "—"}
                          </span>
                        </div>

                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${similarity}%` }}
                          />
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                          Similarity score
                          <span className="float-right transition group-hover:text-indigo-300">
                            Open issue ↗
                          </span>
                        </p>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No similar issues available.
                </p>
              )}
            </Section>
          </div>

          <aside className="min-w-0 space-y-6">
            <Section title="Issue Classification">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                Predicted category
              </p>

              <span
                className={`inline-flex rounded-lg border px-3 py-2 text-sm font-medium ${categoryColors[predictedLabel] ||
                  "border-slate-700 bg-slate-800 text-slate-300"
                  }`}
              >
                {predictedLabel}
              </span>

              <div className="mt-5 border-t border-slate-800 pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Suggested priority
                </p>

                <span
                  className={`inline-flex rounded-lg border px-3 py-2 text-sm font-medium ${priorityColors[String(priority).toLowerCase()] ||
                    "border-slate-700 bg-slate-800 text-slate-300"
                    }`}
                >
                  {priority}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-400">
                {issue.priority_reason ||
                  "No priority explanation available."}
              </p>
            </Section>

            <Section
              title="Original GitHub Labels"
              description="Labels currently attached to this issue."
            >
              {originalLabels.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {originalLabels.map((label, index) => (
                    <span
                      key={typeof label === "string" ? label : index}
                      className="max-w-full break-words rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1.5 text-xs text-slate-300"
                    >
                      {typeof label === "string" ? label : label.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  This issue has no original labels.
                </p>
              )}
            </Section>

            <Section
              title="Category Scores"
              description="Model confidence across the available categories."
            >
              {scores.length > 0 ? (
                <div className="space-y-5">
                  {scores.map(({ category, percentage }) => (
                    <div key={category}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-300">
                          {category}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-slate-400">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${category === predictedLabel
                              ? "bg-indigo-400"
                              : "bg-slate-600"
                            }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Category scores are unavailable for this issue.
                </p>
              )}
            </Section>
          </aside>
        </div>
      </div>
    </div>
  );
}
