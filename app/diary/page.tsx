// src/app/diary/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, Plus } from "lucide-react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Image from "next/image";
import toast from "react-hot-toast";
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
  uploadDiaryEntryImage,
  updateDiaryEntryMedia,
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



type ModalKey = "create" | "favourites" | null;
type EntryPanel = "plant" | "entry";

export default function DiaryPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const isFuture = isFutureISODate(selectedDate);
  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [activePanel, setActivePanel] = useState<EntryPanel>("plant");

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
    try {
      const updated = await fetchDiaryEntries(uid);
      setEntries(updated);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load diary entries. Please refresh.");
      setEntries([]);
    }
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
    if (isFutureISODate(selectedDate)) {
      toast.error("You can't write a diary for a future date.", {
        style: { background: "#fee2e2", color: "#991b1b" },
      });
      return; // block future
    }
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
    plantNotes?: string;
    diaryImageFile?: File | null;
    plantImageFile?: File | null;
    existingDiaryImageUrl?: string;
    existingPlantImageUrl?: string;
  }) => {
    if (!userId) return;
    if (isFutureISODate(selectedDate)) {
      toast.error("You can't write a diary for a future date.", {
        style: { background: "#fee2e2", color: "#991b1b" },
      });
      return;
    }

    const existing = entries.find((e) => e.date === selectedDate) || undefined;

    const baseData = {
      title: data.title,
      text: data.text,
      isFavourite: data.isFavourite,
      ...(data.plantName ? { plantName: data.plantName } : {}),
      ...(data.plantCondition ? { plantCondition: data.plantCondition } : {}),
      ...(data.plantNotes ? { plantNotes: data.plantNotes } : {}),
      ...(data.existingDiaryImageUrl ? { imageUrl: data.existingDiaryImageUrl } : {}),
      ...(data.existingPlantImageUrl ? { plantImageUrl: data.existingPlantImageUrl } : {}),
    };

    try {
      const entryId = await saveDiaryEntry(userId, selectedDate, existing, baseData);

      const updates: { imageUrl?: string; plantImageUrl?: string } = {};
      if (data.diaryImageFile) {
        updates.imageUrl = await uploadDiaryEntryImage(entryId, data.diaryImageFile, "diary");
      }
      if (data.plantImageFile) {
        updates.plantImageUrl = await uploadDiaryEntryImage(entryId, data.plantImageFile, "plant");
      }
      await updateDiaryEntryMedia(entryId, updates);

      await refreshEntries(userId);

      setActiveModal(null);
      setEditingEntry(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save diary entry. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;

    try {
      await deleteDiaryEntry(id);
      await refreshEntries(userId);

      if (selectedFavId === id) setSelectedFavId(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete diary entry. Please try again.");
    }
  };

  const handleToggleFav = async (id: string, current: boolean) => {
    if (!userId) return;
    try {
      await toggleFavouriteDiaryEntry(id, current);
      await refreshEntries(userId);

      // If we unfavourited the currently previewed one, selection will auto-fix via useEffect
      if (current === true && selectedFavId === id) {
        setSelectedFavId(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update favourite. Please try again.");
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
                  onClick={openCreate}
                  disabled={isFuture}
                />
              </div>

              {/* Plant of the day / Diary entry tabs (selected day) */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-1 items-center rounded-full bg-[#f4f8f4] p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setActivePanel("plant")}
                      className={`flex-1 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                        activePanel === "plant"
                          ? "bg-[#dcfce5] text-gray-900 shadow-sm ring-1 ring-green-200"
                          : "bg-transparent text-gray-700"
                      }`}
                    >
                      Plant of the Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePanel("entry")}
                      className={`flex-1 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                        activePanel === "entry"
                          ? "bg-[#dcfce5] text-gray-900 shadow-sm ring-1 ring-green-200"
                          : "bg-transparent text-gray-700"
                      }`}
                    >
                      Diary Entry
                    </button>
                  </div>
                  {currentEntry ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleFav(currentEntry.id, !!currentEntry.isFavourite)
                        }
                        aria-label={
                          currentEntry.isFavourite
                            ? "Remove from favourites"
                            : "Add to favourites"
                        }
                        className={`flex h-9 w-9 items-center justify-center rounded-full border hover:bg-gray-50 ${
                          currentEntry.isFavourite
                            ? "border-red-200 text-red-500"
                            : "border-gray-200 text-gray-600"
                        }`}
                      >
                        <Heart
                          className="h-4 w-4"
                          fill={currentEntry.isFavourite ? "currentColor" : "none"}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(currentEntry.id)}
                        className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4">
                  {activePanel === "plant" ? (
                    currentEntry ? (
                      <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">{currentEntry.date}</p>
                          </div>
                          {currentEntry.plantCondition ? (
                            <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
                              {currentEntry.plantCondition}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white">
                            {currentEntry.plantImageUrl || currentEntry.imageUrl ? (
                              <Image
                                src={currentEntry.plantImageUrl || currentEntry.imageUrl || ""}
                                alt={currentEntry.plantName || "Plant of the day"}
                                width={112}
                                height={112}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-gray-500">No photo</span>
                            )}
                          </div>

                          <div className="space-y-2 text-sm text-gray-700">
                            <p className="text-base font-semibold text-gray-900">
                              {currentEntry.plantName || "Plant name"}
                            </p>
                            <p>{currentEntry.plantCondition || "Condition"}</p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {currentEntry.plantNotes || "Description"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5">
                        <p className="text-sm text-gray-600">
                          No entry yet for this date. Click <b>Diary entry</b> to start.
                        </p>
                      </div>
                    )
                  ) : currentEntry ? (
                    <EntryCard {...currentEntry} />
                  ) : (
                    <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                      <p className="text-sm text-gray-600">
                        No diary entry yet for this date. Click <b>Diary entry</b> to start.
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
          initialImageUrl={editingEntry?.imageUrl || ""}
          isFavourite={!!editingEntry?.isFavourite}
          initialPlantName={editingEntry?.plantName || ""}
          initialPlantCondition={editingEntry?.plantCondition || "Not sure"}
          initialPlantNotes={editingEntry?.plantNotes || ""}
          initialPlantImageUrl={editingEntry?.plantImageUrl || ""}
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
