
import { useState, useEffect, useRef } from "react";
import IssueDetailsPanel from "./IssueDetailsPanel.jsx";
import IssueMarkdown from "./IssueMarkdown.jsx";

const ITEMS_PER_PAGE = 10;

const PRIORITY_ORDER = {
  High: 3,
  Medium: 2,
  Low: 1,
};

export default function IssueExplorer({ issues = [], loading = false , onIssueSelect}) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIssue, setSelectedIssue] = useState(null);

  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const filterRef = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!filterRef.current?.contains(event.target)) {
        setFilterOpen(false);
      }

      if (!sortRef.current?.contains(event.target)) {
        setSortOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setFilterOpen(false);
        setSortOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const categories = [
    ...new Set(issues.map((issue) => issue.predicted_label || "Unknown")),
  ].sort();

  const filteredIssues = issues
    .filter((issue) => {
      const query = search.toLowerCase().trim();

      const matchesSearch =
        issue.title?.toLowerCase().includes(query) ||
        String(issue.number).includes(query);

      const matchesPriority =
        priorityFilter === "All" ||
        (issue.suggested_priority || "Unclassified").toLowerCase() ===
        priorityFilter.toLowerCase();

      const matchesCategory =
        categoryFilter === "All" ||
        (issue.predicted_label || "Unknown") === categoryFilter;

      const issueState = (issue.state || "").toLowerCase();

      const matchesState =
        stateFilter === "All" || issueState === stateFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesPriority &&
        matchesCategory &&
        matchesState
      );
    })
    .sort((a, b) => {
      if (sortBy === "priority") {
        const priorityDifference =
          (PRIORITY_ORDER[b.suggested_priority] || 0) -
          (PRIORITY_ORDER[a.suggested_priority] || 0);

        return priorityDifference || Number(b.number) - Number(a.number);
      }

      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      if (sortBy === "oldest") {
        return dateA - dateB;
      }

      return dateB - dateA;
    });

  const totalPages = Math.ceil(filteredIssues.length / ITEMS_PER_PAGE);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;

  const paginatedIssues = filteredIssues.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  function resetPage() {
    setCurrentPage(1);
  }

  function handleSearchChange(event) {
    setSearch(event.target.value);
    resetPage();
  }

  function goToPage(page) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  }

  function handleFilterChange(setter, value) {
    setter(value);
    resetPage();
  }

  function resetFilters() {
    setPriorityFilter("All");
    setCategoryFilter("All");
    setStateFilter("All");
    resetPage();
  }

  function resetSort() {
    setSortBy("newest");
    resetPage();
  }

  function toggleFilterPopup() {
    setFilterOpen((previous) => !previous);
    setSortOpen(false);
  }

  function toggleSortPopup() {
    setSortOpen((previous) => !previous);
    setFilterOpen(false);
  }

  const hasActiveFilters =
    priorityFilter !== "All" ||
    categoryFilter !== "All" ||
    stateFilter !== "All";

  const hasActiveSort = sortBy !== "newest";

  if (selectedIssue) {
    return (
      <IssueDetailsPanel
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
      />
    );
  }

  return (
    <section
      id="issues"
      className="mb-7 rounded-2xl border border-slate-800 bg-[#101827] p-5 md:p-6"
    >

      <div className="mb-5 text-center">
        <h2 className="font-semibold text-white">
          Issue Explorer
        </h2>
        <p className="mt-1.5 text-sm text-slate-400">
          Search, filter, and sort repository issues.
        </p>
      </div>


      <input
        type="search"
        value={search}
        onChange={handleSearchChange}
        placeholder="Search by issue title or number..."
        aria-label="Search issues"
        className="mb-4 w-full rounded-lg border border-slate-700 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
      />

      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={toggleFilterPopup}
              aria-expanded={filterOpen}
              aria-label="Filter issues"
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${filterOpen || hasActiveFilters
                ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                : "border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 7h16M7 12h10m-7 5h4" />
              </svg>
              <span>Filter</span>
              {hasActiveFilters && (
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              )}
            </button>

            {filterOpen && (
              <div className="absolute left-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-xl border border-slate-700 bg-[#111b2c] p-4 shadow-2xl">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-medium text-white">Filters</h3>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="whitespace-nowrap text-xs text-indigo-300 hover:text-indigo-200"
                  >
                    Reset to default
                  </button>
                </div>

                <label
                  htmlFor="priority-filter"
                  className="mb-1.5 block text-xs text-slate-400"
                >
                  Priority
                </label>
                <select
                  id="priority-filter"
                  value={priorityFilter}
                  onChange={(event) =>
                    handleFilterChange(setPriorityFilter, event.target.value)
                  }
                  className="mb-4 w-full rounded-lg border border-slate-700 bg-[#0b1220] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="All">All priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  <option value="Unclassified">Unclassified</option>
                </select>

                <label
                  htmlFor="category-filter"
                  className="mb-1.5 block text-xs text-slate-400"
                >
                  Predicted category
                </label>
                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={(event) =>
                    handleFilterChange(setCategoryFilter, event.target.value)
                  }
                  className="mb-4 w-full rounded-lg border border-slate-700 bg-[#0b1220] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="All">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <label
                  htmlFor="state-filter"
                  className="mb-1.5 block text-xs text-slate-400"
                >
                  Issue state
                </label>
                <select
                  id="state-filter"
                  value={stateFilter}
                  onChange={(event) =>
                    handleFilterChange(setStateFilter, event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-[#0b1220] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="All">All states</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            )}
          </div>

          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={toggleSortPopup}
              aria-expanded={sortOpen}
              aria-label="Sort issues"
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${sortOpen || hasActiveSort
                ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                : "border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M8 6h13M8 12h9M8 18h5" />
                <path d="M3 6v12m0 0 3-3m-3 3-3-3" />
              </svg>
              <span>Sort</span>
              {hasActiveSort && (
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              )}
            </button>

            {sortOpen && (
              <div className="absolute left-0 top-full z-30 mt-2 w-64 max-w-[calc(100vw-3rem)] rounded-xl border border-slate-700 bg-[#111b2c] p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-medium text-white">Sort issues</h3>
                  <button
                    type="button"
                    onClick={resetSort}
                    className="whitespace-nowrap text-xs text-indigo-300 hover:text-indigo-200"
                  >
                    Reset to default
                  </button>
                </div>

                {[
                  { value: "newest", label: "Newest first" },
                  { value: "oldest", label: "Oldest first" },
                  { value: "priority", label: "Highest priority" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      handleFilterChange(setSortBy, option.value);
                      setSortOpen(false);
                    }}
                    className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${sortBy === option.value
                      ? "bg-indigo-500/10 text-indigo-300"
                      : "text-slate-300 hover:bg-slate-800"
                      }`}
                  >
                    {option.label}
                    {sortBy === option.value && (
                      <span aria-hidden="true">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <span className="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400">
          {filteredIssues.length} issues
        </span>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-400">
          Analyzing repository...
        </p>
      ) : filteredIssues.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-400">
          {issues.length
            ? "No issues match your search and filters."
            : "Analyze a repository to display its issues."}
        </p>
      ) : (
        <>

          <div className="space-y-3">
            {paginatedIssues.map((issue) => {
              const originalLabels =
                issue.original_labels ?? issue.labels ?? [];

              const issueState = (issue.state || "").toLowerCase();
              const isOpen = issueState === "open";
              return (
                <article
                  key={issue.number}
                  className="cursor-pointer rounded-xl border border-slate-800 bg-[#0b1220] p-4 transition hover:border-slate-700 hover:bg-[#0d1525]"
                  onClick={() => onIssueSelect(issue)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;

                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedIssue(issue);
                    }
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="text-xs text-slate-500">
                          Issue #{issue.number}
                        </p>

                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${isOpen
                            ? "bg-emerald-500/10 text-emerald-300"
                            : issueState === "closed"
                              ? "bg-violet-500/10 text-violet-300"
                              : "bg-slate-800 text-slate-400"
                            }`}
                        >
                          {issueState
                            ? issueState.charAt(0).toUpperCase() +
                            issueState.slice(1)
                            : "State unavailable"}
                        </span>
                      </div>

                      <a
                        href={issue.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="block text-left text-base font-semibold leading-6 text-white transition-colors hover:text-indigo-300"
                      >
                        {issue.title}
                      </a>
                    </div>

                    <span
                      className={`h-fit w-fit shrink-0 rounded-full px-3 py-1 text-xs font-medium ${issue.suggested_priority === "High"
                        ? "bg-rose-500/10 text-rose-300"
                        : issue.suggested_priority === "Medium"
                          ? "bg-amber-500/10 text-amber-300"
                          : issue.suggested_priority === "Low"
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-slate-800 text-slate-400"
                        }`}
                    >
                      {issue.suggested_priority || "Unclassified"} Priority
                    </span>
                  </div>

                  {issue.body && (
                    <div className="mt-2 line-clamp-2 overflow-hidden text-sm leading-6 text-slate-400">
                      <IssueMarkdown content={issue.body} />
                    </div>
                  )}


                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-left">
                        GitHub Labels
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        {originalLabels.length > 0 ? (
                          originalLabels.map((label) => (
                            <span
                              key={label}
                              className="rounded-md border border-slate-700 bg-slate-800/40 px-2 py-1 text-xs text-slate-300"
                            >
                              {label}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs italic text-slate-500">
                            No GitHub labels
                          </span>
                        )}
                      </div>
                    </div>

                    <div className='text-left'>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        IssueWise Prediction
                      </p>

                      {(() => {
                        const category = issue.predicted_label || "Unknown";

                        const categoryStyles = {
                          Bug: "bg-rose-500/10 text-rose-300 border-rose-500/20",
                          Question: "bg-amber-500/10 text-amber-300 border-amber-500/20",
                          Documentation: "bg-blue-500/10 text-blue-300 border-blue-500/20",
                          Enhancement: "bg-purple-500/10 text-purple-300 border-purple-500/20",
                          Performance: "bg-teal-500/10 text-teal-300 border-teal-500/20",
                          Unknown: "bg-slate-500/10 text-slate-300 border-slate-500/20",
                        };

                        return (
                          <span
                            className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-medium ${categoryStyles[category] || categoryStyles.Unknown
                              }`}
                          >
                            {category}
                          </span>
                        );
                      })()}
                    </div>
                  </div>


                  {issue.similar_issues?.length > 0 && (
                    <div className="mt-3 border-t border-slate-800/70 pt-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-xs font-medium text-slate-400">
                          Similar issues
                        </span>

                        <span className="text-xs text-indigo-400">
                          View details →
                        </span>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>


          <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-5 sm:flex-row">
            <p className="text-sm text-slate-400">
              Showing{" "}
              <span className="font-medium text-slate-200">
                {startIndex + 1}–
                {Math.min(
                  startIndex + ITEMS_PER_PAGE,
                  filteredIssues.length
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-200">
                {filteredIssues.length}
              </span>{" "}
              issues
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage === 1}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              )
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - safePage) <= 1
                )
                .reduce((pages, page, index, visiblePages) => {
                  if (
                    index > 0 &&
                    page - visiblePages[index - 1] > 1
                  ) {
                    pages.push("ellipsis");
                  }

                  pages.push(page);
                  return pages;
                }, [])
                .map((page, index) =>
                  page === "ellipsis" ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-1 text-slate-500"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      aria-current={safePage === page ? "page" : undefined}
                      className={`min-w-9 rounded-lg border px-3 py-2 text-sm transition ${safePage === page
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                        : "border-slate-700 text-slate-300 hover:bg-slate-800"
                        }`}
                    >
                      {page}
                    </button>
                  )
                )}

              <button
                type="button"
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage === totalPages}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
