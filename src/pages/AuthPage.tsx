import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/AuthForm";
import { DiscordVerification } from "@/components/DiscordVerification";
import { useAuth } from "@/hooks/useAuth";
import { isCurrentMemberVerified } from "@/lib/member";

type AuthTab = "login" | "register";

export function AuthPage() {
  const [tab, setTab] = useState<AuthTab>("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? "/developer";

  const {
    isAuthenticated,
    isVerified,
    member,
    login,
    register,
    error: authError,
    clearError,
    refreshUser,
  } = useAuth();

  useEffect(() => {
    document.title = "Sign in — Mesocosm";
  }, []);

  useEffect(() => {
    if (isAuthenticated && isVerified) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isVerified, navigate, from]);

  const formError = error || authError || "";

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    clearError();
    setSubmitting(true);
    try {
      await login(username, password);
    } catch {
      setError(authError ?? "Invalid username or password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    clearError();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!discordUsername || !username || !email || !password || !firstName || !lastName) {
      setError("Please fill out all fields.");
      return;
    }

    setSubmitting(true);
    const userId = await register(
      firstName,
      lastName,
      username,
      email,
      password,
      discordUsername,
    );
    if (!userId) setError(authError ?? "Registration failed.");
    setSubmitting(false);
  }

  if (
    isAuthenticated &&
    !isVerified &&
    member?.username &&
    member.username !== ""
  ) {
    return (
      <div className="max-w-md mx-auto px-6 py-16">
        <DiscordVerification
          checkVerified={isCurrentMemberVerified}
          onVerificationSuccess={async () => {
            await refreshUser();
            navigate(from, { replace: true });
          }}
          username={member.username}
        />
        {error && <p className="mt-4 text-sm text-bad">{error}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <header className="mb-10 text-center">
        <span className="eyebrow eyebrow-leaf">— SWECC account</span>
        <h1
          className="mt-3 text-4xl font-medium text-ink [font-family:var(--f-display)]"
          style={{ letterSpacing: "-0.018em" }}
        >
          Sign in to <em>mesocosm</em>
        </h1>
        <p className="mt-3 text-sm text-ink-2 leading-relaxed">
          Same credentials as engagement.swecc.org. Required for the developer
          registry, teams, and saved bench runs. Guests can still try demos from
          exhibit pages without an account.
        </p>
      </header>

      <div className="border border-line rounded-[2px] bg-paper p-6">
        <div className="flex border border-line rounded-[2px] mb-6 overflow-hidden">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setError("");
                clearError();
              }}
              className={`flex-1 py-2 text-xs uppercase tracking-[0.16em] transition-colors ${
                tab === t
                  ? "bg-ink text-paper"
                  : "bg-paper-2 text-ink-2 hover:text-ink"
              }`}
            >
              {t === "login" ? "Sign in" : "Register"}
            </button>
          ))}
        </div>

        {tab === "login" ? (
          <AuthForm
            isLogin
            username={username}
            email={email}
            password={password}
                    error={formError}
            onUsernameChange={setUsername}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleLogin}
          />
        ) : (
          <AuthForm
            isLogin={false}
            firstName={firstName}
            lastName={lastName}
            username={username}
            email={email}
            password={password}
            confirmPassword={confirmPassword}
            discordUsername={discordUsername}
                    error={formError}
            onUsernameChange={setUsername}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onDiscordUsernameChange={setDiscordUsername}
            onSubmit={handleRegister}
          />
        )}

        {submitting && (
          <p className="mt-4 text-center text-xs text-ink-3 uppercase tracking-[0.14em]">
            Working…
          </p>
        )}
      </div>
    </div>
  );
}
