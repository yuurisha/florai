import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { NotificationPreferences } from "@/models/Notifications";

const PREFS_COLLECTION = "notificationPreferences";

export async function fetchNotificationPreferences(
  userID: string
): Promise<NotificationPreferences> {
  const ref = doc(db, PREFS_COLLECTION, userID);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const raw = snap.data() as any;
    const lastUpdated =
      raw.lastUpdated && typeof raw.lastUpdated.toDate === "function"
        ? raw.lastUpdated.toDate().toISOString()
        : raw.lastUpdated ?? new Date().toISOString();

    // ensure userId exists (fall back to doc id)
    const userId = raw.userId ?? snap.id;

    return { ...(raw as NotificationPreferences), lastUpdated, userId };
  }

  const defaultPrefs: NotificationPreferences = {
    enableAiAlerts: true,
    minSeverity: "medium",
    channelInApp: true,
    channelEmail: false,
    frequency: "realtime",
    lastUpdated: new Date().toISOString(),
    userId: userID, 
  };

  await setDoc(ref, defaultPrefs);
  return defaultPrefs;
}

export async function updateNotificationPreferences(
  userID: string,
  prefs: NotificationPreferences
) {
  const ref = doc(db, PREFS_COLLECTION, userID);
  const updated = { ...prefs, lastUpdated: new Date().toISOString(), userId: userID };
  await setDoc(ref, updated, { merge: true });
}
