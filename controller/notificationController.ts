import { db } from "@/lib/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";

import { Notification } from "@/models/Notifications";
import { PredictionSummary } from "@/models/Prediction";
import { ReportSummary } from "@/models/Report";

const NOTIF_COLLECTION = "notifications";
const SEVERITY_RANK: Record<string, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
};

function normalizeSeverity(pref?: string): number {
  if (!pref) return SEVERITY_RANK.Medium; // sensible default
  return SEVERITY_RANK[pref.charAt(0).toUpperCase() + pref.slice(1)] ?? SEVERITY_RANK.Medium;
}


export async function fetchUserNotifications(userID: string): Promise<Notification[]> {

  //FETCH USER NOTIFICATION PREFERENCES
  const prefSnap = await getDoc(doc(db, "notificationPreferences", userID));
  const prefs = prefSnap.exists()
  ? prefSnap.data()
  : {
      enableAiAlerts: true,
      channelInApp: true,
    };

// If user disabled all in-app notifications → return empty
if (!prefs.enableAiAlerts || !prefs.channelInApp) {
  return [];
}

  const notifRef = collection(db, NOTIF_COLLECTION);

  const q = query(
    notifRef,
    where("userID", "==", userID),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  const results: Notification[] = [];

  for (const d of snap.docs) {
    const data = d.data();

    /** -----------------------------
     * JOIN PREDICTION (FIXED)
     * ------------------------------ */
    let prediction: PredictionSummary | undefined = undefined;

    if (data.predictionID) {
      const predSnap = await getDoc(doc(db, "predictions", data.predictionID));
      if (predSnap.exists()) {
        prediction = predSnap.data() as PredictionSummary; // FIXED
      }
    }

    /** -----------------------------
     * JOIN REPORT (FIXED)
     * ------------------------------ */
    let report: ReportSummary | undefined = undefined;

    if (data.reportID) {
      const repSnap = await getDoc(doc(db, "reports", data.reportID));
      if (repSnap.exists()) {
        report = repSnap.data() as ReportSummary; // FIXED
      }
    }

    // Skip if notification itself is muted
    if (data.receiveNotifications === false) {
      continue;
    }

    // severity filter 
if (data.type === "ai_alert" && data.predictedRisk) {
  const notifSeverity = SEVERITY_RANK[data.predictedRisk] ?? 0;
  const userMinSeverity = normalizeSeverity(prefs.minSeverity);

  if (notifSeverity < userMinSeverity) {
    continue;
  }
}

    /** -----------------------------
     * BUILD FINAL NOTIFICATION OBJECT (FIXED)
     * ------------------------------ */
    results.push({
      notificationID: d.id,
      type: data.type,
      description: data.description,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate().toISOString() // Firestore Timestamp
        : new Date(data.createdAt).toISOString(),
      read: data.read,
      receiveNotifications: data.receiveNotifications ?? true,

      userID: data.userID,
      adminID: data.adminID ?? undefined,
      predictionID: data.predictionID ?? undefined,
      reportID: data.reportID ?? undefined,

      prediction, // typed
      report,
      _id: ""
    });
  }

  return results;
}

/** -----------------------------
 * CREATE NOTIFICATION
 * ------------------------------ */
export async function createNotificationDoc(payload: {
  type: "ai_alert" | "user_report";
  description: string;
  userID: string;
  adminID?: string;
  predictionID?: string;
  reportID?: string;
}) {
  const ref = doc(collection(db, NOTIF_COLLECTION));

  await setDoc(ref, {
    notificationID: ref.id,
    ...payload,
    read: false,
    createdAt: Timestamp.now(),
  });

  return ref.id;
}

/** -----------------------------
 * MARK SINGLE READ
 * ------------------------------ */
export async function markNotificationRead(id: string) {
  await updateDoc(doc(db, NOTIF_COLLECTION, id), { read: true });
}

/** -----------------------------
 * MARK ALL READ
 * ------------------------------ */
export async function markAllNotificationsRead(userID: string) {
  const notifRef = collection(db, NOTIF_COLLECTION);
  const q = query(notifRef, where("userID", "==", userID));
  const snap = await getDocs(q);

  const updates: Promise<any>[] = [];

  snap.forEach((d) => {
    updates.push(updateDoc(d.ref, { read: true }));
  });

  await Promise.all(updates);
}

/** -----------------------------
 * admin notification
 * ------------------------------ */
export async function fetchAdminReportNotifications(adminUid: string): Promise<Notification[]> {
  const notifRef = collection(db, "notifications");

  const q = query(
    notifRef,
    where("userID", "==", adminUid),
    where("type", "==", "user_report"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      notificationID: d.id,
      type: data.type,
      description: data.description,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      read: data.read ?? false,
      receiveNotifications: data.receiveNotifications ?? true,
      userID: data.userID,
      reportID: data.reportID ?? undefined,
      _id: "",
    } as Notification;
  });
}
