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

const diaryEntriesRef = collection(db, "diaryEntries");

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
};

export const saveDiaryEntry = async (
  userId: string,
  date: string,
  existing: DiaryEntry | undefined,
  data: SaveDiaryData
) => {
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


