export interface IPost {
  id: string;
  user_id: string;
  author: string;
  created_at: Date;
  content: string;
  nb_like: number;
  nb_report: number;
}