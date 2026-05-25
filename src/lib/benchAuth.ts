/**
 * Bench-api credentials: member JWT from swecc-server, or bench guest session.
 */

import { API_BASE, AUTH_API_BASE, benchAuthDisabled } from "@/lib/env";
import type { GuestSession } from "@/types/bench";

const TOKEN_KEY = "swecc_bench_token";
const PRINCIPAL_KEY = "swecc_bench_principal";
const ACTIVE_TEAM_KEY = "swecc_active_team_id";
const ACTIVE_TEAM_NAME_KEY = "swecc_active_team_name";

export const ACTIVE_TEAM_CHANGED_EVENT = "swecc-active-team-changed";

export interface ActiveTeam {
  id: string;
  name: string;
}

export type StoredBenchPrincipal = "member" | "guest";

export function getBenchToken(): string | null {
  if (benchAuthDisabled()) return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredBenchPrincipal(): StoredBenchPrincipal | null {
  const v = sessionStorage.getItem(PRINCIPAL_KEY);
  if (v === "member" || v === "guest") return v;
  return null;
}

export function getActiveTeamId(): string | null {
  return sessionStorage.getItem(ACTIVE_TEAM_KEY);
}

export function getActiveTeam(): ActiveTeam | null {
  const id = getActiveTeamId();
  if (!id) return null;
  const name = sessionStorage.getItem(ACTIVE_TEAM_NAME_KEY);
  return { id, name: name || "Team" };
}

export function setActiveTeam(team: ActiveTeam | null): void {
  if (team) {
    sessionStorage.setItem(ACTIVE_TEAM_KEY, team.id);
    sessionStorage.setItem(ACTIVE_TEAM_NAME_KEY, team.name);
  } else {
    sessionStorage.removeItem(ACTIVE_TEAM_KEY);
    sessionStorage.removeItem(ACTIVE_TEAM_NAME_KEY);
  }
  window.dispatchEvent(new Event(ACTIVE_TEAM_CHANGED_EVENT));
}

/** @deprecated Prefer setActiveTeam so the UI can show the team name. */
export function setActiveTeamId(teamId: string | null, teamName?: string): void {
  if (!teamId) {
    setActiveTeam(null);
    return;
  }
  setActiveTeam({ id: teamId, name: teamName ?? sessionStorage.getItem(ACTIVE_TEAM_NAME_KEY) ?? "Team" });
}

function persistBenchAuth(token: string, principal: StoredBenchPrincipal): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(PRINCIPAL_KEY, principal);
}

export function clearBenchAuth(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(PRINCIPAL_KEY);
  sessionStorage.removeItem(ACTIVE_TEAM_KEY);
  sessionStorage.removeItem(ACTIVE_TEAM_NAME_KEY);
}

export function getBenchAuthHeaders(): Record<string, string> {
  const token = getBenchToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/** Optional team context header for bench-api (mirrors CLI active team). */
export function getBenchContextHeaders(): Record<string, string> {
  const teamId = getActiveTeamId();
  if (!teamId) return {};
  return { "X-Bench-Team-Context": teamId };
}

export async function fetchMemberBenchToken(): Promise<string | null> {
  const res = await fetch(`${AUTH_API_BASE}/auth/jwt/`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { token?: string };
  const token = data.token;
  if (!token || typeof token !== "string") return null;
  persistBenchAuth(token, "member");
  return token;
}

export async function createGuestSession(): Promise<GuestSession> {
  const res = await fetch(`${API_BASE}/v1/auth/guest`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `${res.status} guest session failed`);
  }
  const data = (await res.json()) as GuestSession;
  persistBenchAuth(data.guest_token, "guest");
  return data;
}

export async function benchGuestLogout(): Promise<void> {
  const token = getBenchToken();
  if (getStoredBenchPrincipal() !== "guest" || !token) {
    clearBenchAuth();
    return;
  }
  try {
    await fetch(`${API_BASE}/v1/auth/guest/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } finally {
    clearBenchAuth();
  }
}

export async function syncMemberBenchAuth(): Promise<boolean> {
  if (benchAuthDisabled()) return true;
  const token = await fetchMemberBenchToken();
  return Boolean(token);
}
