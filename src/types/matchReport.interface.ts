export interface IMatchReport {
  id: string;
  created_at: Date;
  match_id: string;
  origin_user_id: string;
  reason: string;
}

export interface IUserMatchReportDecrypted {
  report_id: string;
  id: string;
  report_date: Date;
  match_date: Date;
  origin_user_id: string;
  target_user_id: string;
  origin_user_info: string;
  target_user_info: string;
}
