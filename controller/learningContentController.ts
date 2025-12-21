import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import type { TipDoc, ResourceDoc, Tip, Resource } from "@/models/Learning";

const tipsRef = collection(db, "learningTips");
const resourcesRef = collection(db, "learningResources");
const activityLogsRef = collection(db, "activityLogs");

function createdByMeta() {
  const user = auth.currentUser;
  return {
    createdById: user?.uid ?? null,
    createdByName: user?.displayName ?? user?.email ?? "Anonymous",
  };
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

// ---------- Tips ----------
export function subscribeTips(cb: (tips: Tip[]) => void) {
  const q = query(tipsRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const rows: Tip[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as TipDoc) }));
    cb(rows);
  });
}

export async function addTip(input: Omit<TipDoc, "createdAt" | "createdById" | "createdByName">) {
  await addDoc(tipsRef, { ...input, ...createdByMeta(), createdAt: serverTimestamp() });
}

export async function updateTip(
  id: string,
  input: Partial<Omit<TipDoc, "createdAt" | "createdById" | "createdByName">>
) {
  await updateDoc(doc(db, "learningTips", id), { ...input, updatedAt: serverTimestamp() } as any);
}


  // Deletes tip + logs activity atomically (same commit).
 
export async function deleteTip(id: string) {
  const tipRef = doc(db, "learningTips", id);
  const snap = await getDoc(tipRef);
  if (!snap.exists()) return;

  const tipData = snap.data() as TipDoc;

  const batch = writeBatch(db);
  batch.set(doc(activityLogsRef), {
    action: "delete",
    entityType: "learningTip",
    entityCollection: "learningTips",
    entityId: id,
    entityTitle: tipData.title ?? null,
    deletedData: tipData, // snapshot for audit/recovery
    ...actorMeta(),
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
  });

  batch.delete(tipRef);
  await batch.commit();
}

// ---------- Resources ----------
export function subscribeResources(cb: (resources: Resource[]) => void) {
  const q = query(resourcesRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const rows: Resource[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as ResourceDoc) }));
    cb(rows);
  });
}

export async function addResource(
  input: Omit<ResourceDoc, "createdAt" | "createdById" | "createdByName">
) {
  await addDoc(resourcesRef, { ...input, ...createdByMeta(), createdAt: serverTimestamp() });
}

export async function updateResource(
  id: string,
  input: Partial<Omit<ResourceDoc, "createdAt" | "createdById" | "createdByName">>
) {
  await updateDoc(doc(db, "learningResources", id), { ...input, updatedAt: serverTimestamp() } as any);
}

  // Deletes resources + logs activity atomically (same commit).

export async function deleteResource(id: string) {
  const resourceRef = doc(db, "learningResources", id);
  const snap = await getDoc(resourceRef);
  if (!snap.exists()) return;

  const resourceData = snap.data() as ResourceDoc;

  const batch = writeBatch(db);
  batch.set(doc(activityLogsRef), {
    action: "delete",
    entityType: "learningResource",
    entityCollection: "learningResources",
    entityId: id,
    entityTitle: resourceData.title ?? null,
    deletedData: resourceData, // snapshot for audit/recovery
    ...actorMeta(),
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
  });

  batch.delete(resourceRef);
  await batch.commit();
}
