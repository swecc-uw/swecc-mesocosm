import { useCallback, useEffect, useState } from "react";
import {
  ACTIVE_TEAM_CHANGED_EVENT,
  getActiveTeam,
  setActiveTeam,
  type ActiveTeam,
} from "@/lib/benchAuth";

export function useActiveTeam() {
  const [team, setTeam] = useState<ActiveTeam | null>(() => getActiveTeam());

  useEffect(() => {
    const sync = () => setTeam(getActiveTeam());
    window.addEventListener(ACTIVE_TEAM_CHANGED_EVENT, sync);
    return () => window.removeEventListener(ACTIVE_TEAM_CHANGED_EVENT, sync);
  }, []);

  const selectTeam = useCallback((next: ActiveTeam | null) => {
    setActiveTeam(next);
    setTeam(next);
  }, []);

  return {
    team,
    isTeamMode: team !== null,
    selectTeam,
    clearTeam: () => selectTeam(null),
  };
}
