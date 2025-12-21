export type PlantCondition = "Healthy" | "A bit dry" | "Diseased" | "Not sure";

export type DiaryEntry = {
  id: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  title?: string;
  text: string;
  isFavourite?: boolean;
  plantName?: string;
  plantCondition?: PlantCondition;
  createdAt?: any;
  updatedAt?: any;
};
