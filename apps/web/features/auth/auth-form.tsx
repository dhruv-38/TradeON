"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { login, signup } from "./api";
import { AuthFormShell } from "../../components/auth-form-shell";
import { getApiErrorMessage } from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";

type AuthFormMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthFormMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isSignup = mode === "signup";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = isSignup
        ? await signup({ username, email, password })
        : await login({ email, password });

      setUser(response.user);
      setSuccessMessage(
        isSignup
          ? "Account created successfully. You can move into the dashboard next."
          : "Login successful. Your session is now ready.",
      );
      router.push("/dashboard");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormShell
      title={isSignup ? "Create your account" : "Log in to TradeON"}
      description={
        isSignup
          ? "Set up your account first. The backend will create your starter wallet during signup."
          : "Use your account credentials to continue into the trading workspace."
      }
      alternateHref={isSignup ? "/auth/login" : "/auth/signup"}
      alternateText={isSignup ? "Already have an account?" : "Don't have an account?"}
      alternateLabel={isSignup ? "Log in" : "Sign up"}
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        {isSignup ? (
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-ink-soft)]">
              Username
            </span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              className="h-12 rounded-2xl border border-[rgba(106,137,167,0.20)] bg-[rgba(245,249,253,0.92)] px-4 text-[var(--color-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:border-[var(--color-sky)] focus:bg-white"
              required
            />
          </label>
        ) : null}

        <label className="grid gap-2">
          <span className="text-sm font-medium text-[var(--color-ink-soft)]">
            Email
          </span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="h-12 rounded-2xl border border-[rgba(106,137,167,0.20)] bg-[rgba(245,249,253,0.92)] px-4 text-[var(--color-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:border-[var(--color-sky)] focus:bg-white"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-[var(--color-ink-soft)]">
            Password
          </span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Minimum 8 characters"
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={8}
            className="h-12 rounded-2xl border border-[rgba(106,137,167,0.20)] bg-[rgba(245,249,253,0.92)] px-4 text-[var(--color-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:border-[var(--color-sky)] focus:bg-white"
            required
          />
        </label>

        {errorMessage ? (
          <p className="rounded-2xl border border-[rgba(212,73,73,0.12)] bg-[rgba(212,73,73,0.06)] px-4 py-3 text-sm text-[var(--color-ink)]">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-2xl border border-[rgba(136,189,242,0.24)] bg-[rgba(136,189,242,0.10)] px-4 py-3 text-sm text-[var(--color-ink)]">
            {successMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 inline-flex h-12 items-center justify-center rounded-full border border-[rgba(56,73,89,0.12)] bg-[linear-gradient(135deg,var(--color-ink-soft),var(--color-ink))] px-5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(56,73,89,0.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(56,73,89,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting
            ? isSignup
              ? "Creating account..."
              : "Logging in..."
            : isSignup
              ? "Create account"
              : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-ink-soft)]">
        <Link href="/" className="font-medium transition hover:text-[var(--color-ink)]">
          Back to home
        </Link>
      </p>
    </AuthFormShell>
  );
}
