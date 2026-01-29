import Image, { type StaticImageData } from "next/image";

export default function BadgesGrid({
  badges,
}: {
  badges: { key: string; label: string; earned: boolean; hint?: string; image: StaticImageData }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {badges.map((b) => (
        <div
          key={b.key}
          className={`rounded-2xl border p-3 shadow-sm ${
            b.earned ? "border-emerald-200 bg-white" : "border-slate-100 bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`rounded-xl border p-1 ${
                b.earned ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
              }`}
            >
              <Image
                src={b.image}
                alt={b.label}
                width={28}
                height={28}
                className={b.earned ? "" : "grayscale opacity-60"}
              />
            </div>
            <p className="text-sm font-semibold text-slate-900">{b.label}</p>
          </div>
          {b.hint ? <p className="mt-2 text-xs text-slate-600">{b.hint}</p> : null}
          <p className="mt-2 text-xs font-semibold text-slate-500">
            {b.earned ? "Earned" : "Locked"}
          </p>
        </div>
      ))}
    </div>
  );
}
