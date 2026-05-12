import { listDeveloperEnvironments, DeveloperEnvironment } from "@/lib/api";
import DeveloperDashboard from "@/components/DeveloperDashboard";

export const dynamic = "force-dynamic";

export default async function DeveloperPage() {
  let envs: DeveloperEnvironment[] = [];
  try {
    envs = await listDeveloperEnvironments();
  } catch {
    // API may not be running; show empty state
  }

  return <DeveloperDashboard initialEnvs={envs} />;
}
