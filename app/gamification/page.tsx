"use client";

import { useEffect, useMemo, useState } from "react";
import StatsGrid from "./_components/StatsGrid";
import RoadmapJourney from "./_components/RoadmapJourney";
import SectionCard from "./_components/SectionCard";
import Link from "next/link";
import Image from "next/image";
import { Trophy, X } from "lucide-react";
import TopNavBar2 from "@/components/TopNavBar";
import toast from "react-hot-toast";

import { auth } from "@/lib/firebaseConfig";
import { getUserStats } from "@/controller/userStatsController";
import { getUploadCounts } from "@/controller/gamificationController";
import { BADGES, isBadgeUnlocked } from "@/lib/badges";
import type { BadgeKey } from "@/lib/badges";
import genBadge from "@/badges/gen_badge.png";

export default function GamificationPage() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalUploads: 0,
    uploadsThisMonth: 0,
    uploadsThisWeek: 0,
    currentStreak: 0,
    longestStreak: 0,
  });

  const [badgeFlags, setBadgeFlags] = useState<Partial<Record<BadgeKey, boolean>>>({});
  const [selectedBadgeKey, setSelectedBadgeKey] = useState<BadgeKey | null>(null);

  useEffect(() => {
    const run = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setLoading(false);
        return;
      }

      try {
        const [counts, userStats] = await Promise.all([
          getUploadCounts(uid),
          getUserStats(uid),
        ]);

        setStats({
          totalUploads: counts.totalUploads,
          uploadsThisMonth: counts.uploadsThisMonth,
          uploadsThisWeek: counts.uploadsThisWeek,
          currentStreak: userStats.currentStreak,
          longestStreak: userStats.longestStreak,
        });

        setBadgeFlags(userStats.badges ?? {});
      } catch (err) {
        console.error("Failed to load gamification stats:", err);
        toast.error("Failed to load gamification stats. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const badges = useMemo(
    () =>
      BADGES.map((badge) => ({
        key: badge.key,
        label: badge.label,
        image: badge.image,
        earned: isBadgeUnlocked({ currentStreak: stats.currentStreak, badgeFlags }, badge),
        hint: badge.hint,
        story: badge.story,
        days: badge.days,
      })),
    [stats.currentStreak, badgeFlags]
  );

  const checkpoints = badges.map((badge) => {
    const label =
      badge.days === 2
        ? "2 days"
        : badge.days === 7
          ? "1 week"
          : badge.days === 30
            ? "1 month"
            : badge.days === 365
              ? "1 year"
              : `${badge.days} days`;

    return {
      key: badge.key,
      days: badge.days,
      label,
      image: badge.image,
    };
  });

  const selectedBadge = badges.find((badge) => badge.key === selectedBadgeKey) ?? null;

  return (
    <>
      <TopNavBar2 />

      <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-lime-50/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-6">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-sm">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-100/60 blur-2xl" />
            <div className="absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-lime-100/70 blur-2xl" />

            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700/80">Growth Tracker</p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gamification</h1>
                <p className="text-sm text-slate-600">
                  Track your uploads, streak progress, and unlock milestones.
                </p>
              </div>

              <Link
                href="/gamification/leaderboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 shadow-sm hover:bg-emerald-100"
              >
                <Trophy className="h-4 w-4" />
                Leaderboard
              </Link>
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 text-sm text-slate-600 shadow-sm">
                Loading your stats...
              </div>
            ) : (
              <StatsGrid stats={stats} />
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard title="Streak Journey" subtitle="Hit checkpoints to unlock rewards.">
              <RoadmapJourney
                checkpoints={checkpoints}
                currentStreak={stats.currentStreak}
                selectedKey={selectedBadgeKey}
                onSelect={(key) => setSelectedBadgeKey(key)}
              />
            </SectionCard>

            <div className="rounded-2xl border border-emerald-100 bg-white/90 p-5 shadow-sm">
              {selectedBadge ? (
                <div className="relative rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setSelectedBadgeKey(null)}
                    className="absolute right-3 top-3 rounded-full border border-emerald-100 bg-white p-1 text-rose-400 transition hover:text-rose-500"
                    aria-label="Close badge details"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                      <Image
                        src={selectedBadge.image}
                        alt={selectedBadge.label}
                        width={84}
                        height={84}
                        className={selectedBadge.earned ? "" : "grayscale opacity-60"}
                      />
                    </div>

                    <div>
                      <p className="text-lg font-bold text-slate-900">{selectedBadge.label}</p>
                      <p className="text-sm text-slate-600">{selectedBadge.hint}</p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {selectedBadge.earned ? "Unlocked" : "Locked"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-slate-600">{selectedBadge.story}</p>
                </div>
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-center">
                  <Image src={genBadge} alt="Badges" width={180} height={180} />
                  <div>
                    <p className="text-lg font-semibold text-slate-900">Badges</p>
                    <p className="text-sm text-slate-600">Earn badges as you keep uploading.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
