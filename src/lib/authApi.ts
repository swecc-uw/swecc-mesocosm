/**
 * Session + CSRF client for swecc-server auth (mirrors swecc-engagement services/api.ts).
 */

import { AUTH_API_BASE } from "@/lib/env";

let csrfToken: string | undefined;
let csrfInit: Promise<void> | undefined;

export async function getCSRF(): Promise<void> {
  const res = await fetch(`${AUTH_API_BASE}/auth/csrf/`, {
    credentials: "include",
    cache: "no-store",
  });
  const token = res.headers.get("x-csrftoken") ?? res.headers.get("X-CSRFToken");
  if (token) csrfToken = token;
}

async function ensureCSRF(): Promise<void> {
  if (csrfToken) return;
  if (!csrfInit) {
    csrfInit = getCSRF().finally(() => {
      csrfInit = undefined;
    });
  }
  await csrfInit;
}

export function resetCSRF(): void {
  csrfToken = undefined;
}

type AuthMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface AuthResponse<T = unknown> {
  status: number;
  data: T;
}

export async function authRequest<T = unknown>(
  path: string,
  init: { method?: AuthMethod; body?: unknown } = {},
): Promise<AuthResponse<T>> {
  if (!path.startsWith("/auth/csrf/")) await ensureCSRF();

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (csrfToken) headers["X-CSRFToken"] = csrfToken;

  const res = await fetch(`${AUTH_API_BASE}${path}`, {
    method: init.method ?? "GET",
    credentials: "include",
    cache: "no-store",
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  let data: T;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = text as T;
    }
  } else {
    data = {} as T;
  }

  return { status: res.status, data };
}
