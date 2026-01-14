import { db, auth } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { GreenSpace, LatLngPoint } from "@/models/greenSpace";

const greenSpacesRef = collection(db, "greenSpaces");
const uploadsRef = collection(db, "uploads");
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
    diseasedUploads: 0,
    healthIndex: null,
    totalUploads5: 0,
    healthyUploads5: 0,
    diseasedUploads5: 0,
    healthIndex5: null,
    totalLeaves: 0,
    healthyLeaves: 0,
    diseasedLeaves: 0,
    leafHealthIndex: null,
    totalLeaves5: 0,
    healthyLeaves5: 0,
    diseasedLeaves5: 0,
    leafHealthIndex5: null,
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

export async function updateGreenSpaceHealth(greenSpaceId: string) {
  const ref = doc(db, "greenSpaces", greenSpaceId);
  const now = new Date();
  const start30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const start5 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const start30Ts = Timestamp.fromDate(start30);

  const recentSnap = await getDocs(
    query(
      uploadsRef,
      where("greenSpaceId", "==", greenSpaceId),
      where("createdAt", ">=", start30Ts)
    )
  );

  let healthyUploads = 0;
  let diseasedUploads = 0;
  let healthyUploads5 = 0;
  let diseasedUploads5 = 0;
  let healthyLeaves = 0;
  let diseasedLeaves = 0;
  let healthyLeaves5 = 0;
  let diseasedLeaves5 = 0;

  recentSnap.docs.forEach((docSnap) => {
    const data = docSnap.data() as any;
    const status = data?.observationStatus;
    if (status !== "Healthy" && status !== "Diseased") return;

    const createdAt = data?.createdAt;
    const createdAtDate =
      createdAt && typeof createdAt.toDate === "function" ? createdAt.toDate() : null;

    const hasSummaryFields =
      data?.summaryHealthy != null || data?.summaryDiseased != null || data?.summaryTotal != null;
    let summaryHealthy = Number(data?.summaryHealthy ?? 0);
    let summaryDiseased = Number(data?.summaryDiseased ?? 0);

    if (!hasSummaryFields && (status === "Healthy" || status === "Diseased")) {
      summaryHealthy = status === "Healthy" ? 1 : 0;
      summaryDiseased = status === "Diseased" ? 1 : 0;
    }

    if (status === "Healthy") healthyUploads += 1;
    else if (status === "Diseased") diseasedUploads += 1;

    healthyLeaves += summaryHealthy;
    diseasedLeaves += summaryDiseased;

    if (createdAtDate && createdAtDate >= start5) {
      if (status === "Healthy") healthyUploads5 += 1;
      else if (status === "Diseased") diseasedUploads5 += 1;

      healthyLeaves5 += summaryHealthy;
      diseasedLeaves5 += summaryDiseased;
    }
  });

  const totalUploads = healthyUploads + diseasedUploads;
  const healthIndex = totalUploads >= 5 ? healthyUploads / totalUploads : null;
  const totalUploads5 = healthyUploads5 + diseasedUploads5;
  const healthIndex5 = totalUploads5 >= 5 ? healthyUploads5 / totalUploads5 : null;
  const totalLeaves = healthyLeaves + diseasedLeaves;
  const leafHealthIndex = totalLeaves >= 5 ? healthyLeaves / totalLeaves : null;
  const totalLeaves5 = healthyLeaves5 + diseasedLeaves5;
  const leafHealthIndex5 = totalLeaves5 >= 5 ? healthyLeaves5 / totalLeaves5 : null;

  await updateDoc(ref, {
    totalUploads,
    healthyUploads,
    diseasedUploads,
    healthIndex,
    totalUploads5,
    healthyUploads5,
    diseasedUploads5,
    healthIndex5,
    totalLeaves,
    healthyLeaves,
    diseasedLeaves,
    leafHealthIndex,
    totalLeaves5,
    healthyLeaves5,
    diseasedLeaves5,
    leafHealthIndex5,
    updatedAt: serverTimestamp(),
  });
}
