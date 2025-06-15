// src/components/CalendarView.tsx
import React from "react";
import { DiaryEntry } from "@/app/diary/types";

type Props = {
  entries: DiaryEntry[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

export default function CalendarView({ entries, selectedDate, onSelectDate }: Props) {
  // Simple placeholder calendar (can be upgraded with date-picker)
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-md font-semibold mb-2">Calendar (placeholder)</h3>
      <p>Selected Date: {selectedDate}</p>
    </div>
  );
}
