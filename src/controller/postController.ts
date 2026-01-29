import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, collection, addDoc,updateDoc,deleteDoc, getDocs, Timestamp, arrayUnion,increment } from "firebase/firestore";
import { Post } from "@/models/Post";
import { auth } from "@/lib/firebaseConfig";

const postsRef = collection(db, "posts");

export const createPost = async (post: Omit<Post, "id" | "createdAt" | "authorId">) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

 await addDoc(postsRef, {
  ...post,
  author: user.displayName || "Anonymous",
  date: new Date().toISOString(),
  authorId: user.uid,
  userId: user.uid,
  createdAt: Timestamp.now(),
});
};

export const fetchAllPosts = async (): Promise<Post[]> => {
  const snapshot = await getDocs(postsRef);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Post),
  }));
};

export async function getPostById(id: string) {
  const ref = doc(db, "posts", id);
  const snap = await getDoc(ref);

  console.log("📌 Looking for post:", id);
  console.log("📦 Exists:", snap.exists());

  if (snap.exists()) {
    const data = snap.data();
    console.log("📄 Post data:", data);

    return {
      id,
      title: data.title || "Untitled",
      content: data.content || "",
      author: data.author || "Unknown",
      userId: data.userId || "",
       authorId: data.authorId || "",
      date: data.date || new Date().toISOString(),
      tags: data.tags || [],
      views: data.views || 0,
      likes: data.likes || 0,
      replies: data.replies || [],
    };
  } else {
    return null;
  }
}

export const deletePost = async (postId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) throw new Error("Post not found");

  const postOwner = postSnap.data().userId;
  if (user.uid !== postOwner) throw new Error("Unauthorized");

  await deleteDoc(postRef);
};

export const editPost = async (postId: string, newContent: string) => {
  const user = auth.currentUser;
  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) throw new Error("Post not found");

  const postOwner = postSnap.data().userId;
  if (user?.uid !== postOwner) throw new Error("Unauthorized");

  await updateDoc(postRef, {
    content: newContent,
    updatedAt: new Date(),
  });
};



export async function addReplyToPost(id: string, reply: { name: string; text: string; timestamp: string }) {
  const ref = doc(db, "posts", id);
  await updateDoc(ref, {
    replies: arrayUnion(reply)
  });
}

export async function incrementLikeCount(id: string) {
  const ref = doc(db, "posts", id);
    await updateDoc(ref, {
      likes: increment(1)
    });
  }