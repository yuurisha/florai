// src/app/diary/page.tsx

"use client";
import { Calendar } from "lucide-react"; 
import CalendarView from "@/components/CalendarView";
import { useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import DiaryEntryForm from "@/components/DiaryEntryForm";
import FavouriteList from "@/components/FavouriteList";
import EntryCard from "@/components/EntryCard";
import { v4 as uuidv4 } from "uuid";
import { DiaryEntry } from "./types";

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
const getLocalISODate = () => {
  const localDate = new Date();
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const [selectedDate, setSelectedDate] = useState<string>(getLocalISODate());
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const handleToggleFavourite = (id: string) => {
  setEntries((prev) =>
    prev.map((entry) =>
      entry.id === id
        ? { ...entry, isFavourite: !entry.isFavourite }
        : entry
    )
  );
};
  const currentEntry = entries.find((e) => e.date === selectedDate);
  const handleSelectFavourite = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (entry) {
        setSelectedDate(entry.date);
        setEditingEntry(entry); // optional: prefill form for editing
    }
    };

  const handleSave = (data: {
    title?: string;
    text: string;
    imageUrl?: string;
    isFavourite: boolean;
  }) => {
    const exists = entries.find((e) => e.date === selectedDate);
    if (exists) {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.date === selectedDate ? { ...entry, ...data } : entry
        )
      );
    } else {
      const newEntry: DiaryEntry = {
        id: uuidv4(),
        date: selectedDate,
        ...data,
      };
      setEntries((prev) => [...prev, newEntry]);
    }
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleEdit = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (entry) {
        setSelectedDate(entry.date);
        setEditingEntry(entry);
        setShowForm(true);
    }
    };

  return (
  <>
    <TopNavBar />

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 pt-6 bg-[#f9fbf7] min-h-screen">
      {/* LEFT COLUMN: Calendar + Favourite */}
      <div className="md:col-span-1 space-y-6">
        <CalendarView
          entries={entries}
          selectedDate={selectedDate}
          onSelectDate={(date) => setSelectedDate(date)}
        />

        <div>
          <h2 className="font-semibold text-lg mb-2">Favourite Entries</h2>
          <FavouriteList entries={entries} onSelect={handleSelectFavourite} />
        </div>
      </div>

      {/* RIGHT COLUMN: Entry Viewer + Form */}
      <div className="md:col-span-2 space-y-4">
        <h1 className="text-xl font-bold">Diary Entry</h1>

        {currentEntry ? (
          <EntryCard
            {...currentEntry}
            onEdit={() => handleEdit(currentEntry.id)}
            onDelete={() => handleDelete(currentEntry.id)}
            onToggleFavourite={() => handleToggleFavourite(currentEntry.id)}
          />
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6 min-h-[300px] flex flex-col justify-between shadow-md">
            {/* Top Row with Button */}
            <div className="flex justify-between items-start">
              <div></div> {/* spacer */}
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

            {/* Centered Message */}
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