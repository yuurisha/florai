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
} from "firebase/firestore";
import { GreenSpace, LatLngPoint } from "@/models/greenSpace";

const greenSpacesRef = collection(db, "greenSpaces");

/* ================= CREATE ================= */
export const createGreenSpace = async (
  name: string,
  polygon: LatLngPoint[]
) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  await addDoc(greenSpacesRef, {
    name,
    polygon,
    isActive: true,
    createdAt: serverTimestamp(),
    createdBy: user.uid,
    totalUploads: 0,
    healthyUploads: 0,
    healthIndex: 0,
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
  await updateDoc(ref, {
    isActive: false,
  });
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
