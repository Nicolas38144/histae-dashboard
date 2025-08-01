export interface IMessage {
  id: string;
  created_at: Date;
  match_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
}
