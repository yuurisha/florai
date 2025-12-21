// src/app/diary/page.tsx

"use client";
import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../lib/firebaseConfig";

import TopNavBar from "../../components/TopNavBar";
import CalendarView from "../../components/CalendarView";
import FavouriteList from "../../components/FavouriteList";
import EntryCard from "../../components/EntryCard";
import DiaryEntryForm from "../../components/DiaryEntryForm";
import { DiaryEntry } from "./types";

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        fetchEntries(user.uid);
      }
    });
  }, []);

  const fetchEntries = async (uid: string) => {
    const q = query(collection(db, "diaryEntries"), where("userId", "==", uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DiaryEntry));
    setEntries(data);
  };

  const handleSave = async (data: {
    title?: string;
    text: string;
    imageUrl?: string;
    isFavourite: boolean;
  }) => {
    if (!userId) return;
    const exists = entries.find((e) => e.date === selectedDate);

    if (exists) {
      const docRef = doc(db, "diaryEntries", exists.id);
      await updateDoc(docRef, { ...data });
      fetchEntries(userId);
    } else {
      const id = uuidv4();
      await setDoc(doc(db, "diaryEntries", id), {
        id,
        date: selectedDate,
        userId,
        ...data,
      });
      fetchEntries(userId);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, "diaryEntries", id));
    fetchEntries(userId);
  };

  const handleToggleFavourite = async (id: string, current: boolean) => {
    if (!userId) return;
    await updateDoc(doc(db, "diaryEntries", id), { isFavourite: !current });
    fetchEntries(userId);
  };

  const currentEntry = entries.find((e) => e.date === selectedDate);

  return (
    <>
      <TopNavBar />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 pt-6 bg-[#f9fbf7] min-h-screen">
        {/* LEFT COLUMN */}
        <div className="md:col-span-1 space-y-6">
          <CalendarView
            entries={entries}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          <div>
            <h2 className="font-semibold text-lg mb-2">Favourite Entries</h2>
            <FavouriteList
              entries={entries}
              onSelect={(id) => {
                const e = entries.find((en) => en.id === id);
                if (e) {
                  setSelectedDate(e.date);
                  setEditingEntry(e);
                }
              }}
            />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-xl font-bold">Diary Entry</h1>

          {currentEntry ? (
            <EntryCard
              {...currentEntry}
              onEdit={() => {
                setEditingEntry(currentEntry);
                setShowForm(true);
              }}
              onDelete={() => handleDelete(currentEntry.id)}
              onToggleFavourite={() =>
                handleToggleFavourite(currentEntry.id, currentEntry.isFavourite || false)
              }
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6 min-h-[300px] flex flex-col justify-between shadow-md">
              <div className="flex justify-between items-start">
                <div></div>
                <button
                  onClick={() => {
                    setEditingEntry(null);
                    setShowForm(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  + New Entry
                </button>
              </div>
              <div className="flex flex-col items-center justify-center text-center flex-grow space-y-2">
                <Calendar className="w-8 h-8 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-700">
                  No entries for this date yet
                </h3>
                <p className="text-sm text-gray-500">
                  Click the button above to create your first entry!
                </p>
              </div>
            </div>
          )}

          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-xl shadow-lg">
                <DiaryEntryForm
                  date={selectedDate}
                  initialTitle={editingEntry?.title}
                  initialText={editingEntry?.text}
                  initialImageUrl={editingEntry?.imageUrl}
                  isFavourite={editingEntry?.isFavourite}
                  onSave={(data) => {
                    handleSave(data);
                    setShowForm(false);
                    setEditingEntry(null);
                  }}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingEntry(null);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
