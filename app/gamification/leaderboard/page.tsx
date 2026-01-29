"use client";

import { useEffect, useState } from "react";
import SectionCard from "../_components/SectionCard";
import LeaderboardPodium from "../_components/LeaderboardPodium";
import LeaderboardTable from "../_components/LeaderboardTable";
import LeaderboardToggle from "../_components/LeaderboardToggle";
import Link from "next/link";

import { getLeaderboard } from "@/controller/gamificationController";

export default function LeaderboardPage() {
  const [mode, setMode] = useState<"weekly" | "monthly">("weekly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<{ uid: string; name: string; uploads: number }[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getLeaderboard(mode);
        setRows(data);
      } catch (err) {
        setError("Failed to load leaderboard. Please try again.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [mode, retryCount]);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="relative mb-6 overflow-hidden rounded-3xl border border-amber-100 bg-white/90 p-6 shadow-sm">
          <div className="absolute -right-10 -top-8 h-32 w-32 rounded-full bg-amber-200/60 blur-2xl" />
          <div className="absolute -left-6 -bottom-10 h-32 w-32 rounded-full bg-emerald-200/60 blur-2xl" />

          <div className="relative flex items-center justify-between">
            <div>
              <Link
                href="/gamification"
                className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700/80 hover:text-amber-800"
              >
                ← Back 
              </Link>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700/80">
                Crowned Uploaders
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leaderboard</h1>
              <p className="text-sm text-slate-600">See the top uploaders by {mode}.</p>
            </div>

            <LeaderboardToggle mode={mode} setMode={setMode} />
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-amber-100 bg-white/90 p-4 text-sm text-slate-600 shadow-sm">
            Loading leaderboard...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-amber-100 bg-white/90 p-4 text-sm text-slate-700 shadow-sm">
            <p className="font-semibold text-slate-900">Leaderboard unavailable</p>
            <p className="mt-1 text-sm text-slate-600">{error}</p>
            <button
              type="button"
              onClick={() => setRetryCount((prev) => prev + 1)}
              className="mt-3 inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-3xl border border-amber-100 bg-white/90 p-5 shadow-sm">
                <SectionCard title="Top 3" subtitle="Podium ranking ">
                  <LeaderboardPodium top3={top3} />
                </SectionCard>
              </div>
            </div>

            <div>
              <div className="rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow-sm">
                <SectionCard title="Top 10" subtitle="Ranks 4–10">
                  <LeaderboardTable rows={rest} offsetRank={4} />
                </SectionCard>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
