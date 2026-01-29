import { auth, db } from "../lib/firebaseConfig";
import { collection, doc, getDoc, serverTimestamp, writeBatch} from "firebase/firestore";

const usersRef = collection(db, "users");
const activityLogsRef = collection(db, "activityLogs");

// getUserRole retrieves the role of the currently authenticated user from Firestore
export async function getUserRole(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data().role || null;
  }
  return null;
}

function actorMeta() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return {
    actorUid: user.uid,
    actorEmail: user.email ?? null,
    actorName: user.displayName ?? null,
  };
}

/**
 * Admin removes a user:
 * - deletes /users/{uid}
 * - logs into /activityLogs
 *
 * NOTE: This does NOT delete Firebase Auth account.
 */
export async function adminRemoveUser(userUid: string) {
  const targetRef = doc(usersRef, userUid);
  const snap = await getDoc(targetRef);
  if (!snap.exists()) return;

  const userData = snap.data();

  const batch = writeBatch(db);

  // Log first (same commit as delete)
  batch.set(doc(activityLogsRef), {
    action: "delete",
    entityType: "user",
    entityCollection: "users",
    entityId: userUid,
    entityTitle: userData?.name ?? userData?.displayName ?? userData?.email ?? userUid,
    deletedData: userData,
    ...actorMeta(),
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
  });

  // Remove user document
  batch.delete(targetRef);

  await batch.commit();
}

console.log("✅ userController loaded, has adminRemoveUser:", typeof adminRemoveUser);

