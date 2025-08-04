export interface IMessage {
  id: string;
  created_at: Date;
  match_id: string;
  sender_id: string;
  sender_firstname: string;
  receiver_id: string;
  receiver_firstname: string;
  content: string;
}
