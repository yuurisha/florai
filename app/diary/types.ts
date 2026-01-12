export type PlantCondition = "Healthy" | "A bit dry" | "Diseased" | "Not sure";

export type DiaryEntry = {
  id: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  title?: string;
  text: string;
  imageUrl?: string;
  isFavourite?: boolean;
  plantName?: string;
  plantCondition?: PlantCondition;
  plantNotes?: string;
  plantImageUrl?: string;
  createdAt?: any;
  updatedAt?: any;
};
