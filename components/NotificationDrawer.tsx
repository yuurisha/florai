"use client";

import Link from "next/link";
import { useNotifications } from "@/context/NotificationContext";
import { AlertTriangle, Flag, CheckCircle2, ClipboardList } from "lucide-react";
import { Notification } from "@/models/Notifications";

// ---------------------------------------------------------
// ICON LOGIC (safe)
// ---------------------------------------------------------
function severityIcon(n: Notification) {
  if (n.type === "user_report") {
    return <Flag className="w-4 h-4 text-orange-500" />;
  }

  if (n.type === "survey") {
    return <ClipboardList className="w-4 h-4 text-blue-500" />;
  }

  const risk = n.prediction?.predictedRisk?.toLowerCase();

  switch (risk) {
    case "high":
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case "medium":
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    default:
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  }
}

// ---------------------------------------------------------
// MAIN DRAWER COMPONENT
// ---------------------------------------------------------
export default function NotificationDrawer({ onClose }: { onClose: () => void }) {
  const { notifications, markAsRead } = useNotifications();

  const recent = [...notifications]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="bg-white shadow-lg border rounded-xl p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-gray-800">
          Recent Notifications
        </h3>
        <button
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>

      {/* No Notifications */}
      {recent.length === 0 && (
        <p className="text-xs text-gray-500">No notifications yet.</p>
      )}

      {/* Notification List */}
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {recent.map((n) => {
          const pred = n.prediction;

          // Safe extractions
          const risk = pred?.predictedRisk
            ? pred.predictedRisk.toUpperCase()
            : "UNKNOWN";

          const spread = typeof pred?.predictedSpread === "number"
            ? pred.predictedSpread.toFixed(2)
            : "?";

          const lat = typeof pred?.latitude === "number"
            ? pred.latitude.toFixed(3)
            : "?";

          const lng = typeof pred?.longitude === "number"
            ? pred.longitude.toFixed(3)
            : "?";

          return (
            <li
              key={n.notificationID}
              className={`p-2 rounded-md cursor-pointer hover:bg-gray-50 ${
                !n.read ? "bg-green-50" : ""
              }`}
              onClick={() => markAsRead(n.notificationID)}
            >
              <div className="flex items-center gap-2">
                {severityIcon(n)}

                <div className="flex-1">
                  {/* Title */}
                  <div className="text-xs font-semibold text-gray-800">
                    {n.type === "ai_alert"
                      ? "AI Risk Alert"
                      : n.type === "survey"
                        ? "New Survey"
                        : "User Report Alert"}
                  </div>

                  {/* Description */}
                  <div className="text-[11px] text-gray-500 line-clamp-2">
                    {n.description || "No description"}
                  </div>

                  {/* Prediction block (SAFE) */}
                  {n.type === "ai_alert" && pred && (
                    <div className="text-[10px] text-gray-400 mt-1">
                      Risk: {risk} • Spread {spread} • {lat}, {lng}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-[10px] text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <Link
        href="/notifications"
        className="mt-3 block text-center text-xs text-green-700 font-medium hover:underline"
        onClick={onClose}
      >
        View all notifications
      </Link>
    </div>
  );
}
