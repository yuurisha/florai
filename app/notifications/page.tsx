"use client";

import TopNavbar from "@/components/TopNavBar";
import { useNotifications } from "@/context/NotificationContext";
import Link from "next/link";
import toast from "react-hot-toast";
import { useState } from "react";

export default function NotificationLogPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [loading, setLoading] = useState<string | null>(null);

  // Sort newest → oldest safely
  const sorted = [...notifications].sort((a, b) => {
    const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  });

  const handleMarkAsRead = async (notificationId: string) => {
    setLoading(notificationId);
    try {
      await markAsRead(notificationId);
      toast.success("Notification marked as read");
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      toast.error(error?.message || "Failed to mark notification as read");
    } finally {
      setLoading(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading("all");
    try {
      await markAllAsRead();
      toast.success("All notifications marked as read");
    } catch (error: any) {
      console.error("Error marking all as read:", error);
      toast.error(error?.message || "Failed to mark all notifications as read");
    } finally {
      setLoading(null);
    }
  };

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
              onClick={handleMarkAllAsRead}
              disabled={loading === "all"}
              className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === "all" ? "Processing..." : "Mark all as read"}
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

                // Get risk from notification directly or from nested prediction
                const riskValue = n.predictedRisk || p?.predictedRisk;
                const risk = riskValue ? riskValue.toString().toUpperCase() : "-";
                
                // Get spread from notification directly or from nested prediction
                const spreadValue = n.predictedSpread ?? p?.predictedSpread;
                const spread = typeof spreadValue === "number" 
                  ? `${spreadValue.toFixed(2)} m²` 
                  : "-";

                // Get coordinates
                const lat = n.latitude ?? p?.latitude;
                const lon = n.longitude ?? p?.longitude;
                const coords = typeof lat === "number" && typeof lon === "number"
                  ? `${lat.toFixed(3)}, ${lon.toFixed(3)}`
                  : "-";

                const time = n?.createdAt
                  ? new Date(n.createdAt).toLocaleString()
                  : "-";

                // Risk badge styling
                const getRiskStyle = () => {
                  if (!riskValue) return "bg-gray-100 text-gray-600";
                  const r = riskValue.toLowerCase();
                  if (r === "high") return "bg-red-100 text-red-700 font-semibold";
                  if (r === "medium") return "bg-yellow-100 text-yellow-700 font-medium";
                  if (r === "low") return "bg-green-100 text-green-700";
                  return "bg-gray-100 text-gray-600";
                };

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
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs ${getRiskStyle()}`}>
                        {risk}
                      </span>
                    </td>

                    {/* Spread */}
                    <td className="px-4 py-2 text-xs font-medium">{spread}</td>

                    {/* Coordinates */}
                    <td className="px-4 py-2 text-xs font-mono text-gray-600">{coords}</td>

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
                          onClick={() => handleMarkAsRead(n.notificationID)}
                          disabled={loading === n.notificationID}
                          className="text-green-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading === n.notificationID ? "..." : "Mark read"}
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
