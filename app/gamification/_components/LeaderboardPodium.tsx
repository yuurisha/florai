import { Crown } from "lucide-react";

export default function LeaderboardPodium({
  top3,
}: {
  top3: { uid: string; name: string; uploads: number }[];
}) {
  const [first, second, third] = top3;


  const items = [
    { rank: 2, user: second, tall: false },
    { rank: 1, user: first, tall: true },
    { rank: 3, user: third, tall: false },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it) => (
        <div
          key={it.rank}
          className={`relative flex flex-col items-center justify-end overflow-hidden rounded-2xl border p-4 shadow-sm ${
            it.rank === 1
              ? "border-amber-200 bg-gradient-to-b from-amber-50 via-white to-amber-100/60"
              : it.rank === 2
              ? "border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-100"
              : "border-orange-200 bg-gradient-to-b from-orange-50 via-white to-orange-100/70"
          } ${it.tall ? "min-h-[220px]" : "min-h-[190px]"}`}
        >
          {it.rank === 1 ? (
            <div className="absolute -top-6 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full bg-amber-200/70 blur-xl" />
          ) : null}

          <div className="mb-2 flex items-center gap-2">
            {it.rank === 1 ? <Crown className="h-4 w-4 text-amber-700" /> : null}
            <p className="text-sm font-bold text-slate-800">#{it.rank}</p>
          </div>

          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full border text-sm font-bold ${
              it.rank === 1
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : it.rank === 2
                ? "border-slate-200 bg-slate-50 text-slate-700"
                : "border-orange-200 bg-orange-50 text-orange-800"
            }`}
          >
            {it.user?.name?.slice(0, 1) ?? "?"}
          </div>

          <p className="mt-2 text-sm font-semibold text-slate-900">{it.user?.name ?? "—"}</p>
          <p className="text-xs text-slate-600">{it.user ? `${it.user.uploads} uploads` : "—"}</p>

          <div
            className={`mt-4 w-full rounded-xl border ${
              it.rank === 1
                ? "h-16 border-amber-200 bg-amber-100/70"
                : it.rank === 2
                ? "h-12 border-slate-200 bg-slate-100/70"
                : "h-12 border-orange-200 bg-orange-100/70"
            }`}
          />
        </div>
      ))}
    </div>
  );
}
