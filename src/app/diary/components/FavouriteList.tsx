// src/app/diary/components/FavouriteList.tsx

"use client";

import { DiaryEntry } from "../types";
import { ChevronRight } from "lucide-react"; // optional icon

interface FavouriteListProps {
  entries: DiaryEntry[];
  onSelect?: (id: string) => void;
}

export default function FavouriteList({
  entries,
  onSelect,
}: FavouriteListProps) {
  const favourites = entries.filter((entry) => entry.isFavourite);

  if (favourites.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow text-sm text-gray-500">
        No favourite entries yet.
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow max-h-64 overflow-y-auto">
      <ul className="divide-y divide-gray-200">
        {favourites.map((entry) => (
          <li key={entry.id} className="py-2">
            <button
              onClick={() => onSelect?.(entry.id)}
              className="w-full flex items-center justify-between text-left text-sm text-green-700 hover:underline"
            >
              <div>
                <div className="font-medium">{entry.title || "Untitled Entry"}</div>
                <div className="text-xs text-gray-500">{entry.date}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
