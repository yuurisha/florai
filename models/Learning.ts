import type { Timestamp } from "firebase/firestore";

export type TipCategory = "Watering" | "Planting" | "Soil Care" | "Maintenance" | "Nutrition";
export type ResourceType = "Guide" | "Video Course" | "Reference";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "All levels";

export type TipDoc = {
  title: string;
  description: string;
  category: TipCategory;
  iconKey: string; // e.g. "droplets"
  createdAt?: Timestamp;
  createdById?: string;
  createdByName?: string;
};

export type ResourceDoc = {
  title: string;
  description: string;
  type: ResourceType;
  iconKey: string; // e.g. "video"
  content: string;
  duration: string;
  difficulty: Difficulty;
  createdAt?: Timestamp;
  createdById?: string;
  createdByName?: string;
};

export type Tip = TipDoc & { id: string };
export type Resource = ResourceDoc & { id: string };