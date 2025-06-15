// src/components/FavouriteList.tsx
import React from "react";
import { DiaryEntry } from "@/app/diary/types";

type Props = {
  entries: DiaryEntry[];
  onSelect: (id: string) => void;
};

export default function FavouriteList({ entries, onSelect }: Props) {
  const favourites = entries.filter((e) => e.isFavourite);

  return (
    <ul className="space-y-2">
      {favourites.length === 0 && (
        <li className="text-gray-500 text-sm">No favourites yet</li>
      )}
      {favourites.map((entry) => (
        <li
          key={entry.id}
          className="cursor-pointer text-green-700 hover:underline"
          onClick={() => onSelect(entry.id)}
        >
          {entry.title || `Entry on ${entry.date}`}
        </li>
      ))}
    </ul>
  );
}
