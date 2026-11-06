
function DistributionCard({ title, description, counts, colors, total }) {
  const entries = Object.entries(counts).filter(
    ([, count]) => count > 0
  );

  return (
    <article className="rounded-xl border border-slate-800 bg-[#101827] p-5">
      <h3 className="text-sm font-medium text-slate-200">
        {title}
      </h3>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>

      {entries.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          No data available.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {entries.map(([label, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;

            return (
              <div key={label}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-300">
                    {label}
                  </span>
                  <span className="text-xs text-slate-400">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full ${colors[label]}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

export default function AnalyticsSection({ issues = [] }) {
  const categoryCounts = {};
  const priorityCounts = {
    Low: 0,
    Medium: 0,
    High: 0,
    Critical: 0,
    Unknown: 0,
  };
  const statusCounts = {
    Open: 0,
    Closed: 0,
    Unknown: 0,
  };

  issues.forEach((issue) => {
    const category = issue.predicted_label || "Unknown";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;

    const rawPriority = String(
      issue.suggested_priority || ""
    ).toLowerCase();

    const priority = ["low", "medium", "high", "critical"].includes(
      rawPriority
    )
      ? rawPriority.charAt(0).toUpperCase() + rawPriority.slice(1)
      : "Unknown";

    priorityCounts[priority]++;

    const rawStatus = String(issue.state || "").toLowerCase();

    if (rawStatus === "open") {
      statusCounts.Open++;
    } else if (rawStatus === "closed") {
      statusCounts.Closed++;
    } else {
      statusCounts.Unknown++;
    }
  });

  const categoryColors = [
    "bg-indigo-500",
    "bg-cyan-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-rose-500",
  ];

  const categories = Object.entries(categoryCounts).sort(
    (a, b) => b[1] - a[1]
  );

  const priorityColors = {
    Low: "bg-emerald-500",
    Medium: "bg-amber-500",
    High: "bg-orange-500",
    Critical: "bg-rose-500",
    Unknown: "bg-slate-500",
  };

  const statusColors = {
    Open: "bg-emerald-500",
    Closed: "bg-violet-500",
    Unknown: "bg-slate-500",
  };
  return (
    <section id="analytics" className="mb-8">
      <div className="mb-5">
        <h2 className="font-semibold text-white">
          Repository Analytics
        </h2>

        <p className="mt-1.5 text-sm text-slate-400">
          Discover trends across your repository issues.
        </p>
      </div>

      {issues.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#101827] p-8 text-center">
          <p className="text-sm text-slate-400">
            Analyze a repository to see its analytics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-800 bg-[#101827] p-5 lg:col-span-2">
            <h3 className="text-sm font-medium text-slate-200">
              Predicted Categories
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Distribution of AI-predicted categories across repository issues
            </p>

            {categories.length === 0 ? (
              <p className="mt-8 text-sm text-slate-500">
                No predicted categories available.
              </p>
            ) : (
              <div className="mt-6 space-y-5">
                {categories.map(([category, count], index) => {
                  const percentage = (count / issues.length) * 100;

                  return (
                    <div key={category}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-300">
                          {category}
                        </span>

                        <span className="text-xs text-slate-400">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full ${categoryColors[index % categoryColors.length]
                            }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="mt-5 text-xs text-slate-500">
              Total analyzed issues: {issues.length}
            </p>
          </article>

          <DistributionCard
            title="Priority Distribution"
            description="Breakdown of recommended issue priorities"
            counts={priorityCounts}
            colors={priorityColors}
            total={issues.length}
          />

          <DistributionCard
            title="Issue Status"
            description="Breakdown of open and closed repository issues"
            counts={statusCounts}
            colors={statusColors}
            total={issues.length}
          />
        </div>
      )}
    </section>
  );
}
