// controller/postController.ts
import { db, auth } from "../lib/firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  Timestamp,
  arrayUnion,
  increment,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { Post } from "../models/Post";
import type { Reply } from "../models/Post";


const postsRef = collection(db, "posts");

// ✅ Global unique indexes
const UNIQUE_TITLES_COL = "unique_post_titles";
const UNIQUE_CONTENTS_COL = "unique_post_contents";

// ✅ FIX: define the input type HERE (so TS can find it)
export type CreatePostInput = {
  title: string;
  content: string;
  tags: string[];
};

function normalizeOneLine(s: string) {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}
function cleanTitle(s: string) {
  return s.trim().replace(/\s+/g, " ");
}
function cleanContent(s: string) {
  return s.trim();
}
async function sha256Hex(input: string) {
  const enc = new TextEncoder().encode(input);
  const hashBuf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * ✅ CREATE with GLOBAL dedupe:
 * - blocks empty/whitespace fields
 * - blocks duplicate TITLE globally
 * - blocks duplicate CONTENT globally
 */
export const createPost = async (post: CreatePostInput) => {
  const user = auth.currentUser;
  if (!user) throw new Error("NOT_AUTHENTICATED");

  const title = cleanTitle(post.title);
  const content = cleanContent(post.content);

  // ✅ FIX: type tag param so no implicit-any
  const tags = (post.tags || []).map((t: string) => t.trim()).filter(Boolean);

  if (!title || !content || tags.length === 0) {
    throw new Error("VALIDATION_REQUIRED_FIELDS");
  }

  const titleNorm = normalizeOneLine(title);
  const contentNorm = normalizeOneLine(content);

  const titleKey = await sha256Hex(titleNorm);
  const contentKey = await sha256Hex(contentNorm);

  const postRef = doc(postsRef); // auto id
  const uniqueTitleRef = doc(db, UNIQUE_TITLES_COL, titleKey);
  const uniqueContentRef = doc(db, UNIQUE_CONTENTS_COL, contentKey);

  await runTransaction(db, async (tx) => {
    const [tSnap, cSnap] = await Promise.all([
      tx.get(uniqueTitleRef),
      tx.get(uniqueContentRef),
    ]);

    if (tSnap.exists()) throw new Error("DUPLICATE_TITLE");
    if (cSnap.exists()) throw new Error("DUPLICATE_CONTENT");

    tx.set(postRef, {
      title,
      titleNorm,
      content,
      contentNorm,
      tags,

      author: user.displayName || "Anonymous",
      date: new Date().toISOString(),
      authorId: user.uid,
      userId: user.uid,

      createdAt: Timestamp.now(),
      createdAtServer: serverTimestamp(),
      likedBy: [],

      views: 0,
      likes: 0,
      replies: [],
    } as any);

    tx.set(uniqueTitleRef, { postId: postRef.id, createdAt: serverTimestamp() });
    tx.set(uniqueContentRef, { postId: postRef.id, createdAt: serverTimestamp() });
  });

  return { id: postRef.id };
};

export const fetchAllPosts = async (): Promise<Post[]> => {
  const snapshot = await getDocs(postsRef);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Post),
  }));
};

export async function getPostById(id: string) {
  const ref = doc(db, "posts", id);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data: any = snap.data();

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
  }
  return null;
}

export const deletePost = async (postId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("NOT_AUTHENTICATED");

  const postRef = doc(db, "posts", postId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(postRef);
    if (!snap.exists()) throw new Error("POST_NOT_FOUND");

    const data: any = snap.data();
    if (user.uid !== data.userId) throw new Error("UNAUTHORIZED");

    const titleNorm = data.titleNorm || normalizeOneLine(data.title || "");
    const contentNorm = data.contentNorm || normalizeOneLine(data.content || "");

    const titleKey = titleNorm ? await sha256Hex(String(titleNorm)) : "";
    const contentKey = contentNorm ? await sha256Hex(String(contentNorm)) : "";

    tx.delete(postRef);

    if (titleKey) tx.delete(doc(db, UNIQUE_TITLES_COL, titleKey));
    if (contentKey) tx.delete(doc(db, UNIQUE_CONTENTS_COL, contentKey));
  });
};

export const editPost = async (postId: string, newContent: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("NOT_AUTHENTICATED");

  const content = cleanContent(newContent);
  if (!content) throw new Error("VALIDATION_REQUIRED_FIELDS");

  const postRef = doc(db, "posts", postId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(postRef);
    if (!snap.exists()) throw new Error("POST_NOT_FOUND");

    const data: any = snap.data();
    if (user.uid !== data.userId) throw new Error("UNAUTHORIZED");

    const oldNorm = data.contentNorm || normalizeOneLine(data.content || "");
    const newNorm = normalizeOneLine(content);

    if (oldNorm === newNorm) {
      tx.update(postRef, { updatedAt: serverTimestamp() });
      return;
    }

    const newKey = await sha256Hex(newNorm);
    const newUniqueRef = doc(db, UNIQUE_CONTENTS_COL, newKey);

    const existsSnap = await tx.get(newUniqueRef);
    if (existsSnap.exists()) throw new Error("DUPLICATE_CONTENT");

    if (oldNorm) {
      const oldKey = await sha256Hex(oldNorm);
      tx.delete(doc(db, UNIQUE_CONTENTS_COL, oldKey));
    }

    tx.update(postRef, {
      content,
      contentNorm: newNorm,
      updatedAt: serverTimestamp(),
    });

    tx.set(newUniqueRef, { postId, createdAt: serverTimestamp() });
  });
};

export async function addReplyToPost(id: string, reply: Reply) {
  const ref = doc(db, "posts", id);
  await updateDoc(ref, {
    replies: arrayUnion(reply),
  });
}

export async function incrementLikeCount(id: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("NOT_AUTHENTICATED");

  const ref = doc(db, "posts", id);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("POST_NOT_FOUND");

    const data: any = snap.data();
    const likedBy: string[] = Array.isArray(data.likedBy) ? data.likedBy : [];

    // ✅ block second like by same user
    if (likedBy.includes(user.uid)) {
      throw new Error("ALREADY_LIKED");
    }

    tx.update(ref, {
      likes: increment(1),
      likedBy: arrayUnion(user.uid),
    });
  });
}

export async function incrementViewCount(id: string) {
  const ref = doc(db, "posts", id);
  await updateDoc(ref, {
    views: increment(1),
  });
}