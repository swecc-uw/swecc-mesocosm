import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authRequest, getCSRF, resetCSRF } from "@/lib/authApi";
import { benchGuestLogout, clearBenchAuth, syncMemberBenchAuth } from "@/lib/benchAuth";
import { getCurrentUser } from "@/lib/member";
import { benchAuthDisabled } from "@/lib/env";
import type { Member } from "@/types/member";

interface LoginErrorBody {
  detail?: string;
  username?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  isAdmin: boolean;
  isVerified: boolean;
  member?: Member;
  error?: string;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    firstName: string,
    lastName: string,
    username: string,
    email: string,
    password: string,
    discordUsername: string,
  ) => Promise<number | undefined>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

async function checkSession(): Promise<boolean> {
  try {
    const res = await authRequest("/auth/session/");
    return res.status === 200;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string>();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined);
  const [member, setMember] = useState<Member | undefined>();
  const [sessionLoading, setSessionLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false);

  const loadSession = useCallback(async () => {
    setSessionLoading(true);
    const ok = await checkSession();
    setIsAuthenticated(ok);
    setSessionLoading(false);
    return ok;
  }, []);

  const refreshUser = useCallback(async () => {
    setUserLoading(true);
    try {
      const user = await getCurrentUser();
      setMember(user);
    } catch {
      setMember(undefined);
    } finally {
      setUserLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- mount session check and user refresh */
  useEffect(() => {
    void loadSession();
    void getCSRF();
  }, [loadSession]);

  useEffect(() => {
    if (isAuthenticated) void refreshUser();
    else setMember(undefined);
  }, [isAuthenticated, refreshUser]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleLoginError = useCallback((errorData?: LoginErrorBody) => {
    if (
      errorData?.detail ===
      "Your account does not have a Discord ID associated with it."
    ) {
      setError(
        `Your discord is not verified. Please type /verify in the swecc server and enter ${errorData.username ?? "your username"}`,
      );
      setIsAuthenticated(true);
    } else {
      setError("Invalid credentials. Please try again.");
      setIsAuthenticated(false);
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await authRequest("/auth/login/", {
        method: "POST",
        body: { username, password },
      });
      if (res.status === 200) {
        await getCSRF();
        setIsAuthenticated(true);
        setError(undefined);
        await refreshUser();
        if (!benchAuthDisabled()) await syncMemberBenchAuth();
      } else {
        handleLoginError(res.data as LoginErrorBody);
        throw new Error("Login failed");
      }
    },
    [handleLoginError, refreshUser],
  );

  const logout = useCallback(async () => {
    const res = await authRequest("/auth/logout/", { method: "POST" });
    if (res.status === 200) {
      resetCSRF();
      await getCSRF();
      if (!benchAuthDisabled()) await benchGuestLogout();
      else clearBenchAuth();
      setIsAuthenticated(false);
      setMember(undefined);
      setError(undefined);
    }
  }, []);

  const register = useCallback(
    async (
      firstName: string,
      lastName: string,
      username: string,
      email: string,
      password: string,
      discordUsername: string,
    ): Promise<number | undefined> => {
      const res = await authRequest<{ id?: number; username?: string; detail?: string }>(
        "/auth/register/",
        {
          method: "POST",
          body: {
            first_name: firstName,
            last_name: lastName,
            username,
            email,
            password,
            discord_username: discordUsername,
          },
        },
      );
      if (res.status === 201) {
        await getCSRF();
        setError(
          `Registration successful. Please type /verify in the swecc server and enter ${res.data.username ?? username}`,
        );
        return res.data.id;
      }
      setError(res.data.detail ?? "Registration failed. Please try again.");
      return undefined;
    },
    [],
  );

  const clearError = useCallback(() => setError(undefined), []);

  const groups = member?.groups?.map((g) => g.name) ?? [];
  const isAdmin = groups.includes("is_admin");
  const isVerified = groups.includes("is_verified");

  const loading =
    sessionLoading ||
    isAuthenticated === undefined ||
    (isAuthenticated === true && userLoading && !member);

  const value = useMemo(
    () => ({
      isAuthenticated: isAuthenticated === true,
      loading,
      isAdmin,
      isVerified,
      member,
      error,
      login,
      logout,
      register,
      clearError,
      refreshUser,
    }),
    [
      isAuthenticated,
      loading,
      isAdmin,
      isVerified,
      member,
      error,
      login,
      logout,
      register,
      clearError,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
