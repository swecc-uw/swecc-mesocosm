export interface RawMemberData {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  discord_username: string;
  discord_id: number;
  created: string;
  groups?: { name: string }[];
  profile_picture_url?: string;
}

export interface Member {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  discordUsername: string;
  discordId: number;
  created: Date;
  groups?: { name: string }[];
  profilePictureUrl?: string;
}
