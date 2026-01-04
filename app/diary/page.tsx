// src/app/diary/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {Trophy, Heart,  Plus,  Flame,  MapPin, Lock, CheckCircle2 } from "lucide-react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import TopNavBar from "@/components/TopNavBar";
import CalendarView from "@/components/CalendarView";
import ActionTile from "@/components/ActionTile";
import Modal from "@/components/diaryModal";
import DiaryEntryForm from "@/components/DiaryEntryForm";
import EntryCard from "@/components/EntryCard";
import type { DiaryEntry } from "@/app/diary/types";

import {
  fetchDiaryEntries,
  saveDiaryEntry,
  deleteDiaryEntry,
  toggleFavouriteDiaryEntry,
} from "@/controller/diaryController";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isFutureISODate(iso: string) {
  // iso is "YYYY-MM-DD"
  const today = todayISO();
  return iso > today; // safe because ISO format sorts lexicographically
}



type ModalKey = "create" | "favourites" | "gamification" | null;

export default function DiaryPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const isFuture = isFutureISODate(selectedDate);
  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
// --- UI-only mock data (replace with Firestore later) ---
const streak = {
  currentStreak: 4,
  longestStreak: 12,
  lastActionDate: todayISO(), // assume user uploaded today (for UI demo)
};

const milestones = [7, 30, 100];

const hasUploadedToday = streak.lastActionDate === todayISO();

const nextMilestone =
  milestones.find((m) => streak.currentStreak < m) ?? milestones[milestones.length - 1];

