import { useEffect, useState } from "react";
import { listDeveloperEnvironments, type DeveloperEnvironment } from "@/lib/api";
import DeveloperDashboard from "@/components/DeveloperDashboard";
import { useAuth } from "@/hooks/useAuth";

export function DeveloperPage() {
  const { member } = useAuth();
  const [envs, setEnvs] = useState<DeveloperEnvironment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Developer — Mesocosm";
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listDeveloperEnvironments(member?.username);
        if (!cancelled) setEnvs(list);
      } catch {
        if (!cancelled) setEnvs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [member?.username]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center text-ink-2 text-sm">
        Loading…
      </div>
    );
  }

  return <DeveloperDashboard initialEnvs={envs} ownerHandle={member?.username ?? ""} />;
}
