"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { PlantCondition } from "@/app/diary/types";

type Props = {
  date: string;
  initialTitle?: string;
  initialText?: string;
  isFavourite?: boolean;
  initialPlantName?: string;
  initialPlantCondition?: PlantCondition;
  onSave: (data: {
    title: string;
    text: string;
    isFavourite: boolean;
    plantName?: string;
    plantCondition?: PlantCondition;
  }) => void;
  onCancel: () => void;
};

export default function DiaryEntryForm({
  date,
  initialTitle = "",
  initialText = "",
  isFavourite = false,
  initialPlantName = "",
  initialPlantCondition = "Not sure",
  onSave,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(initialText);
  const [fav, setFav] = useState(isFavourite);
  const [plantName, setPlantName] = useState(initialPlantName);
  const [plantCondition, setPlantCondition] =
    useState<PlantCondition>(initialPlantCondition);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSave({
      title: title.trim(),
      text,
      isFavourite: fav,
      plantName: plantName.trim() || undefined,
      plantCondition,
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 p-4 bg-white">
        <p className="text-sm text-gray-500">Entry date</p>
        <p className="text-base font-semibold text-gray-900">{date}</p>
      </div>

      <div className="rounded-2xl border border-gray-200 p-4 bg-white space-y-3">
        <p className="text-sm font-semibold text-gray-900">Plant of the Day</p>

        <input
          value={plantName}
          onChange={(e) => setPlantName(e.target.value)}
          placeholder="Plant name (e.g. Hibiscus)"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
        />

        <div className="flex flex-wrap gap-2">
          {(["Healthy", "A bit dry", "Diseased", "Not sure"] as PlantCondition[]).map(
            (label) => (
              <button
                key={label}
                type="button"
                onClick={() => setPlantCondition(label)}
                className={`rounded-full px-3 py-1 text-xs border transition ${
                  plantCondition === label
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-4 bg-white space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your observation..."
          className="w-full min-h-[140px] rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
        />

        <button
          type="button"
          onClick={() => setFav((v) => !v)}
          className={`inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl border transition ${
            fav
              ? "text-red-600 border-red-200 bg-red-50"
              : "text-gray-600 border-gray-200 bg-white hover:bg-gray-50"
          }`}
        >
          <Heart className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
          {fav ? "Favourited" : "Mark as favourite"}
        </button>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="rounded-xl bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
        >
          Save entry
        </button>
      </div>
    </div>
  );
}
