// src/controller/gamificationController.ts
import { db } from "@/lib/firebaseConfig";
import {
  Timestamp,
  collection,
  getDocs,
  orderBy,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

type UploadDoc = {
  userId: string;
  createdAt: Timestamp;
};

export type LeaderRow = { uid: string; name: string; uploads: number };

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek() {
  // Monday start
  const d = startOfToday();
  const day = d.getDay(); // Sun=0
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function startOfMonth() {
  const d = startOfToday();
  d.setDate(1);
  return d;
}

async function getDisplayName(uid: string) {
  // If you have users/{uid}, we try read it; otherwise fallback uid
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return uid;
  const data = snap.data() as any;
  return data.username || data.name || data.displayName || uid;
}

export async function getUploadCounts(uid: string) {
  const uploadsRef = collection(db, "uploads");

  const totalSnap = await getDocs(query(uploadsRef, where("userId", "==", uid)));

  const weekStart = Timestamp.fromDate(startOfWeek());
  const monthStart = Timestamp.fromDate(startOfMonth());

  const weekSnap = await getDocs(
    query(uploadsRef, where("userId", "==", uid), where("createdAt", ">=", weekStart))
  );

  const monthSnap = await getDocs(
    query(uploadsRef, where("userId", "==", uid), where("createdAt", ">=", monthStart))
  );

  return {
    totalUploads: totalSnap.size,
    uploadsThisWeek: weekSnap.size,
    uploadsThisMonth: monthSnap.size,
  };
}

export async function getLeaderboard(mode: "weekly" | "monthly"): Promise<LeaderRow[]> {
  const uploadsRef = collection(db, "uploads");
  const start = mode === "weekly" ? startOfWeek() : startOfMonth();
  const startTs = Timestamp.fromDate(start);

  // Note: Firestore needs orderBy on the same field as range filter
  const snap = await getDocs(
    query(uploadsRef, where("createdAt", ">=", startTs), orderBy("createdAt", "desc"))
  );

  const counts = new Map<string, number>();
  snap.docs.forEach((d) => {
    const data = d.data() as UploadDoc;
    if (!data?.userId) return;
    counts.set(data.userId, (counts.get(data.userId) ?? 0) + 1);
  });

  const rows = await Promise.all(
    Array.from(counts.entries()).map(async ([uid, uploads]) => ({
      uid,
      uploads,
      name: await getDisplayName(uid),
    }))
  );

  rows.sort((a, b) => b.uploads - a.uploads);
  return rows.slice(0, 10);
}
