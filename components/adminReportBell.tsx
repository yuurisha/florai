"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Bell, RefreshCcw } from "lucide-react";
import { auth } from "@/lib/firebaseConfig";
import {
  fetchAdminReportNotifications,
  markNotificationRead,
} from "@/controller/notificationController";
import type { Notification } from "@/models/Notifications";

function formatMY(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export default function AdminReportBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  );

  const load = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const data = await fetchAdminReportNotifications(user.uid);
      setItems((data ?? []).slice(0, 10));
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load report notifications.");
    } finally {
      setLoading(false);
    }
  };

  // Preload once so badge shows without opening
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load when opened
  useEffect(() => {
    if (!open) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Open report notifications"
        className="relative rounded-md p-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[420px] max-w-[92vw] overflow-hidden rounded-xl border bg-white shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900">
                Reports
              </span>
              <span className="text-xs text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </span>
            </div>

            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              {loading ? "Refreshing" : "Refresh"}
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[420px] overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-gray-600">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-sm text-gray-600">
                No report notifications.
              </div>
            ) : (
              <ul className="divide-y">
                {items.map((n) => (
                  <li key={n.notificationID} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      {/* status dot */}
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 rounded-full ${
                          n.read ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        title={n.read ? "Read" : "Unread"}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-gray-900 break-words">
                            {n.description}
                          </p>
                          {!n.read && (
                            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                              Unread
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatMY(n.createdAt)}
                        </p>

                        {n.reportID && (
                          <p className="mt-1 text-[11px] text-gray-500 font-mono break-all">
                            ReportID: {n.reportID}
                          </p>
                        )}

                        <div className="mt-2 flex items-center gap-2">
                          <Link
                            href="/admin/manage-report"
                            onClick={() => setOpen(false)}
                            className="rounded-md border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white"
                          >
                            Open reports
                          </Link>

                          {!n.read && (
                            <button
                              type="button"
                              className="rounded-md border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white"
                              onClick={async () => {
                                try {
                                  await markNotificationRead(n.notificationID);
                                  await load();
                                } catch (e: any) {
                                  toast.error(e?.message ?? "Failed to mark as read.");
                                }
                              }}
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-3 flex items-center justify-between">
            <button
              type="button"
              className="text-xs font-semibold text-gray-600 hover:text-gray-900"
              onClick={() => setOpen(false)}
            >
              Close
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs font-semibold text-gray-700 hover:text-gray-900"
                onClick={async () => {
                  try {
                    const unread = items.filter((x) => !x.read);
                    await Promise.all(unread.map((x) => markNotificationRead(x.notificationID)));
                    await load();
                  } catch (e: any) {
                    toast.error(e?.message ?? "Failed to mark all as read.");
                  }
                }}
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
