import Image, { type StaticImageData } from "next/image";
import { CheckCircle2, Lock, MapPin } from "lucide-react";
import type { BadgeKey } from "@/lib/badges";

export default function RoadmapJourney({
  checkpoints,
  currentStreak,
  selectedKey,
  onSelect,
}: {
  checkpoints: { key: BadgeKey; days: number; label: string; image: StaticImageData }[];
  currentStreak: number;
  selectedKey?: BadgeKey | null;
  onSelect?: (key: BadgeKey) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-emerald-900">Current streak</p>
        <p className="text-sm font-bold text-emerald-900">{currentStreak} days</p>
      </div>

      <div className="space-y-3">
        {checkpoints.map((cp, idx) => {
          const done = currentStreak >= cp.days;
          const next = !done && (idx === 0 ? true : currentStreak >= checkpoints[idx - 1].days);
          const isSelected = selectedKey === cp.key;
          const status = done ? "Completed" : next ? "In progress" : "Locked";

          return (
            <button
              key={cp.key}
              type="button"
              onClick={() => onSelect?.(cp.key)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left shadow-sm transition ${
                isSelected
                  ? "border-emerald-200 bg-emerald-100/70"
                  : "border-emerald-100 bg-white hover:border-emerald-200"
              }`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-1">
                  <Image
                    src={cp.image}
                    alt={cp.label}
                    width={36}
                    height={36}
                    className={done || next ? "" : "grayscale opacity-60"}
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">{cp.label}</p>
                  <p className="text-xs text-slate-600">{status}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-right">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-1 text-emerald-700">
                  {done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : next ? (
                    <MapPin className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500">Target</p>
                  <p className="text-sm font-bold text-slate-900">{cp.days}d</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
