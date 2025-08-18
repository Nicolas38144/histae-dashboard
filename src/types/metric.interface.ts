export interface ISizeDatabase {
  nb_post_liked: number;
  nb_match: number;
  nb_match_not_continued: number;
  nb_match_continued: number;
  nb_match_report: number;
  nb_post: number;
  nb_post_report: number;
  nb_user: number;
}

export interface IChartData {
	day: Date;
  nb_post_liked: number;
  nb_match: number;
  nb_match_not_continued: number;
  nb_match_continued: number;
  nb_match_report: number;
  nb_post: number;
  nb_post_report: number;
  nb_user: number;
}

export interface IUserMetric {
  nb_match: number;  
  nb_match_not_continued: number;
  nb_match_continued: number;
  nb_origin_match_report: number;
  nb_target_match_report: number;
  nb_post: number;
  nb_post_liked: number;
  nb_origin_post_report: number;
  nb_target_post_report: number;
}
