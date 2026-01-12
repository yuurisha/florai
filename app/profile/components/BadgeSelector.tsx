"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import Image from "next/image";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";

import { Button } from "../../../components/button";
import { auth, db } from "../../../lib/firebaseConfig";
import { getUserStats } from "../../../controller/userStatsController";
import { BADGES, badgeLabelForKey, isBadgeUnlocked, parseBadgeKey } from "../../../lib/badges";
import type { BadgeKey } from "../../../lib/badges";

export default function BadgeSelector() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeKey | "none">("none");
  const [currentStreak, setCurrentStreak] = useState(0);
  const [badgeFlags, setBadgeFlags] = useState<Partial<Record<BadgeKey, boolean>>>({});

  useEffect(() => {
    const load = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setLoading(false);
        return;
      }

      try {
        const [stats, userSnap] = await Promise.all([
          getUserStats(uid),
          getDoc(doc(db, "users", uid)),
        ]);

        setCurrentStreak(stats.currentStreak);
        setBadgeFlags(stats.badges ?? {});

        if (userSnap.exists()) {
          const saved = parseBadgeKey(userSnap.data()?.selectedBadge);
          setSelectedBadge(saved ?? "none");
        }
      } catch (err) {
        toast.error("Failed to load badges.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const unlockedKeys = useMemo(() => {
    const context = { currentStreak, badgeFlags };
    return new Set(
      BADGES.filter((badge) => isBadgeUnlocked(context, badge)).map((badge) => badge.key)
    );
  }, [currentStreak, badgeFlags]);

  const selectedLabel = selectedBadge === "none" ? "None" : badgeLabelForKey(selectedBadge);

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      toast.error("You need to be signed in.");
      return;
    }

    if (selectedBadge !== "none" && !unlockedKeys.has(selectedBadge)) {
      toast.error("That badge is still locked.");
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        selectedBadge: selectedBadge === "none" ? null : selectedBadge,
      });
      toast.success("Badge selection updated.");
    } catch (err) {
      toast.error("Failed to save badge.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-600">Loading badges...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-900">
        Choose one unlocked badge to display next to your name in the forum.
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-gray-700">Selected badge</span>
        <span className="text-gray-600">{selectedLabel ?? "None"}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setSelectedBadge("none")}
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
            selectedBadge === "none"
              ? "border-emerald-300 bg-emerald-50"
              : "border-gray-200 bg-white hover:border-emerald-200"
          }`}
        >
          <div>
            <p className="text-sm font-semibold text-gray-900">No badge</p>
            <p className="text-xs text-gray-600">Hide badge from your forum name.</p>
          </div>
          {selectedBadge === "none" && <CheckCircle2 className="h-4 w-4 text-emerald-700" />}
        </button>

        {BADGES.map((badge) => {
          const unlocked = unlockedKeys.has(badge.key);
          const isSelected = selectedBadge === badge.key;

          return (
            <button
              key={badge.key}
              type="button"
              disabled={!unlocked}
              onClick={() => unlocked && setSelectedBadge(badge.key)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                isSelected
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-gray-200 bg-white hover:border-emerald-200"
              } ${!unlocked ? "cursor-not-allowed opacity-70" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`relative rounded-lg border p-2 ${
                    unlocked ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <Image
                    src={badge.image}
                    alt={badge.label}
                    width={36}
                    height={36}
                    className={unlocked ? "" : "grayscale opacity-60"}
                  />
                  {!unlocked && (
                    <span className="absolute -bottom-1 -right-1 rounded-full border border-gray-200 bg-white p-0.5 text-gray-500">
                      <Lock className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{badge.label}</p>
                  <p className="text-xs text-gray-600">{badge.hint}</p>
                  <p className="mt-1 text-xs font-semibold text-gray-500">
                    {unlocked ? "Unlocked" : "Locked"}
                  </p>
                </div>
              </div>
              {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-700" />}
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {saving ? "Saving..." : "Save Badge"}
        </Button>
      </div>
    </div>
  );
}
