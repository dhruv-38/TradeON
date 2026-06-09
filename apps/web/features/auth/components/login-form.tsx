"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { login } from "../api/login";
import { useAuthStore } from "../../../store/auth.store";

export function LoginForm() {
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const data = await login({ email, password });
      setUser(data.user);
      setSuccessMessage("Login successful. Shared auth state is now updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to login right now.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="gap-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Login form</h2>
        <p className="text-sm leading-6 text-[var(--color-text-muted)]">
          Notice the separation here: the page owns layout, this component owns
          the form UI, the feature API file owns the request, and Zustand stores
          only the authenticated user.
        </p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-[var(--color-text-muted)]">Email</span>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-[var(--color-text-muted)]">Password</span>
          <Input
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {errorMessage ? (
          <p className="rounded-2xl border border-[rgba(251,113,133,0.2)] bg-[rgba(251,113,133,0.08)] px-4 py-3 text-sm text-[var(--color-danger)]">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-2xl border border-[rgba(86,212,255,0.18)] bg-[rgba(86,212,255,0.08)] px-4 py-3 text-sm text-[var(--color-accent)]">
            {successMessage}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <p className="text-sm text-[var(--color-text-muted)]">
        Need a new account?{" "}
        <Link
          href="/signup"
          className="font-medium text-[var(--color-accent)] transition hover:text-[var(--color-accent-strong)]"
        >
          Create one here
        </Link>
      </p>
    </Card>
  );
}
