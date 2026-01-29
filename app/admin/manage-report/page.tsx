"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import {collection, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { fetchReportsAdmin, updateReportStatus } from "@/controller/reportController";
import type { Report, ReportStatus } from "@/models/Report";
import AdminTopNavbar from "@/components/adminTopNavBar";
import toast from "react-hot-toast";

const MANAGE_USER_ROUTE = "/admin/manage-user"; 

function formatMY(iso: string) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}


export default function AdminReportsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [status, setStatus] = useState<ReportStatus | "all">("open");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const userSnap = await getDoc(doc(db, "users", user.uid));
      const role = userSnap.exists() ? (userSnap.data() as any)?.role : null;

      if (role !== "admin") {
        window.location.href = "/unauthorized";
        return;
      }

      setIsAdmin(true);
    });

    return () => unsub();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReportsAdmin(status);
      setReports(data);

        const ids = Array.from(
        new Set(
            data
            .flatMap((r) => [r.reporterID, r.targetUserId].filter(Boolean) as string[])
        )
        );

        // Fetch any missing names (cached)
        const updates: Record<string, string> = {};
        await Promise.all(
        ids.map(async (uid) => {
            if (nameMap[uid]) return;
            updates[uid] = await getUserLabel(uid);
        })
        );

        if (Object.keys(updates).length > 0) {
        setNameMap((prev) => ({ ...prev, ...updates }));
        }


    } catch (e: any) {
      setError(e?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, status]);

  async function setReport(reportID: string, newStatus: ReportStatus) {
    try {
      await updateReportStatus(reportID, newStatus);
      await load();
    } catch (e: any) {
      alert(e?.message || "Update failed");
    }
  }

  if (!isAdmin) return null;

   const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-red-100 text-red-700 border-red-200"
      case "reviewing":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "resolved":
        return "bg-green-100 text-green-700 border-green-200"
      case "rejected":
        return "bg-gray-100 text-gray-700 border-gray-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  async function getUserLabel(uid: string): Promise<string> {
  if (!uid) return "Unknown";
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return "Unknown";
  const u = snap.data() as any;
  return u.displayName || u.name || u.username || u.email || "Unknown";
}


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm">
        <AdminTopNavbar />
      </div>

      {/* Main Content */}
      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>

            <div className="flex flex-wrap gap-3">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={status}
                onChange={(e) => setStatus(e.target.value as ReportStatus)}
              >
                <option value="open">Open</option>
                <option value="reviewing">Reviewing</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>

              <button
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                onClick={load}
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Loading & Error States */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="ml-3 text-gray-600">Loading reports...</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Reports Table */}
          {!loading && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Target
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Reporter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map((r) => (
                      <tr key={r.reportID} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3">{formatMY(r.createdAt)}</td>


                       <td className="p-3">
                        <div className="font-medium">Reported Type: {r.targetType}</div>
                        <div className="text-xs text-gray-600 break-all">ID:{r.targetId}</div>

                        {r.targetUserId && (
                            <div className="mt-2">
                            <div className="text-sm">
                                <span className="font-medium">Targetted User:</span>{" "}
                                {nameMap[r.targetUserId] ?? "Loading…"}
                            </div>
                            <div className="text-xs text-gray-600 font-mono break-all">
                                ID: {r.targetUserId}
                            </div>
                            </div>
                        )}
                        </td>

                        <td className="p-3">
                            <div className="text-sm">
                                <span className="font-medium">Reporter:</span>{" "}
                                {nameMap[r.reporterID] ?? "Loading…"}
                            </div>
                            <div className="text-xs text-gray-600 font-mono break-all">
                                ID: {r.reporterID}
                            </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{r.reason}</div>
                          {r.details && <div className="text-xs text-gray-500 mt-1 max-w-xs">Description:{r.details}</div>}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(r.status)}`}
                          >
                            {r.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="px-3 py-1.5 text-xs font-medium border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors"
                              onClick={() => setReport(r.reportID, "reviewing")}
                            >
                              Review
                            </button>
                            <button
                              className="px-3 py-1.5 text-xs font-medium border border-green-300 text-green-700 rounded-md hover:bg-green-50 transition-colors"
                              onClick={() => setReport(r.reportID, "resolved")}
                            >
                              Resolve
                            </button>
                            <button
                              className="px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                              onClick={() => setReport(r.reportID, "rejected")}
                            >
                              Reject
                            </button>

                            {r.targetUserId ? (
                              <Link
                                className="px-3 py-1.5 text-xs font-medium border border-indigo-300 text-indigo-700 rounded-md hover:bg-indigo-50 transition-colors"
                                href={`/admin/manage-user?uid=${encodeURIComponent(r.targetUserId)}`}
                              >
                                Manage User
                              </Link>
                            ) : (
                              <button
                                className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-400 rounded-md cursor-not-allowed"
                                disabled
                              >
                                Manage User
                              </button>
                            )}
                            
                            {/* OPEN TARGET */}
                            {r.targetType === "event" && (
                            <Link
                                className="border rounded px-2 py-1"
                                href={`/Learning/events?eventId=${encodeURIComponent(r.targetId)}`}
                            >
                                Open Event
                            </Link>
                            )}

                            {/* VIEW FORUM POST */}
                            {r.targetType === "forum" && (
                            <Link
                                className="px-3 py-1.5 text-xs font-medium border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
                                href={`/admin/manage-post/${encodeURIComponent(r.targetId)}`}
                            >
                                View Post
                            </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {reports.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <svg
                              className="w-12 h-12 text-gray-400 mb-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <p className="text-gray-600 font-medium">No reports found</p>
                            <p className="text-gray-500 text-sm mt-1">
                              Try changing the status filter or refresh the page
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
