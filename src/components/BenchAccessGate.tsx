import { Link } from "react-router-dom";
import { Btn } from "@/components/ds/Btn";
import { useBenchAuth } from "@/hooks/useBenchAuth";
import { benchAuthDisabled } from "@/lib/env";

interface BenchAccessGateProps {
  children: React.ReactNode;
  /** When true, only members (SWECC login) may proceed — not guests. */
  membersOnly?: boolean;
}

export function BenchAccessGate({ children, membersOnly = false }: BenchAccessGateProps) {
  const {
    benchMe,
    loading,
    continueAsGuest,
    guestExpiresAt,
    ensureBenchForRun,
  } = useBenchAuth();

  if (benchAuthDisabled()) return children;

  if (loading) {
    return (
      <p className="text-sm text-ink-2 py-6 text-center">Checking bench access…</p>
    );
  }

  if (membersOnly && benchMe.type !== "member") {
    return (
      <div className="border border-line rounded-[2px] bg-paper-2 p-6 space-y-4">
        <p className="text-sm text-ink leading-relaxed">
          Publishing and developer registry actions require a verified SWECC member account.
        </p>
        <Link to="/auth" className="inline-flex">
          <Btn variant="primary">Sign in</Btn>
        </Link>
      </div>
    );
  }

  if (benchMe.type === "member" || benchMe.type === "guest") {
    return (
      <>
        {benchMe.type === "guest" && (
          <p className="text-xs text-ink-2 mb-4 border border-line rounded-[2px] px-3 py-2 bg-paper-2">
            Guest session
            {guestExpiresAt ? ` · expires ${new Date(guestExpiresAt).toLocaleString()}` : ""}
            . Runs appear on the public gallery; sign in to keep history after this session.
            {" "}
            <Link to="/auth" className="text-leaf-deep underline underline-offset-2">
              Sign in
            </Link>
          </p>
        )}
        {children}
      </>
    );
  }

  return (
    <div className="border border-line rounded-[2px] bg-paper-2 p-6 space-y-4">
      <p className="text-sm text-ink leading-relaxed">
        Submit a benchmark run as a guest (demo, rate-limited) or sign in with your SWECC account
        for full history and teams.
      </p>
      <div className="flex flex-wrap gap-3">
        <Btn
          variant="primary"
          onClick={async () => {
            await continueAsGuest();
            await ensureBenchForRun();
          }}
        >
          Try as guest
        </Btn>
        <Link to="/auth">
          <Btn variant="link">Sign in →</Btn>
        </Link>
      </div>
    </div>
  );
}
