export default function RepositoryForm({
  repoUrl,
  setRepoUrl,
  onAnalyze,
  loading = false,
}) {
  return (
    <section className="mb-6 rounded-2xl border border-slate-800 bg-[#101827] p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">
            Analyze a repository
          </h2>
          <p className="mt-1.5 text-sm text-slate-400">
            Enter a public GitHub repository URL to get started.
          </p>
        </div>

        <span className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-400">
          Up to 500 issues
        </span>
      </div>

      <form onSubmit={onAnalyze}>
        <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-[#0b1220] p-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3 px-2">
            <span className="text-sm font-bold text-slate-400">
              GH
            </span>

            <input
              type="url"
              required
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              placeholder="https://github.com/owner/repository"
              aria-label="GitHub repository URL"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={!repoUrl.trim() || loading}
            className="rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Analyzing..." : "Analyze Repository"}
            {!loading && <span className="ml-2">→</span>}
          </button>
        </div>
      </form>

      <p className="mt-3 text-xs text-slate-500">
        Analysis results are temporary and won't be saved as history.
      </p>
    </section>
  );
}