export interface IPublicationReport {
  id: string;
  created_at: Date;
  publication_id: string;
  origin_user_id: string;
  reason: string;
}
