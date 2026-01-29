export default function LeaderboardTable({
  rows,
  offsetRank,
}: {
  rows: { uid: string; name: string; uploads: number }[];
  offsetRank: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white">
      <div className="divide-y divide-emerald-100/60">
        {rows.map((r, idx) => (
          <div
            key={r.uid}
            className={`flex items-center justify-between px-4 py-3 ${
              idx % 2 === 0 ? "bg-emerald-50/40" : "bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <p className="w-8 text-sm font-bold text-slate-700">#{offsetRank + idx}</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-xs font-bold text-emerald-800">
                {r.name.slice(0, 1)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                <p className="text-xs text-slate-500">{r.uid}</p>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-900">{r.uploads}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
