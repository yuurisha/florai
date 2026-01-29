import { db } from "@/lib/firebaseConfig";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { DiaryEntry } from "@/app/diary/types";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const diaryEntriesRef = collection(db, "diaryEntries");

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const fetchDiaryEntries = async (userId: string): Promise<DiaryEntry[]> => {
  const q = query(diaryEntriesRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as DiaryEntry)
  );
};

type SaveDiaryData = {
  title?: string;
  text: string;
  imageUrl?: string;
  isFavourite: boolean;
  plantName?: string;
  plantCondition?: "Healthy" | "A bit dry" | "Diseased" | "Not sure";
  plantNotes?: string;
  plantImageUrl?: string;
};

export const saveDiaryEntry = async (
  userId: string,
  date: string,
  existing: DiaryEntry | undefined,
  data: SaveDiaryData
) => {
  if (date > todayISO()) { // error handling for future date
    throw new Error("Cannot create diary entries for future dates.");
  }
  if (existing) {
    const ref = doc(db, "diaryEntries", existing.id);
    await updateDoc(ref, { ...data });
    return existing.id;
  }

  const id = uuidv4();
  await setDoc(doc(db, "diaryEntries", id), {
    id,
    userId,
    date,
    ...data,
  });
  return id;
};

export const deleteDiaryEntry = async (id: string) => {
  await deleteDoc(doc(db, "diaryEntries", id));
};

export const toggleFavouriteDiaryEntry = async (id: string, current: boolean) => {
  await updateDoc(doc(db, "diaryEntries", id), { isFavourite: !current });
};

export const uploadDiaryEntryImage = async (
  entryId: string,
  file: File,
  kind: "diary" | "plant"
) => {
  const storage = getStorage();
  const storageRef = ref(storage, `diaryEntries/${entryId}/${kind}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const updateDiaryEntryMedia = async (
  entryId: string,
  updates: { imageUrl?: string; plantImageUrl?: string }
) => {
  if (!updates.imageUrl && !updates.plantImageUrl) return;
  await updateDoc(doc(db, "diaryEntries", entryId), { ...updates });
};
