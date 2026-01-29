export default function LeaderboardToggle({
  mode,
  setMode,
}: {
  mode: "weekly" | "monthly";
  setMode: (m: "weekly" | "monthly") => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-amber-100 bg-white/90 p-1 shadow-sm">
      <button
        onClick={() => setMode("weekly")}
        className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
          mode === "weekly"
            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
            : "text-slate-700 hover:bg-amber-50"
        }`}
      >
        Weekly
      </button>
      <button
        onClick={() => setMode("monthly")}
        className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
          mode === "monthly"
            ? "bg-gradient-to-r from-emerald-500 to-lime-500 text-white shadow-sm"
            : "text-slate-700 hover:bg-emerald-50"
        }`}
      >
        Monthly
      </button>
    </div>
  );
}
