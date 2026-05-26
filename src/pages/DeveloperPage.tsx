import { useEffect } from "react";
import DeveloperDashboard from "@/components/DeveloperDashboard";

export function DeveloperPage() {
  useEffect(() => {
    document.title = "Developer — Mesocosm";
  }, []);

  return <DeveloperDashboard />;
}
