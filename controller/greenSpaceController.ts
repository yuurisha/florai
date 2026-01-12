import { db, auth } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { GreenSpace, LatLngPoint } from "@/models/greenSpace";

const greenSpacesRef = collection(db, "greenSpaces");
const activityLogsRef = collection(db, "activityLogs");

function actorMeta() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return {
    actorUid: user.uid,
    actorEmail: user.email ?? null,
    actorName: user.displayName ?? null,
  };
}

/* ================= CREATE ================= */
export const createGreenSpace = async (
  name: string,
  polygon: LatLngPoint[]
) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const docRef = await addDoc(greenSpacesRef, {
    name,
    polygon,
    isActive: true,
    createdAt: serverTimestamp(),
    createdBy: user.uid,
    totalUploads: 0,
    healthyUploads: 0,
    healthIndex: 0,
    photoUrl: null,
  });

  await addDoc(activityLogsRef, {
    action: "create",
    entityType: "map",
    entityCollection: "greenSpaces",
    entityId: docRef.id,
    entityTitle: name,
    ...actorMeta(),
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
  });
};

/* ================= FETCH ================= */
export const fetchGreenSpaces = async (): Promise<GreenSpace[]> => {
  const q = query(greenSpacesRef, where("isActive", "==", true));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<GreenSpace, "id">),
  }));
};

/* ================= APPLY AI RESULT ================= */

export const applyUploadResultToGreenSpace = async (
  greenSpaceId: string,
  result: {
    predictedClass: string;
    confidence: number;
    status: "Healthy" | "Diseased";
  }
) => {
  const ref = doc(db, "greenSpaces", greenSpaceId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);

    if (!snap.exists()) {
      throw new Error("Green space not found");
    }

    const data = snap.data();

    const prevTotal = data.totalUploads ?? 0;
    const prevHealthy = data.healthyUploads ?? 0;

    const newTotal = prevTotal + 1;
    const newHealthy =
      prevHealthy + (result.status === "Healthy" ? 1 : 0);

    const newHealthIndex = newHealthy / newTotal;

    transaction.update(ref, {
      totalUploads: newTotal,
      healthyUploads: newHealthy,
      healthIndex: newHealthIndex,

      lastPrediction: result.predictedClass,
      lastConfidence: result.confidence,
      lastStatus: result.status,

      updatedAt: serverTimestamp(),
    });
  });
};

/* ================= SOFT DELETE ================= */
export const deleteGreenSpace = async (greenSpaceId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const ref = doc(db, "greenSpaces", greenSpaceId);
  const snap = await getDoc(ref);
  await updateDoc(ref, {
    isActive: false,
  });

  const name = snap.exists() ? (snap.data() as any)?.name : null;
  await addDoc(activityLogsRef, {
    action: "delete",
    entityType: "map",
    entityCollection: "greenSpaces",
    entityId: greenSpaceId,
    entityTitle: name,
    ...actorMeta(),
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
  });
};

export const updateGreenSpaceMeta = async (
  greenSpaceId: string,
  updates: { name?: string; photoUrl?: string | null }
) => {
  const ref = doc(db, "greenSpaces", greenSpaceId);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
};

export const uploadGreenSpacePhoto = async (greenSpaceId: string, file: File) => {
  const storage = getStorage();
  const storageRef = ref(storage, `greenSpaces/${greenSpaceId}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  await updateGreenSpaceMeta(greenSpaceId, { photoUrl: url });
  return url;
};

export const removeGreenSpacePhoto = async (greenSpaceId: string) => {
  const storage = getStorage();
  const storageRef = ref(storage, `greenSpaces/${greenSpaceId}`);
  await deleteObject(storageRef).catch(() => null);
  await updateGreenSpaceMeta(greenSpaceId, { photoUrl: null });
};

export async function updateGreenSpaceHealth(
  greenSpaceId: string,
  status: "Healthy" | "Diseased"
) {
  const ref = doc(db, "greenSpaces", greenSpaceId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error("Green space not found");

    const data = snap.data();

    const totalUploads = (data.totalUploads ?? 0) + 1;
    const healthyUploads =
      (data.healthyUploads ?? 0) + (status === "Healthy" ? 1 : 0);

    const healthIndex = healthyUploads / totalUploads;

    transaction.update(ref, {
      totalUploads,
      healthyUploads,
      healthIndex,
      updatedAt: new Date(),
    });
  });
}
