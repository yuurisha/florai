// src/app/diary/types.ts

export interface DiaryEntry {
  id: string;
  date: string;
  title?: string;
  text: string;
  imageUrl?: string;
  isFavourite?: boolean;
}