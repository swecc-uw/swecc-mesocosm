import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  benchAuthDisabled,
  fetchBenchMe,
} from "@/lib/api";
import {
  benchGuestLogout,
  createGuestSession,
  getBenchToken,
  syncMemberBenchAuth,
} from "@/lib/benchAuth";
import type { BenchMe } from "@/types/bench";
import { useAuth } from "@/hooks/useAuth";

interface BenchAuthContextValue {
  benchMe: BenchMe;
  loading: boolean;
  hasBenchCredential: boolean;
  guestExpiresAt: string | null;
  refreshBench: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  endGuestSession: () => Promise<void>;
  ensureBenchForRun: () => Promise<"ok" | "need_guest" | "need_member">;
}

const BenchAuthContext = createContext<BenchAuthContextValue | undefined>(undefined);

export function useBenchAuth(): BenchAuthContextValue {
  const ctx = useContext(BenchAuthContext);
  if (!ctx) throw new Error("useBenchAuth must be used within BenchAuthProvider");
  return ctx;
}

export function BenchAuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isVerified } = useAuth();
  const [benchMe, setBenchMe] = useState<BenchMe>({ type: "anonymous" });
  const [loading, setLoading] = useState(true);
  const [guestExpiresAt, setGuestExpiresAt] = useState<string | null>(null);

  const refreshBench = useCallback(async () => {
    if (benchAuthDisabled()) {
      setBenchMe({ type: "member", user_id: 0, username: "local" });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const me = await fetchBenchMe();
      setBenchMe(me);
      if (me.type !== "guest") setGuestExpiresAt(null);
    } catch {
      setBenchMe({ type: "anonymous" });
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- bench principal sync on auth changes */
  useEffect(() => {
    void refreshBench();
  }, [refreshBench, isAuthenticated, isVerified]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (benchAuthDisabled()) return;
    if (isAuthenticated && isVerified) {
      void syncMemberBenchAuth().then(() => refreshBench());
    }
  }, [isAuthenticated, isVerified, refreshBench]);

  const continueAsGuest = useCallback(async () => {
    const session = await createGuestSession();
    setGuestExpiresAt(session.expires_at);
    await refreshBench();
  }, [refreshBench]);

  const endGuestSession = useCallback(async () => {
    await benchGuestLogout();
    setGuestExpiresAt(null);
    await refreshBench();
  }, [refreshBench]);

  const ensureBenchForRun = useCallback(async () => {
    if (benchAuthDisabled()) return "ok";
    if (benchMe.type === "member" || benchMe.type === "guest") return "ok";
    if (isAuthenticated && isVerified) {
      const ok = await syncMemberBenchAuth();
      if (ok) {
        await refreshBench();
        return "ok";
      }
      return "need_member";
    }
    return "need_guest";
  }, [benchMe.type, isAuthenticated, isVerified, refreshBench]);

  const value = useMemo(
    () => ({
      benchMe,
      loading,
      hasBenchCredential: benchAuthDisabled() || Boolean(getBenchToken()),
      guestExpiresAt,
      refreshBench,
      continueAsGuest,
      endGuestSession,
      ensureBenchForRun,
    }),
    [
      benchMe,
      loading,
      guestExpiresAt,
      refreshBench,
      continueAsGuest,
      endGuestSession,
      ensureBenchForRun,
    ],
  );

  return (
    <BenchAuthContext.Provider value={value}>{children}</BenchAuthContext.Provider>
  );
}
