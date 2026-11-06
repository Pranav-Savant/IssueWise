export default function MetricCard({ metric }) {
  return (
    <article className="rounded-xl border border-slate-800 bg-[#101827] p-5 transition hover:border-slate-700">
      <div
        className={`mb-5 grid size-10 place-items-center rounded-xl text-xl ${metric.bg} ${metric.color}`}
      >
        {metric.icon}
      </div>

      <p className="text-3xl font-bold tracking-tight text-white">
        {metric.value}
      </p>

      <p className="mt-2 text-sm text-slate-300">
        {metric.label}
      </p>

      <p className="mt-3 text-xs text-slate-500">
        {metric.description || "Updates after analysis"}
      </p>
    </article>
  );
}