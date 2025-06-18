// src/app/diary/components/DiaryEntryForm.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";

interface DiaryEntryFormProps {
  date: string;
  initialTitle?: string;
  initialText?: string;
  initialImageUrl?: string;
  isFavourite?: boolean;
  onSave: (data: { title: string; text: string; imageUrl?: string; isFavourite: boolean }) => void;
  onCancel?: () => void;
}

export default function DiaryEntryForm({
  date,
  initialTitle = "",
  initialText = "",
  initialImageUrl,
  isFavourite = false,
  onSave,
  onCancel,
}: DiaryEntryFormProps) {
  const [title, setTitle] = useState(initialTitle || "");
  const [text, setText] = useState(initialText);
  const [imageUrl, setImageUrl] = useState(initialImageUrl || "");
  const [fav, setFav] = useState(isFavourite);

  const MAX_FILE_SIZE = 300 * 1024; // 300 KB

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        alert("Image is too large. Please upload one smaller than 300KB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => setImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (text.trim()) {
      onSave({ title, text, imageUrl, isFavourite: fav });
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4 max-h-[80vh] overflow-y-auto">
      <h2 className="text-lg font-semibold">Entry for {date}</h2>

      <input
        type="text"
        className="w-full border border-gray-300 rounded-md p-2 text-sm"
        placeholder="Enter a title for your entry..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="w-full border border-gray-300 rounded-md p-2 text-sm min-h-[120px]"
        placeholder="Write your plant observation..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex items-center gap-4">
        <label className="cursor-pointer bg-gray-100 px-3 py-1 rounded-md border border-gray-300 text-sm hover:bg-gray-200">
          Upload Image
          <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
        </label>

        <button
          type="button"
          onClick={() => setFav(!fav)}
          className={`flex items-center gap-1 text-sm ${
            fav ? "text-red-500" : "text-gray-400"
          }`}
        >
          <Heart className="w-4 h-4" fill={fav ? "currentColor" : "none"} />
          {fav ? "Favourited" : "Mark as Favourite"}
        </button>
      </div>

      {imageUrl && (
        <div className="relative w-full max-w-xs space-y-2">
          <img
            src={imageUrl}
            alt="Uploaded Preview"
            className="rounded-lg border max-h-64 object-cover w-full"
          />
          <button
            type="button"
            onClick={() => setImageUrl("")}
            className="text-red-500 text-sm underline hover:text-red-700"
          >
            Remove Image
          </button>
        </div>
      )}


      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          className="px-4 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
        >
          Save Entry
        </button>
      </div>
    </div>
  );
}
