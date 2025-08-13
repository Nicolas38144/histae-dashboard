export interface IDecryptedUser {
  id: string;
  role: string;
  phone_number: string;
  email: string;
  password: string;
  created_at: Date;
  is_banned: boolean;
  last_active_at: Date | null;
  last_coords_lat: number | null;
  last_coords_lon: number | null;
  firstname: string;
  birthdate: Date;
  sex: string;
  bio: string;
  photo: string | null;
}

export interface IEncryptedUser {
  id: string;
  role: string;
  phone_number: string;
  phone_number_hash: string;
  email: string;
  password: string;
  created_at: Date;
  is_banned: boolean;
  last_active_at: Date | null;
  last_coords_lat: string | null;
  last_coords_lon: string | null;
  firstname: string;
  birthdate: string;
  sex: string;
  bio: string;
  photo: string | null;
}

export interface IFormattedUser {
  id: string;
  role: string;
  phone_number: string;
  email: string;
  password: string;
  created_at: string;
  is_banned: string;
  last_active_at: string;
  last_coords_lat: number | string;
  last_coords_lon: number | string;
  firstname: string;
  birthdate: Date;
  age: number,
  sex: string;
  bio: string;
  photo: string | null;
}
