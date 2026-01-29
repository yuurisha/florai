"use client";

import { useState } from "react";
import { useNotifications } from "@/context/NotificationContext";
import { Bell } from "lucide-react";
import NotificationDrawer from "./NotificationDrawer";

export default function NotificationBell() {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-green-50"
      >
        <Bell className="w-5 h-5 text-green-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80">
          <NotificationDrawer onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
