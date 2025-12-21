"use client";

import TopNavbar from "@/components/TopNavBar";
import { useNotifications } from "@/context/NotificationContext";
import Link from "next/link";

export default function NotificationLogPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  // Sort newest → oldest safely
  const sorted = [...notifications].sort((a, b) => {
    const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  });

  return (
    <>
      <TopNavbar />

      <div className="p-6">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold text-gray-800">
            Notification Log
          </h1>

          <div className="flex gap-4 text-sm">
            <Link
              href="/notifications/settings"
              className="text-green-700 hover:underline"
            >
              Settings
            </Link>

            <button
              onClick={markAllAsRead}
              className="text-gray-500 hover:text-gray-700"
            >
              Mark all as read
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="text-left px-4 py-2">Type</th>
                <th className="text-left px-4 py-2">Description</th>
                <th className="text-left px-4 py-2">Risk</th>
                <th className="text-left px-4 py-2">Spread</th>
                <th className="text-left px-4 py-2">Coordinates</th>
                <th className="text-left px-4 py-2">Time</th>
                <th className="text-left px-4 py-2">Status</th>
              </tr>
            </thead>

            <tbody>
              {/* Empty state */}
              {sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-xs text-gray-500"
                  >
                    No notifications yet.
                  </td>
                </tr>
              )}

              {/* Render items */}
              {sorted.map((n) => {
                const p = n?.prediction;

                const notificationKey = n.notificationID ?? n._id;

                // Safe values
                const risk = p?.predictedRisk
                  ? p.predictedRisk.toString().toUpperCase()
                  : "-";

                const spread =
                  typeof p?.predictedSpread === "number"
                    ? p.predictedSpread.toFixed(2)
                    : "-";

                const coords =
                  typeof p?.latitude === "number" &&
                  typeof p?.longitude === "number"
                    ? `${p.latitude.toFixed(3)}, ${p.longitude.toFixed(3)}`
                    : "-";

                const time = n?.createdAt
                  ? new Date(n.createdAt).toLocaleString()
                  : "-";

                return (
                  <tr
                    key={notificationKey}
                    className="border-t hover:bg-gray-50"
                  >
                    {/* Type */}
                    <td className="px-4 py-2 text-xs">
                      {n.type === "ai_alert" ? "AI Alert" : "User Report"}
                    </td>

                    {/* Description */}
                    <td className="px-4 py-2 text-xs">
                      {n.description ?? "-"}
                    </td>

                    {/* Risk */}
                    <td className="px-4 py-2 text-xs">{risk}</td>

                    {/* Spread */}
                    <td className="px-4 py-2 text-xs">{spread}</td>

                    {/* Coordinates */}
                    <td className="px-4 py-2 text-xs">{coords}</td>

                    {/* Time */}
                    <td className="px-4 py-2 text-[11px] text-gray-500">
                      {time}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2 text-xs">
                      {n.read ? (
                        <span className="text-gray-400">Read</span>
                      ) : (
                        <button
                          onClick={() => markAsRead(n.notificationID)}
                          className="text-green-700 hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
