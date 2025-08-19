export interface IDecryptedPostReport {
  id: string;
  report_date: Date;
  creation_date: Date;
  origin_user_id: string;
  origin_user_info: string;
  target_user_id: string;
  target_user_info: string;
  content: string;
  reason: string;
}

export interface IDecryptedUserPostReport {
  id: string;
  user_id: string;
  author: string;
  created_at: Date;
  content: string;
  nb_like: number;
  nb_report: number;
  reason: string;
}
