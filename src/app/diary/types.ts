export interface DiaryEntry {
  id: string;
  date: string;
  title?: string;
  text: string;
  imageUrl?: string;
  isFavourite?: boolean;
}