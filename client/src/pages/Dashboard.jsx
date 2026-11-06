
import { useState, useLayoutEffect, useEffect } from "react";

import useRepositoryAnalysis from "../hooks/useRepositoryAnalysis.js";
import Sidebar from "../components/Sidebar.jsx";
import Header from "../components/Header.jsx";
import RepositoryForm from "../components/RepositoryForm.jsx";
import MetricCard from "../components/MetricCard.jsx";
import IssueExplorer from "../components/IssueExplorer.jsx";
import AnalyticsSection from "../components/AnalyticsSection.jsx";
import IssueDetailsPanel from "../components/IssueDetailsPanel.jsx";

function getMetricValues(analysis) {
  const issues = analysis?.issues ?? [];

  const labeledIssues = issues.filter((issue) => {
    const labels = issue.original_labels ?? issue.labels ?? [];
    return labels.length > 0;
  }).length;

  const openIssues = issues.filter(
    (issue) => String(issue.state ?? "").toLowerCase() === "open"
  ).length;

  return [
    {
      label: "Issues Analyzed",
      value: analysis ? issues.length : "—",
      icon: "▤",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "High Priority",
      value: analysis
        ? issues.filter((issue) =>
            ["high", "critical"].includes(
              String(issue.suggested_priority ?? "").toLowerCase()
            )
          ).length
        : "—",
      icon: "⚑",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
    {
      label: "Labeled Issues",
      value: analysis ? labeledIssues : "—",
      icon: "✓",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Open Issues",
      value: analysis ? openIssues : "—",
      icon: "◷",
      color: "text-sky-400",
      bg: "bg-sky-500/10",
    },
  ];
}

export default function Dashboard() {
  const {
    repoUrl,
    setRepoUrl,
    loading,
    error,
    analysis,
    handleAnalyze,
  } = useRepositoryAnalysis();

  const metrics = getMetricValues(analysis);
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state?.issueDetails && event.state.issue) {
        setSelectedIssue(event.state.issue);
      } else {
        setSelectedIssue(null);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const openIssue = (issue) => {
    window.history.pushState(
      { issueDetails: true, issue },
      ""
    );

    setSelectedIssue(issue);
  };

  const closeIssue = () => {
    if (window.history.state?.issueDetails) {
      window.history.back();
    } else {
      setSelectedIssue(null);
    }
  };

  useLayoutEffect(() => {
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [selectedIssue]);

  if (selectedIssue) {
    return (
      <div className="min-h-screen w-full bg-[#0b1120] text-slate-200">
        <div className="min-h-screen w-full px-5 py-6 sm:px-8 md:px-10 md:py-10">
          <IssueDetailsPanel
            key={selectedIssue.id ?? selectedIssue.number}
            issue={selectedIssue}
            onClose={closeIssue}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0b1120] text-slate-200">
      <Sidebar />

      <main className="min-h-screen min-w-0 w-full px-5 py-7 md:ml-60 md:w-[calc(100%-15rem)] md:px-10 md:py-9">
        <div className="mx-auto w-full max-w-[1600px]">
          <div id="overview" className="scroll-mt-6">
            <Header />

            <RepositoryForm
              repoUrl={repoUrl}
              setRepoUrl={setRepoUrl}
              onAnalyze={handleAnalyze}
              loading={loading}
            />

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
              >
                {error}
              </div>
            )}

            <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} metric={metric} />
              ))}
            </section>
          </div>

          <div id="issues" className="scroll-mt-6">
            <IssueExplorer
              issues={analysis?.issues ?? []}
              loading={loading}
              onIssueSelect={openIssue}
            />
          </div>

          <div id="analytics" className="scroll-mt-6">
            <AnalyticsSection issues={analysis?.issues ?? []} />
          </div>

          <footer className="flex flex-col gap-2 border-t border-slate-800 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>IssueWise</span>
            <span>GitHub Issue Intelligence · Built for developers</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
