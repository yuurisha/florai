// src/app/diary/components/CalendarView.tsx

"use client";

import { useState } from "react";
import { DiaryEntry } from "@/app/diary/types";
import clsx from "clsx";

interface CalendarViewProps {
  entries: DiaryEntry[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

// Helper to get today in ISO format (YYYY-MM-DD) in local timezone
const getLocalTodayISO = () => {
  const localDate = new Date();
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const localTodayISO = getLocalTodayISO();
const today = new Date();
export default function CalendarView({
  entries,
  selectedDate,
  onSelectDate,
}: CalendarViewProps) {
  const localTodayISO = getLocalTodayISO();
  const today = new Date(localTodayISO);

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDay = startOfMonth.getDay(); // Sunday = 0

  const dates = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(currentYear, currentMonth, i + 1);
    return date.toISOString().split("T")[0];
  });

  const hasEntry = (date: string) =>
    entries.some((entry) => entry.date === date);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={goToPrevMonth}>&larr;</button>
        <h2 className="font-semibold text-lg">
          {new Date(currentYear, currentMonth).toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <button onClick={goToNextMonth}>&rarr;</button>
      </div>

      <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-500 mb-2">
        {weekdays.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-sm">
        {Array(startDay)
          .fill(null)
          .map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

        {dates.map((date) => {
          const isSelected = date === selectedDate;
          const isToday = date === localTodayISO;

          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              className={clsx(
                "aspect-square w-full rounded-md flex items-center justify-center",
                isSelected && "bg-green-600 text-white",
                !isSelected &&
                  hasEntry(date) &&
                  "bg-green-100 text-green-800 font-semibold",
                !isSelected && !hasEntry(date) && "hover:bg-gray-100",
                isToday && "ring-2 ring-green-400"
              )}
            >
              {Number(date.split("-")[2])}
            </button>
          );
        })}
      </div>
    </div>
  );
}

