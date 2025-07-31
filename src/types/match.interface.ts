export interface IMatch {
  id: string;
  user1_id: string;
  user2_id: string;
  user1_has_consented_to_reveal_photo: boolean;
  user2_has_consented_to_reveal_photo: boolean;
  created_at: Date;
}
