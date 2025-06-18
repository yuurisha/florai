import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { DiaryEntry } from "@/app/diary/types";

type Props = {
  entries: DiaryEntry[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

export default function CalendarView({ entries, selectedDate, onSelectDate }: Props) {
  const selected = new Date(selectedDate);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <Calendar
        onChange={(value) => {
          const iso = (value as Date).toLocaleDateString("en-CA");
          onSelectDate(iso);
        }}
        value={selected}
        tileClassName={({ date }) => {
          const iso = date.toLocaleDateString("en-CA");
          const isEntry = entries.some((entry) => entry.date === iso);
          return isEntry ? "bg-green-100 rounded" : null;
        }}
      />
    </div>
  );
}

