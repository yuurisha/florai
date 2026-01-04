export interface DiaryEntry {
  id: string;
  userId: string;
  date: string;
  title?: string;
  text: string;
  imageUrl?: string;
  isFavourite?: boolean;
}