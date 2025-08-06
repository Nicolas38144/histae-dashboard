export interface IMessage {
  id: string;
  created_at: Date;
  match_id: string;
  sender_id: string;
  sender_info: string;
  receiver_id: string;
  receiver_info: string;
  content: string;
}
