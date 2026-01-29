import { Flame, Upload, CalendarDays, BarChart3 } from "lucide-react";

export default function StatsGrid({
  stats,
}: {
  stats: {
    totalUploads: number;
    uploadsThisMonth: number;
    uploadsThisWeek: number;
    currentStreak: number;
    longestStreak: number;
  };
}) {
  const cards = [
    { label: "Total Uploads", value: stats.totalUploads, icon: Upload, tone: "emerald" },
    { label: "Uploads This Month", value: stats.uploadsThisMonth, icon: CalendarDays, tone: "lime" },
    { label: "Uploads This Week", value: stats.uploadsThisWeek, icon: BarChart3, tone: "teal" },
    { label: "Current Streak", value: `${stats.currentStreak} days`, icon: Flame, tone: "amber" },
    { label: "Longest Streak", value: `${stats.longestStreak} days`, icon: Flame, tone: "orange" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((c) => {
        const tone = {
          emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
          lime: "border-lime-100 bg-lime-50 text-lime-700",
          teal: "border-teal-100 bg-teal-50 text-teal-700",
          amber: "border-amber-100 bg-amber-50 text-amber-700",
          orange: "border-orange-100 bg-orange-50 text-orange-700",
        }[c.tone];

        return (
          <div
            key={c.label}
            className="rounded-2xl border border-emerald-100/80 bg-white/90 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-600">{c.label}</p>
              <span className={`rounded-lg border p-1.5 ${tone}`}>
                <c.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-lg font-bold text-slate-900">{c.value}</p>
          </div>
        );
      })}
    </div>
  );
}
