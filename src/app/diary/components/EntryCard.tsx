// src/app/diary/components/EntryCard.tsx

"use client";

import { Heart, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";

interface EntryCardProps {
  id: string;
  date: string;
  title?: string;
  text: string;
  imageUrl?: string;
  isFavourite?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavourite?: () => void;
}

export default function EntryCard({
  id,
  date,
  title,
  text,
  imageUrl,
  isFavourite,
  onEdit,
  onDelete,
  onToggleFavourite,
}: EntryCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-3">
      <div>
        <p className="text-sm text-gray-400">{date}</p>
       <h3 className="font-semibold text-lg">
        {title || "Untitled Observation"}
      </h3>
      </div>

      <p className="text-sm text-gray-700 whitespace-pre-line">{text}</p>

      {imageUrl && (
        <div className="relative w-full max-w-sm">
          <Image
            src={imageUrl}
            alt="Diary image"
            width={400}
            height={300}
            className="rounded-lg border"
          />
        </div>
      )}

      <div className="flex justify-end flex-wrap gap-2 pt-2">
        {onToggleFavourite && (
          <button
            onClick={onToggleFavourite}
            className={`flex items-center gap-1 px-3 py-1 text-sm border rounded-md hover:bg-gray-100 ${
              isFavourite
                ? "text-red-500 border-red-200"
                : "text-gray-500 border-gray-300"
            }`}
          >
            <Heart
              className="w-4 h-4"
              fill={isFavourite ? "currentColor" : "none"}
            />
            {isFavourite ? "Unfavourite" : "Favourite"}
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-3 py-1 text-sm border rounded-md hover:bg-gray-100"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
