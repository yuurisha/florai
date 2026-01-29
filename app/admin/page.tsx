"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import AdminTopNavbar from "../../components/adminTopNavBar";
import { getUserRole } from "../../controller/userController";

import { auth } from "@/lib/firebaseConfig";
import { signOut } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  getCountFromServer,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

import { subscribeActivityLogs } from "@/controller/activityLogController";
import type { ActivityLog } from "@/models/activityLog";

// ✅ ADD: same Select components used in Manage Events
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/select";

const ACTIONS = [
  { label: "All", value: "all" },
  { label: "Delete", value: "delete" },
  { label: "Create", value: "create" },
  { label: "Update", value: "update" },
];

const ENTITY_TYPES = [
  { label: "All", value: "all" },
  { label: "Tip", value: "learningTip" },
  { label: "Resource", value: "learningResource" },
  { label: "Map", value: "map" },
  { label: "Event", value: "event" },
  { label: "User", value: "user" },
];

export default function AdminPage() {
  const router = useRouter();

  const [loadingAccess, setLoadingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Activity log state
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const LOGS_PER_PAGE = 20;

  const [stats, setStats] = useState({
    userCount: 0,
    pendingEventCount: 0,
    surveyCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        setLoadingAccess(false);
        router.push("/login");
        return;
      }

      try {
        const role = await getUserRole(); // should read users/{uid}.role
        if (role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          router.push("/login");
        }
      } catch (e) {
        console.error("Role check failed:", e);
        setIsAdmin(false);
        router.push("/login");
      } finally {
        setLoadingAccess(false);
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    setLoadingLogs(true);

    const unsub = subscribeActivityLogs(
      (rows) => {
        setLogs(rows);
        setLoadingLogs(false);
      },
      async (err) => {
        // If snapshot fails for any reason, fallback to one-time fetch
        console.error("Snapshot failed, falling back to getDocs:", err);
        try {
          const q = query(
            collection(db, "activityLogs"),
            orderBy("createdAt", "desc"),
            limit(200)
          );
          const snap = await getDocs(q);
          setLogs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        } finally {
          setLoadingLogs(false);
        }
      },
      { limitNum: 200 }
    );

    return () => unsub();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    (async () => {
      try {
        setLoadingStats(true);

        const usersCol = collection(db, "users");
        const eventsCol = collection(db, "events");
        const surveysCol = collection(db, "surveys");

        const pendingEventsQ = query(eventsCol, where("status", "==", "pending"));

        const [userAgg, pendingAgg, surveyAgg] = await Promise.all([
          getCountFromServer(query(usersCol)),
          getCountFromServer(pendingEventsQ),
          getCountFromServer(query(surveysCol)),
        ]);

        setStats({
          userCount: userAgg.data().count,
          pendingEventCount: pendingAgg.data().count,
          surveyCount: surveyAgg.data().count,
        });
      } catch (e) {
        toast.error("Failed to load overview stats");
      } finally {
        setLoadingStats(false);
      }
    })();
  }, [isAdmin]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return logs.filter((r) => {
      const action = (r.action ?? "").toLowerCase();
      const entityType = (r.entityType ?? "").toLowerCase();

      const actionPick = (actionFilter ?? "all").toLowerCase();
      const entityPick = (entityFilter ?? "all").toLowerCase();

      if (actionPick !== "all" && action !== actionPick) return false;
      if (entityPick !== "all" && entityType !== entityPick) return false;

      if (!q) return true;

      const haystack = [
        r.action ?? "",
        r.entityType ?? "",
        r.entityId ?? "",
        r.entityTitle ?? "",
        r.actorEmail ?? "",
        r.actorName ?? "",
        r.actorUid ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [logs, search, actionFilter, entityFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, actionFilter, entityFilter]);

  // Paginate filtered logs
  const paginatedLogs = useMemo(() => {
    const startIdx = (currentPage - 1) * LOGS_PER_PAGE;
    return filteredLogs.slice(startIdx, startIdx + LOGS_PER_PAGE);
  }, [filteredLogs, currentPage, LOGS_PER_PAGE]);

  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      
      // Clear all cookies
      document.cookie = "firebaseToken=; Max-Age=0; path=/; SameSite=Lax";
      document.cookie = "userRole=; Max-Age=0; path=/; SameSite=Lax";
      
      // Clear localStorage
      localStorage.clear();
    } finally {
      router.push("/login");
    }
  };

  if (loadingAccess) return <div className="p-6">Checking access...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="fixed top-0 left-0 w-full z-50">
        <AdminTopNavbar />
      </div>

      {/* Content */}
      <div className="pt-20 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header + Logout */}
          <div className="rounded-lg border bg-white p-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1 text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-700">You have admin access.</p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-md px-4 py-2 text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100"
            >
              Logout
            </button>
          </div>

          {/* Overview */}
          <div className="rounded-lg border bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Overview</h2>
              <span className="text-xs text-gray-500">
                {loadingStats ? "Updating…" : "Live"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-700">
                  Current Users
                </div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {loadingStats ? "—" : stats.userCount}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Total user profiles in Firestore
                </div>
              </div>

              <div className="rounded-lg border bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-700">
                  Pending Event Approvals
                </div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {loadingStats ? "—" : stats.pendingEventCount}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Events waiting for admin approval
                </div>
              </div>

              <div className="rounded-lg border bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-700">
                  Survey Count
                </div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {loadingStats ? "—" : stats.surveyCount}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Total survey submissions
                </div>
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="rounded-lg border bg-white p-6 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Activity Logs</h2>
                <p className="text-sm text-gray-600">
                  Tracks admin actions (e.g., content deletes). Live updates.
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {/* ✅ Action dropdown: now same as Manage Events */}
              <div className="grid gap-1">
                <label className="text-sm font-semibold text-gray-800">
                  Action
                </label>

                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-full justify-between">
                    {ACTIONS.find(a => a.value === actionFilter)?.label || "Filter action"}
                  </SelectTrigger>
                  <SelectContent className="z-50 max-h-64 w-48 overflow-y-auto">
                    {ACTIONS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ Entity dropdown: now same as Manage Events */}
              <div className="grid gap-1">
                <label className="text-sm font-semibold text-gray-800">
                  Entity Type
                </label>

                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="w-full justify-between">
                    {ENTITY_TYPES.find(t => t.value === entityFilter)?.label || "Filter entity"}
                  </SelectTrigger>
                  <SelectContent className="z-50 max-h-64 w-48 overflow-y-auto">
                    {ENTITY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="md:col-span-2 grid gap-1">
                <label className="text-sm font-semibold text-gray-800">Search</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-md border px-3 py-2"
                  placeholder="Search by title, actor, entity id…"
                />
              </div>
            </div>

            {/* Table */}
            {loadingLogs ? (
              <div className="rounded-md border p-4 text-gray-700">
                Loading logs…
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="rounded-md border p-4 text-gray-700">
                No logs found.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-700">
                      <th className="px-4 py-3 font-semibold">Time</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                      <th className="px-4 py-3 font-semibold">Entity</th>
                      <th className="px-4 py-3 font-semibold">Title / ID</th>
                      <th className="px-4 py-3 font-semibold">Actor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedLogs.map((r) => (
                      <tr key={r.id} className="bg-white">
                        <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                          {formatTs(r.createdAt, (r as any).createdAtMs)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={badgeForAction(r.action)}>
                            {labelForAction(r.action)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                          {labelForEntity(r.entityType)}
                        </td>

                        <td className="px-4 py-3 text-gray-800">
                          <div className="font-semibold">{r.entityTitle ?? "-"}</div>
                          <div className="text-xs text-gray-600 break-all">{r.entityId}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-800">
                          <div className="font-semibold">{r.actorName ?? "-"}</div>
                          <div className="text-xs text-gray-600">
                            {r.actorEmail ?? r.actorUid ?? "-"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-500">
                Showing {paginatedLogs.length > 0 ? (currentPage - 1) * LOGS_PER_PAGE + 1 : 0} to {Math.min(currentPage * LOGS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length} logs
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-md px-3 py-1 text-sm font-semibold bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <span className="text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-md px-3 py-1 text-sm font-semibold bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * to prettify label for entity type
 */
function labelForEntity(entityType?: string) {
  switch ((entityType ?? "").toLowerCase()) {
    case "learningtip":
      return "Tip";
    case "learningresource":
      return "Resource";
    case "greenspace":
      return "Green Space";
    case "event":
      return "Event";
    case "user":
      return "User";
    default:
      return entityType ?? "-";
  }
}

/**
 * to prettify label for action badge
 */
function labelForAction(action?: string) {
  switch ((action ?? "").toLowerCase()) {
    case "delete":
      return "Delete";
    case "create":
      return "Create";
    case "update":
      return "Update";
    default:
      return action ?? "-";
  }
}

function badgeForAction(action?: string) {
  switch (action) {
    case "delete":
      return "inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-red-100 text-red-800";
    case "create":
      return "inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800";
    case "update":
      return "inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800";
    default:
      return "inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800";
  }
}

function formatTs(ts: any, ms?: number) {
  try {
    if (ts && typeof ts.toDate === "function") {
      return ts.toDate().toLocaleString();
    }
    if (typeof ms === "number") {
      return new Date(ms).toLocaleString();
    }
    return "-";
  } catch {
    return "-";
  }
}
