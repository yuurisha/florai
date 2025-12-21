"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminTopNavbar from "@/components/adminTopNavBar";
import { getUserRole, adminRemoveUser } from "@/controller/userController";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import toast from "react-hot-toast";

type UserRow = {
  id: string; // uid
  email?: string;
  name?: string;
  fullName?: string;
  role?: string;
  createdAt?: any;
};

export default function AdminUsersPage() {
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [search, setSearch] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  // confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const role = await getUserRole();
        setIsAdmin(role === "admin");
      } catch (e: any) {
        console.error("getUserRole failed:", e);
        toast.error(e?.message ?? "Access check failed. Please try again.");
        setIsAdmin(false);
      } finally {
        setLoadingAccess(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    setLoadingUsers(true);
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: UserRow[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setUsers(rows);
        setLoadingUsers(false);
      },
      (err: any) => {
        console.error("users snapshot failed:", err);
        setLoadingUsers(false);
        toast.error(err?.message ?? "Failed to load users. Please refresh.");
      }
    );

    return () => unsub();
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const haystack = [u.id, u.email ?? "", u.name ?? "", u.fullName ?? "", u.role ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, search]);

  const openRemoveConfirm = (u: UserRow) => {
    setSelectedUser(u);
    setConfirmOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!selectedUser) return;

    const uid = selectedUser.id;

    try {
      setRemovingId(uid);

      await toast.promise(adminRemoveUser(uid), {
        loading: "Removing user...",
        success: "User removed and logged.",
        error: (e) => e?.message ?? "Failed to remove user.",
      });

      setConfirmOpen(false);
      setSelectedUser(null);
    } catch (e) {
      // toast.promise already handled messaging
      console.error("adminRemoveUser failed:", e);
    } finally {
      setRemovingId(null);
    }
  };

  if (loadingAccess) return <div className="p-6">Checking access...</div>;
  if (!isAdmin) return <div className="p-6">Unauthorized</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 w-full z-50">
        <AdminTopNavbar />
      </div>

      <div className="pt-20 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="rounded-lg border bg-white p-6">
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-gray-600 text-sm">
              View and remove users. Removals are logged in Activity Logs.
            </p>
          </div>

          <div className="rounded-lg border bg-white p-6 space-y-4">
            <div className="grid gap-1">
              <label className="text-sm font-semibold text-gray-800">Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-md border px-3 py-2"
                placeholder="Search by uid, email, name, role…"
              />
            </div>

            {loadingUsers ? (
              <div className="rounded-md border p-4 text-gray-700">Loading users…</div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-md border p-4 text-gray-700">No users found.</div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-700">
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">UID</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="bg-white">
                        <td className="px-4 py-3 text-gray-800 font-semibold">
                          {u.name ?? u.fullName ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-800">{u.email ?? "-"}</td>
                        <td className="px-4 py-3 text-gray-800">{u.role ?? "-"}</td>
                        <td className="px-4 py-3 text-gray-600 break-all">{u.id}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openRemoveConfirm(u)}
                            disabled={removingId === u.id}
                            className="rounded-md px-3 py-2 text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            {removingId === u.id ? "Removing..." : "Remove"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Showing {filteredUsers.length} / {users.length} users.
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-lg border">
            <div className="p-5">
              <h2 className="text-lg font-bold text-gray-900">Remove this user?</h2>
              <p className="mt-2 text-sm text-gray-600">
                This will delete the user profile record from database and log the action.
              </p>

              <div className="mt-3 rounded-md border bg-gray-50 p-3 text-sm">
                <div className="font-semibold text-gray-900"> 
                  {selectedUser?.email ?? selectedUser?.name ?? selectedUser?.fullName ?? "User"}
                </div>
                <div className="text-xs text-gray-600 break-all">{selectedUser?.id}</div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setConfirmOpen(false);
                    setSelectedUser(null);
                  }}
                  disabled={!!removingId}
                  className="rounded-md px-4 py-2 text-sm font-semibold border bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRemove}
                  disabled={!!removingId}
                  className="rounded-md px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {removingId ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
