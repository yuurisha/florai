// src/controller/userStatsController.ts
import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import type { BadgeKey } from "@/lib/badges";

export type UserStats = {
  currentStreak: number;
  longestStreak: number;
  lastActionDate: string | null;
  badges: Partial<Record<BadgeKey, boolean>>;
};

function isoToday() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
function isoYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function getUserStats(uid: string): Promise<UserStats> {
  const ref = doc(db, "userStats", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActionDate: null,
      badges: {},
    };
  }

  const data = snap.data() as any;
  const storedCurrent = data.currentStreak ?? 0;
  const lastActionDate = data.lastActionDate ?? null;
  const today = isoToday();
  const yesterday = isoYesterday();

  const currentStreak =
    lastActionDate === today || lastActionDate === yesterday ? storedCurrent : 0;

  return {
    currentStreak,
    longestStreak: data.longestStreak ?? 0,
    lastActionDate,
    badges: data.badges ?? {},
  };
}

// (keep this if you already added it earlier)
export async function updateDailyStreak(uid: string) {
  const ref = doc(db, "userStats", uid);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    const today = isoToday();
    const yesterday = isoYesterday();

    let currentStreak = 0;
    let longestStreak = 0;
    let lastActionDate: string | null = null;
    let badges: Partial<Record<BadgeKey, boolean>> = {};

    if (snap.exists()) {
      const data = snap.data();
      currentStreak = (data as any).currentStreak ?? 0;
      longestStreak = (data as any).longestStreak ?? 0;
      lastActionDate = (data as any).lastActionDate ?? null;
      badges = (data as any).badges ?? {};
    }

    if (lastActionDate === today) return;

    if (lastActionDate === yesterday) currentStreak += 1;
    else currentStreak = 1;

    longestStreak = Math.max(longestStreak, currentStreak);

    if (currentStreak >= 3) badges.streak3 = true;
    if (currentStreak >= 7) badges.streak7 = true;
    if (currentStreak >= 30) badges.streak30 = true;
    if (currentStreak >= 365) badges.streak365 = true;

    tx.set(
      ref,
      {
        currentStreak,
        longestStreak,
        lastActionDate: today,
        badges,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}
