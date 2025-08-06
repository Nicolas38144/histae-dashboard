export interface IMatch {
  id: string;
  user1_id: string;
  user2_id: string;
  user1_info: string;
  user2_info: string;
  user1_has_consented_to_reveal_photo: boolean;
  user2_has_consented_to_reveal_photo: boolean;
  user1_wishes_to_continue: boolean;
  user2_wishes_to_continue: boolean;
  created_at: Date;
}


//todo

// mettre numéro de tél dans écran message