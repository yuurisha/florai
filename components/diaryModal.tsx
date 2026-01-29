"use client";

import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export default function Modal({ open, title, children, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <button
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close modal overlay"
      />
      {/* modal */}
      <div className="absolute left-1/2
        top-1/2 w-[min(920px,92vw)] -translate-x-1/2 -translate-y-1/2
        rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 max-h-[75vh] overflow-auto">{children}</div>
      </div>
    </div>
  );
}
