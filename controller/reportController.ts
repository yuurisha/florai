import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebaseConfig";
import type { Report, ReportStatus, ReportTargetType } from "@/models/Report";
import { createNotificationDoc } from "@/controller/notificationController";


const FORUM_COLLECTION = "posts";      
const FORUM_OWNER_FIELD = "userId";    
const EVENT_COLLECTION = "events";
const EVENT_OWNER_FIELD = "createdById";    

async function resolveTargetUserId(targetType: ReportTargetType, targetId: string): Promise<string | null> {
  if (targetType === "user") return targetId;

  if (targetType === "event") {
    const snap = await getDoc(doc(db, EVENT_COLLECTION, targetId));
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return data?.[EVENT_OWNER_FIELD] ?? null;
  }

  if (targetType === "forum") {
    const snap = await getDoc(doc(db, FORUM_COLLECTION, targetId));
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return data?.[FORUM_OWNER_FIELD] ?? null;
  }

  return null;
}

/**
 * USER: Create a report
 * Saves report doc + sends a "user_report" notification to all admins
 */
export async function createReport(payload: {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const targetUserId = await resolveTargetUserId(payload.targetType, payload.targetId);

  const reportDoc = {
    reporterID: user.uid,
    targetType: payload.targetType,
    targetId: payload.targetId,
    targetUserId: targetUserId ?? null,
    reason: payload.reason,
    details: payload.details ?? "",
    status: "open" as ReportStatus,
    createdAt: serverTimestamp(),
    resolvedAt: null,
    resolvedBy: null,
  };


  const ref = await addDoc(collection(db, "reports"), reportDoc);
  const reportID = ref.id;

  // notify all admins
  const adminSnap = await getDocs(query(collection(db, "users"), where("role", "==", "admin")));
  const admins = adminSnap.docs.map((d) => d.id);

  await Promise.all(
    admins.map((adminUid) =>
      createNotificationDoc({
        type: "user_report",
        description: `New report: ${payload.targetType} (${payload.targetId})`,
        userID: adminUid,      // <-- deliver to admin via userID field
        reportID: reportID,
      })
    )
  );

  return reportID;
}

/**
 * ADMIN: Fetch reports (filtered)
 */
export async function fetchReportsAdmin(status: ReportStatus | "all" = "open"): Promise<Report[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  // Role enforcement should be in Firestore rules, but we can still let the UI call this.

  const base = collection(db, "reports");
  const q =
    status === "all"
      ? query(base, orderBy("createdAt", "desc"))
      : query(base, where("status", "==", status), orderBy("createdAt", "desc"));

  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => {
    const data = docSnap.data() as any;

    return {
      reportID: docSnap.id,
      reporterID: data.reporterID,

      targetType: data.targetType,
      targetId: data.targetId,
      targetUserId: data.targetUserId ?? null,

      reason: data.reason,
      details: data.details ?? "",

      status: data.status ?? "open",
      adminNotes: data.adminNotes ?? null,

      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : String(data.createdAt),
      resolvedAt: data.resolvedAt?.toDate ? data.resolvedAt.toDate().toISOString() : (data.resolvedAt ?? null),
      resolvedBy: data.resolvedBy ?? null,
    } as Report;
  });
}

/**
 * ADMIN: Update report status
 */
export async function updateReportStatus(reportID: string, status: ReportStatus, adminNotes?: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const updates: any = {
    status,
    adminNotes: adminNotes ?? null,
  };

  if (status === "resolved" || status === "rejected") {
    updates.resolvedAt = serverTimestamp();
    updates.resolvedBy = user.uid;
  }

  await updateDoc(doc(db, "reports", reportID), updates);
}
