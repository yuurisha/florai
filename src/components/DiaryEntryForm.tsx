// src/components/DiaryEntryForm.tsx
import React, { useState } from "react";

type Props = {
  date: string;
  initialTitle?: string;
  initialText?: string;
  initialImageUrl?: string;
  isFavourite?: boolean;
  onSave: (data: {
    title?: string;
    text: string;
    imageUrl?: string;
    isFavourite: boolean;
  }) => void;
  onCancel: () => void;
};

export default function DiaryEntryForm({
  date,
  initialTitle = "",
  initialText = "",
  initialImageUrl = "",
  isFavourite = false,
  onSave,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(initialText);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [fav, setFav] = useState(isFavourite);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ title, text, imageUrl, isFavourite: fav });
      }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold">Entry for {date}</h2>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <textarea
        placeholder="Write your thoughts..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-2 border rounded h-32"
        required
      />
      <input
        type="text"
        placeholder="Image URL (optional)"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={fav}
          onChange={() => setFav((prev) => !prev)}
        />
        <span>Mark as Favourite</span>
      </label>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
          Save
        </button>
      </div>
    </form>
  );
}
