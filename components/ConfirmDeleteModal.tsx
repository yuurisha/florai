// components/ConfirmingDeleteModal.tsx
"use client";
import { useEffect } from "react";

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-20 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-lg p-6 shadow-xl w-[90%] max-w-md border border-gray-200">
        <p className="text-gray-800 mb-4 whitespace-pre-line">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 text-sm"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}
