export type BenchPrincipalType = "anonymous" | "guest" | "member";

export interface BenchMe {
  type: BenchPrincipalType;
  user_id?: number;
  username?: string;
  guest_session_id?: string;
}

export interface BenchMeContext {
  solo: { env_count: number; run_count: number };
  teams: Array<{
    team_id: string;
    name: string;
    slug: string;
    role: string;
    member_count: number;
    max_members: number;
    join_code?: string | null;
    env_count?: number;
  }>;
}

export interface GalleryRunEntry {
  run_id: string;
  domain_id: string;
  model: string;
  primary_score: number | null;
  created_at: string;
  actor_label: string;
}

export interface BenchTeam {
  team_id: string;
  name: string;
  slug: string;
  role: string;
  member_count: number;
  max_members: number;
  join_code?: string | null;
}

export interface BenchTeamDetail extends BenchTeam {
  members: Array<{ user_id: number; role: string }>;
}

export interface GuestSession {
  guest_token: string;
  expires_at: string;
}
