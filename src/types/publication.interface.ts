export interface IPublication {
  id: string;
  author: string;
  created_at: Date;
  content: string;
  nb_like: number;
  nb_report: number;
}