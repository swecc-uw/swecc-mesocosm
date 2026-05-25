import { useState, type FormEvent } from "react";
import { Btn } from "@/components/ds/Btn";

interface AuthFormProps {
  isLogin: boolean;
  firstName?: string;
  lastName?: string;
  username: string;
  email?: string;
  password: string;
  confirmPassword?: string;
  discordUsername?: string;
  error: string;
  onUsernameChange: (value: string) => void;
  onFirstNameChange?: (value: string) => void;
  onLastNameChange?: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange?: (value: string) => void;
  onDiscordUsernameChange?: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

function Field({
  label,
  required,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="eyebrow mb-1.5 block">{label}</label>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-paper-2 border border-line rounded-[2px] focus:outline-none focus:border-ink transition-colors placeholder:text-ink-3"
      />
    </div>
  );
}

export function AuthForm({
  isLogin,
  firstName = "",
  lastName = "",
  username,
  email = "",
  password,
  confirmPassword = "",
  discordUsername = "",
  error,
  onUsernameChange,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onDiscordUsernameChange,
  onSubmit,
}: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="username"
        required
        value={username}
        onChange={onUsernameChange}
        placeholder="Enter your username"
      />
      {!isLogin && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="first name"
              required
              value={firstName}
              onChange={onFirstNameChange!}
              placeholder="First name"
            />
            <Field
              label="last name"
              required
              value={lastName}
              onChange={onLastNameChange!}
              placeholder="Last name"
            />
          </div>
          <Field
            label="email"
            required
            type="email"
            value={email}
            onChange={onEmailChange}
            placeholder="you@uw.edu"
          />
          <Field
            label="discord username"
            required
            value={discordUsername}
            onChange={onDiscordUsernameChange!}
            placeholder="Discord handle"
          />
        </>
      )}
      <div>
        <label className="eyebrow mb-1.5 block">password</label>
        <div className="flex gap-2">
          <input
            required
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Enter your password"
            className="flex-1 px-3 py-2 text-sm bg-paper-2 border border-line rounded-[2px] focus:outline-none focus:border-ink transition-colors placeholder:text-ink-3"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="px-3 text-xs uppercase tracking-[0.14em] text-ink-2 border border-line rounded-[2px] hover:text-ink hover:border-ink transition-colors"
          >
            {showPassword ? "hide" : "show"}
          </button>
        </div>
      </div>
      {!isLogin && (
        <Field
          label="confirm password"
          required
          type="password"
          value={confirmPassword}
          onChange={onConfirmPasswordChange!}
          placeholder="Confirm password"
        />
      )}
      {error && <p className="text-sm text-bad">{error}</p>}
      <Btn variant="primary" type="submit" className="w-full justify-center">
        {isLogin ? "Sign in" : "Register"} <span aria-hidden>→</span>
      </Btn>
    </form>
  );
}
