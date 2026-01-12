"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { PlantCondition } from "@/app/diary/types";
import toast from "react-hot-toast";

type Props = {
  date: string;
  initialTitle?: string;
  initialText?: string;
  initialImageUrl?: string;
  isFavourite?: boolean;
  initialPlantName?: string;
  initialPlantCondition?: PlantCondition;
  initialPlantNotes?: string;
  initialPlantImageUrl?: string;
  onSave: (data: {
    title: string;
    text: string;
    diaryImageFile?: File | null;
    plantImageFile?: File | null;
    existingDiaryImageUrl?: string;
    existingPlantImageUrl?: string;
    isFavourite: boolean;
    plantName?: string;
    plantCondition?: PlantCondition;
    plantNotes?: string;
  }) => void;
  onCancel: () => void;
};

export default function DiaryEntryForm({
  date,
  initialTitle = "",
  initialText = "",
  initialImageUrl = "",
  isFavourite = false,
  initialPlantName = "",
  initialPlantCondition = "Not sure",
  initialPlantNotes = "",
  initialPlantImageUrl = "",
  onSave,
  onCancel,
}: Props) {
  const [step, setStep] = useState<"diary" | "plant">("diary");
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(initialText);
  const [fav, setFav] = useState(isFavourite);
  const [diaryImageFile, setDiaryImageFile] = useState<File | null>(null);
  const [diaryImagePreview, setDiaryImagePreview] = useState<string>(initialImageUrl);
  const [plantName, setPlantName] = useState(initialPlantName);
  const [plantCondition, setPlantCondition] =
    useState<PlantCondition>(initialPlantCondition);
  const [plantNotes, setPlantNotes] = useState(initialPlantNotes);
  const [plantImageFile, setPlantImageFile] = useState<File | null>(null);
  const [plantImagePreview, setPlantImagePreview] = useState<string>(
    initialPlantImageUrl
  );

  useEffect(() => {
    return () => {
      if (diaryImagePreview && diaryImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(diaryImagePreview);
      }
      if (plantImagePreview && plantImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(plantImagePreview);
      }
    };
  }, [diaryImagePreview, plantImagePreview]);

  const handleSubmit = () => {
    if (!text.trim()) {
      toast.error("Diary text can't be empty.");
      return;
    }
    onSave({
      title: title.trim(),
      text,
      diaryImageFile,
      plantImageFile,
      existingDiaryImageUrl: initialImageUrl || undefined,
      existingPlantImageUrl: initialPlantImageUrl || undefined,
      isFavourite: fav,
      plantName: plantName.trim() || undefined,
      plantCondition,
      plantNotes: plantNotes.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 p-4 bg-white">
        <p className="text-sm text-gray-500">Entry date</p>
        <p className="text-base font-semibold text-gray-900">{date}</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
          <button
            type="button"
            onClick={() => setStep("diary")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              step === "diary"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Diary Entry
          </button>
          <button
            type="button"
            onClick={() => setStep("plant")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              step === "plant"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Plant of the Day
          </button>
        </div>

        {step === "diary" ? (
          <div className="p-4 space-y-3">
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

            <div className="rounded-xl border border-dashed border-gray-200 p-3">
              <p className="text-xs font-semibold text-gray-700">Diary photo</p>
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg bg-gray-50 px-3 py-4 text-xs text-gray-600">
                {diaryImagePreview ? (
                  <img
                    src={diaryImagePreview}
                    alt="Diary preview"
                    className="max-h-40 rounded-lg object-cover"
                  />
                ) : (
                  <span>Click to upload</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (!file) return;
                    if (diaryImagePreview.startsWith("blob:")) {
                      URL.revokeObjectURL(diaryImagePreview);
                    }
                    setDiaryImageFile(file);
                    setDiaryImagePreview(URL.createObjectURL(file));
                  }}
                />
              </label>
            </div>

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
        ) : (
          <div className="p-4 space-y-3">
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

            <div className="rounded-xl border border-dashed border-gray-200 p-3">
              <p className="text-xs font-semibold text-gray-700">Plant photo</p>
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg bg-gray-50 px-3 py-4 text-xs text-gray-600">
                {plantImagePreview ? (
                  <img
                    src={plantImagePreview}
                    alt="Plant preview"
                    className="max-h-40 rounded-lg object-cover"
                  />
                ) : (
                  <span>Click to upload</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (!file) return;
                    if (plantImagePreview.startsWith("blob:")) {
                      URL.revokeObjectURL(plantImagePreview);
                    }
                    setPlantImageFile(file);
                    setPlantImagePreview(URL.createObjectURL(file));
                  }}
                />
              </label>
            </div>

            <textarea
              value={plantNotes}
              onChange={(e) => setPlantNotes(e.target.value)}
              placeholder="Notes about the plant (optional)"
              className="w-full min-h-[120px] rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {step === "plant" ? (
          <button
            onClick={() => setStep("diary")}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Back
          </button>
        ) : null}
        <button
          onClick={onCancel}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        {step === "diary" ? (
          <button
            onClick={() => setStep("plant")}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
          >
            Save entry
          </button>
        )}
      </div>
    </div>
  );
}