const progressNumerator = Math.min(streak.currentStreak, nextMilestone);
const progressPct = Math.round((progressNumerator / nextMilestone) * 100);

  // For favourites modal preview
  const [selectedFavId, setSelectedFavId] = useState<string | null>(null);

  const currentEntry = useMemo(
    () => entries.find((e) => e.date === selectedDate) || null,
    [entries, selectedDate]
  );

  const favouriteEntries = useMemo(
    () => entries.filter((e) => e.isFavourite),
    [entries]
  );

  const sortedFavourites = useMemo(
    () => favouriteEntries.slice().sort((a, b) => (a.date < b.date ? 1 : -1)),
    [favouriteEntries]
  );

  const selectedFavourite = useMemo(() => {
    if (!sortedFavourites.length) return null;
    return (
      sortedFavourites.find((e) => e.id === selectedFavId) ?? sortedFavourites[0]
    );
  }, [sortedFavourites, selectedFavId]);

  const refreshEntries = async (uid: string) => {
    const updated = await fetchDiaryEntries(uid);
    setEntries(updated);
  };

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId) return;
    refreshEntries(userId).catch(console.error);
  }, [userId]);

  // When opening favourites modal, ensure we have a selected preview
  useEffect(() => {
    if (activeModal !== "favourites") return;
    setSelectedFavId((prev) => {
      if (prev && sortedFavourites.some((e) => e.id === prev)) return prev;
      return sortedFavourites[0]?.id ?? null;
    });
  }, [activeModal, sortedFavourites]);

  const openCreate = () => {
  if (isFutureISODate(selectedDate)) return; // block future
  setEditingEntry(currentEntry);
  setActiveModal("create");
};


  const openFavourites = () => {
    setActiveModal("favourites");
    // selection is handled by the useEffect above
  };

  const handleSave = async (data: {
    title: string;
    text: string;
    isFavourite: boolean;
    plantName?: string;
    plantCondition?: any;
  }) => {
    if (!userId) return;

    const existing = entries.find((e) => e.date === selectedDate) || undefined;

    await saveDiaryEntry(userId, selectedDate, existing, data);
    await refreshEntries(userId);

    setActiveModal(null);
    setEditingEntry(null);
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;

    await deleteDiaryEntry(id);
    await refreshEntries(userId);

    if (selectedFavId === id) setSelectedFavId(null);
  };

  const handleToggleFav = async (id: string, current: boolean) => {
    await toggleFavouriteDiaryEntry(id, !current);

    if (!userId) return;
    await refreshEntries(userId);

    // If we unfavourited the currently previewed one, selection will auto-fix via useEffect
    if (current === true && selectedFavId === id) {
      setSelectedFavId(null);
    }
  };

  return (
    <>
      <TopNavBar />

      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-6">
          {/* Header strip */}
          <div className="rounded-2xl bg-green-600 p-5 text-white shadow-sm">
            <h1 className="text-xl font-semibold">Diary</h1>
            <p className="text-sm text-white/90">
              Track plant observations daily — favourites, calendar view, and more.
            </p>
          </div>

          {/* Main layout */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left action tiles */}
            <div className="lg:col-span-5 space-y-4">
              <div
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow transition"
                role="button"
                tabIndex={0}
                onClick={() => setActiveModal("gamification")}
                onKeyDown={(e) => e.key === "Enter" && setActiveModal("gamification")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-green-700" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Daily Contribution Streak
                      </h3>
                    </div>

                    <p className="mt-1 text-sm text-gray-600">
                      Streak increases when you upload a plant photo on the <b>Map</b> .
                    </p>
                  </div>

                  <div className="shrink-0 rounded-2xl bg-green-50 p-3">
                    <Trophy className="h-6 w-6 text-green-700" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Current streak</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {streak.currentStreak} <span className="text-sm font-semibold">days</span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Longest: {streak.longestStreak} days
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Today</p>
                    <div className="mt-2 flex items-center gap-2">
                      {hasUploadedToday ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-700" />
                          <p className="text-sm font-semibold text-gray-900">Done ✅</p>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 text-gray-500" />
                          <p className="text-sm font-semibold text-gray-900">Not yet</p>
                        </>
                      )}
                    </div>

                    <Link
                      href="/Dashboard"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      <MapPin className="h-4 w-4" />
                      Go to Dashboard
                    </Link>

                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">
                      Next badge: {nextMilestone}-day streak
                    </p>
                    <p className="text-xs text-gray-500">
                      {progressNumerator}/{nextMilestone} ({progressPct}%)
                    </p>
                  </div>

                  <div className="mt-2 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-600"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {milestones.map((m) => {
                      const unlocked = streak.currentStreak >= m;
                      return (
                        <span
                          key={m}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                            unlocked
                              ? "border-green-200 bg-green-50 text-green-800"
                              : "border-gray-200 bg-white text-gray-600"
                          }`}
                        >
                          {unlocked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                          {m} days
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-2 gap-4">
                <ActionTile
                  title="Favourite Entries"
                  subtitle={`${favouriteEntries.length} saved`}
                  icon={<Heart className="h-6 w-6" />}
                  onClick={openFavourites}
                />
                <ActionTile
                  title="Diary Entry"
                  subtitle={
                    isFuture
                      ? "You can’t create entries for future dates"
                      : "Write for selected date"
                  }
                  icon={<Plus className="h-6 w-6" />}
                  onClick={isFuture ? undefined : openCreate}
                />
              </div>

              {/* Quick preview (selected day) */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Selected day</p>
                    <p className="text-base font-semibold text-gray-900">
                      {selectedDate}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  {currentEntry ? (
                    <EntryCard
                      {...currentEntry}
                      onDelete={() => handleDelete(currentEntry.id)}
                    />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5">
                      <p className="text-sm text-gray-600">
                        No entry yet for this date. Click <b>Diary entry</b> to start.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right calendar */}
            <div className="lg:col-span-7">
              <CalendarView
                entries={entries}
                selectedDate={selectedDate}
                onSelectDate={(d) => setSelectedDate(d)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Modal */}
      <Modal
        open={activeModal === "gamification"}
        title="Gamification"
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Current streak</p>
                <p className="text-2xl font-bold text-gray-900">{streak.currentStreak} days</p>
                <p className="mt-1 text-xs text-gray-500">Longest streak: {streak.longestStreak} days</p>
              </div>
              <div className="rounded-2xl bg-green-50 p-4">
                <Flame className="h-7 w-7 text-green-700" />
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
              <b>How to earn streaks:</b> Upload at least 1 plant photo on the <b>Map</b> for AI scan.
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-semibold text-gray-900">Badges</p>
            <p className="text-xs text-gray-500">Unlocked badges stay permanently.</p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {milestones.map((m) => {
                const unlocked = streak.currentStreak >= m;
                return (
                  <div
                    key={m}
                    className={`rounded-2xl border p-4 ${
                      unlocked ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {unlocked ? (
                        <CheckCircle2 className="h-5 w-5 text-green-700" />
                      ) : (
                        <Lock className="h-5 w-5 text-gray-500" />
                      )}
                      <p className="font-semibold text-gray-900">{m}-Day Streak</p>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">
                      {unlocked ? "Unlocked 🎉" : `Keep going! ${m - streak.currentStreak} more day(s).`}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4">
              <Link
                href="/map"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                <MapPin className="h-4 w-4" />
                Go to Map Upload
              </Link>
            </div>
          </div>
        </div>

      </Modal>

      {/* Favourites Modal: fixed-size list + preview */}
      <Modal
        open={activeModal === "favourites"}
        title="Favourite Entries"
        onClose={() => {
          setActiveModal(null);
          setSelectedFavId(null);
        }}
      >
        {sortedFavourites.length && selectedFavourite ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* LEFT: fixed-height list card, scroll inside */}
            <div className="lg:col-span-7 rounded-2xl border border-gray-200 flex flex-col overflow-hidden h-[60vh]">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 shrink-0">
                <p className="text-sm font-semibold text-gray-900">Favourite list</p>
                <p className="text-xs text-gray-500">Scroll + click a row to preview</p>
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white border-b border-gray-200 z-10">
                    <tr className="text-left text-xs text-gray-500">
                      <th className="px-4 py-3 w-[140px]">Date</th>
                      <th className="px-4 py-3">Title</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedFavourites.map((e) => {
                      const isActive = e.id === selectedFavourite.id;
                      return (
                        <tr
                          key={e.id}
                          className={`cursor-pointer border-b last:border-b-0 ${
                            isActive ? "bg-green-50" : "hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedFavId(e.id)}
                        >
                          <td className="px-4 py-3 text-gray-700">{e.date}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              {e.title?.trim() ? e.title : "Untitled Observation"}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT: preview only */}
            <div className="lg:col-span-5">
              <EntryCard
                {...selectedFavourite}
                onEdit={() => {
                  setSelectedDate(selectedFavourite.date);
                  setEditingEntry(selectedFavourite);
                  setActiveModal("create");
                }}
                onDelete={() => handleDelete(selectedFavourite.id)}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
            No favourite entries yet. Mark an entry as favourite to see it here.
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        open={activeModal === "create"}
        title={currentEntry ? "Edit Entry" : "Create Entry"}
        onClose={() => {
          setActiveModal(null);
          setEditingEntry(null);
        }}
      >
        <DiaryEntryForm
          date={selectedDate}
          initialTitle={editingEntry?.title || ""}
          initialText={editingEntry?.text || ""}
          isFavourite={!!editingEntry?.isFavourite}
          initialPlantName={editingEntry?.plantName || ""}
          initialPlantCondition={editingEntry?.plantCondition || "Not sure"}
          onSave={handleSave}
          onCancel={() => {
            setActiveModal(null);
            setEditingEntry(null);
          }}
        />
      </Modal>
    </>
  );
}
