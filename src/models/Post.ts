export interface Reply {
  name: string;
  text: string;
  timestamp: string;
}

export interface Post {
  id?: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  userId: string;
  date: string;
  tags: string[];
  views?: number;
  likes?: number;
  replies?: Reply[];
}
