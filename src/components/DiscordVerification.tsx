import { useRef, useState } from "react";
import { Btn } from "@/components/ds/Btn";
import { useAuth } from "@/hooks/useAuth";

interface DiscordVerificationProps {
  checkVerified: () => Promise<boolean>;
  onVerificationSuccess: () => void;
  username: string;
}

const MAX_ATTEMPTS = 3;
const CHECK_INTERVAL = 5000;

export function DiscordVerification({
  checkVerified,
  onVerificationSuccess,
  username,
}: DiscordVerificationProps) {
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [hasCopied, setHasCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = undefined;
    }
  };

  async function startChecking() {
    setIsLoading(true);
    setPolling(true);
    setVerificationFailed(false);
    setProgress(0);
    setAttempt(0);
    clearProgressInterval();

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => (prev + 2 >= 100 ? 0 : prev + 2));
    }, 400);

    const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

    try {
      for (let i = 1; i <= MAX_ATTEMPTS; i++) {
        setAttempt(i);
        const verified = await checkVerified();
        if (verified) {
          clearProgressInterval();
          setIsLoading(false);
          setPolling(false);
          setShowSuccess(true);
          setTimeout(onVerificationSuccess, 1500);
          return;
        }
        if (i < MAX_ATTEMPTS) await wait(CHECK_INTERVAL);
      }
    } catch {
      // fall through to failure state
    }

    clearProgressInterval();
    setIsLoading(false);
    setPolling(false);
    setVerificationFailed(true);
    setProgress(0);
    setAttempt(0);
  }

  function copyCommand() {
    void navigator.clipboard.writeText("/verify");
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 1500);
  }

  function handleLogout() {
    clearProgressInterval();
    setPolling(false);
    void logout();
  }

  if (showSuccess) {
    return (
      <div className="border border-line rounded-[2px] bg-paper-2 p-8 text-center">
        <p className="text-lg font-medium text-ok [font-family:var(--f-display)]">
          Verification successful
        </p>
        <p className="mt-2 text-sm text-ink-2">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-medium text-ink [font-family:var(--f-display)]">
          Discord verification
        </h1>
        <Btn variant="ghost" onClick={handleLogout} className="text-xs shrink-0">
          Log out
        </Btn>
      </div>

      <p className="text-sm text-ink-2 leading-relaxed">
        Complete Discord verification to use the developer registry. Run{" "}
        <code className="text-xs bg-paper-2 px-1 rounded">/verify</code> in the SWECC
        server, then enter your SWECC username when prompted.
      </p>

      <div className="border border-line rounded-[2px] bg-paper-2 p-4 space-y-3">
        <p className="eyebrow">Step 1 — copy command</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm px-3 py-2 bg-paper border border-line rounded-[2px]">
            /verify
          </code>
          <button
            type="button"
            onClick={copyCommand}
            className="text-xs uppercase tracking-[0.14em] text-ink-2 hover:text-ink px-3 py-2 border border-line rounded-[2px]"
          >
            {hasCopied ? "copied" : "copy"}
          </button>
        </div>
      </div>

      <div className="border border-line rounded-[2px] bg-paper-2 p-4">
        <p className="eyebrow mb-2">Step 2 — use your username</p>
        <p className="text-sm text-ink-2">
          When Discord asks, enter <strong className="text-ink">{username}</strong> (the
          username you signed in with).
        </p>
      </div>

      <div className="border border-line rounded-[2px] bg-paper-2 p-4 space-y-3">
        <p className="eyebrow">Step 3 — check status</p>
        <Btn
          variant="primary"
          onClick={() => void startChecking()}
          disabled={isLoading}
          className={isLoading ? "opacity-50 cursor-not-allowed" : ""}
        >
          {isLoading
            ? "Checking…"
            : verificationFailed
              ? "Try again"
              : "Start checking"}
        </Btn>
        {polling && (
          <div>
            <p className="text-xs text-ink-3 mb-2">
              Attempt {attempt} of {MAX_ATTEMPTS}
            </p>
            <div className="h-1 bg-line rounded-full overflow-hidden">
              <div
                className="h-full bg-leaf-deep transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        {verificationFailed && (
          <p className="text-sm text-bad">
            Verification timed out. Run /verify again and ensure you used{" "}
            <strong>{username}</strong>.
          </p>
        )}
      </div>
    </div>
  );
}
