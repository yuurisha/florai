"use client";

import TopNavbar from "@/components/TopNavBar";
import { useNotifications } from "@/context/NotificationContext";
import { NotificationPreferences } from "@/models/Notifications";
import Link from "next/link";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";

export default function NotificationLogPage() {
  const { notifications, markAsRead, markAllAsRead, preferences, setPreferences } = useNotifications();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const NOTIFICATIONS_PER_PAGE = 20;
  
  // Filter states
  const [filterType, setFilterType] = useState<"realtime" | "daily" | "weekly">("realtime");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<string>("");

  // Filter notifications based on selected type
  const getFilteredNotifications = () => {
    let filtered = [...notifications];

    if (filterType === "daily" && selectedDate) {
      // Filter by selected date
      filtered = filtered.filter((n) => {
        if (!n?.createdAt) return false;
        const notifDate = new Date(n.createdAt);
        const selected = new Date(selectedDate);
        return (
          notifDate.getFullYear() === selected.getFullYear() &&
          notifDate.getMonth() === selected.getMonth() &&
          notifDate.getDate() === selected.getDate()
        );
      });
    } else if (filterType === "weekly" && selectedWeek) {
      // Filter by selected week (selectedWeek format: "2026-W02")
      const [year, week] = selectedWeek.split("-W");
      const weekNum = parseInt(week);
      
      filtered = filtered.filter((n) => {
        if (!n?.createdAt) return false;
        const notifDate = new Date(n.createdAt);
        const notifYear = notifDate.getFullYear();
        const notifWeek = getWeekNumber(notifDate);
        return notifYear === parseInt(year) && notifWeek === weekNum;
      });
    }
    // For "realtime", return all notifications (no filtering)

    // Sort newest → oldest
    return filtered.sort((a, b) => {
      const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
  };

  // Helper function to get week number
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const filtered = getFilteredNotifications();

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, selectedDate, selectedWeek]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / NOTIFICATIONS_PER_PAGE);
  const startIdx = (currentPage - 1) * NOTIFICATIONS_PER_PAGE;
  const paginatedNotifications = filtered.slice(startIdx, startIdx + NOTIFICATIONS_PER_PAGE);

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

  const handlePreferenceChange = (patch: Partial<NotificationPreferences>) => {
    if (preferences) {
      setPreferences({ ...preferences, ...patch });
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

        {/* Filter Controls */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Enable AI Alerts Toggle */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Enable AI Alerts:</label>
              <input
                type="checkbox"
                checked={preferences?.enableAiAlerts ?? true}
                onChange={(e) => handlePreferenceChange({ enableAiAlerts: e.target.checked })}
                className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Filter Type Selection */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">View:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as "realtime" | "daily" | "weekly")}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="realtime">Real-time (All)</option>
                <option value="daily">Daily Summary</option>
                <option value="weekly">Weekly Summary</option>
              </select>
            </div>

            {/* Date Picker for Daily */}
            {filterType === "daily" && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}

            {/* Week Picker for Weekly */}
            {filterType === "weekly" && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Week:</label>
                <input
                  type="week"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}

            {/* Results count */}
            <div className="text-sm text-gray-500">
              {filtered.length} notification{filtered.length !== 1 ? "s" : ""} found
            </div>
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
              {filtered.length === 0 && (
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
              {paginatedNotifications.map((n) => {
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
                      {n.type === "ai_alert" ? "AI Alert" : 
                       n.type === "um_special_alert" ? "UM Campus Alert" : 
                       "User Report"}
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

        {/* Pagination Controls */}
        {filtered.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {startIdx + 1} to {Math.min(startIdx + NOTIFICATIONS_PER_PAGE, filtered.length)} of {filtered.length} notifications
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-xs">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
