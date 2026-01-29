import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type QuerySnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import type { ActivityLog, ActivityLogDoc } from "@/models/activityLog";

const logsRef = collection(db, "activityLogs");

export function subscribeActivityLogs(
  cb: (rows: ActivityLog[]) => void,
  onError?: (e: unknown) => void,
  opts?: { limitNum?: number }
) {
  const q = query(logsRef, orderBy("createdAt", "desc"), limit(opts?.limitNum ?? 200));

  return onSnapshot(
    q,
    (snap) => {
      const rows: ActivityLog[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as ActivityLogDoc),
      }));
      cb(rows);
    },
    (err) => {
      console.error("activityLogs snapshot failed:", err);
      onError?.(err);
    }
  );
}
