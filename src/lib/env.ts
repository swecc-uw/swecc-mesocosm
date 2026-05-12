function readApiBase(): string {
  const fromEnv =
    import.meta.env.VITE_PUBLIC_API_BASE ?? import.meta.env.VITE_PUBLIC_API_URL;
  if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();
  return "http://localhost:8000";
}

export const API_BASE = readApiBase();
