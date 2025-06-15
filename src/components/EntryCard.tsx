// src/components/EntryCard.tsx
import React from "react";
import { DiaryEntry } from "@/app/diary/types";

type Props = DiaryEntry & {
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavourite: () => void;
};

export default function EntryCard({
  title,
  text,
  imageUrl,
  date,
  isFavourite,
  onEdit,
  onDelete,
  onToggleFavourite,
}: Props) {
  return (
    <div className="bg-white border rounded-lg p-6 shadow space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">{title || `Entry on ${date}`}</h2>
          <p className="text-sm text-gray-500">{date}</p>
        </div>
        <div className="space-x-2">
          <button onClick={onEdit} className="text-blue-600 text-sm">Edit</button>
          <button onClick={onDelete} className="text-red-600 text-sm">Delete</button>
          <button onClick={onToggleFavourite} className="text-yellow-500 text-sm">
            {isFavourite ? "★" : "☆"}
          </button>
        </div>
      </div>
      <p className="text-gray-700 whitespace-pre-wrap">{text}</p>
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Diary Visual"
          className="rounded-lg max-w-full mt-2"
        />
      )}
    </div>
  );
}
