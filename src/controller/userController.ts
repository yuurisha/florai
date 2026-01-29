import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

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

