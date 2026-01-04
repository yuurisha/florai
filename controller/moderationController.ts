import { auth, db } from "@/lib/firebaseConfig";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { getUserRole } from "@/controller/userController";

async function assertAdmin() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const role = await getUserRole();
  if (role !== "admin") throw new Error("Unauthorized");
  return user.uid;
}
// ADMIN: Delete forum post
//
export async function adminDeleteForumPost(postId: string, reportId?: string) {
  await assertAdmin();

  await deleteDoc(doc(db, "posts", postId));

}
