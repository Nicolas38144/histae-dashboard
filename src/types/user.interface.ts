export interface IDecryptedUser {
  id: string;
  role: string;
  phone_number: string;
  email_backup: string;
  created_at: Date;
  is_banned: boolean;
  nb_reports: number;
  last_active_at: Date | null;
  last_coords_lat: number | null;
  last_coords_lon: number | null;
  firstname: string;
  birthdate: Date;
  sex: string;
  bio: string | null;
  photo: string | null;
}

export interface IEncryptedUser {
  id: string;
  role: string;
  phone_number: string;
  phone_number_hash: string;
  email_backup: string;
  created_at: Date;
  is_banned: boolean;
  nb_reports: number;
  last_active_at: Date | null;
  last_coords_lat: string | null;
  last_coords_lon: string | null;
  firstname: string;
  birthdate: string;
  sex: string;
  bio: string | null;
  photo: string | null;
}
