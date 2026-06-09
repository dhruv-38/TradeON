"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { signup } from "../api/signup";
import { useAuthStore } from "../../../store/auth.store";

export function SignupForm() {
  const setUser = useAuthStore((state) => state.setUser);
  const [username, setUsername] = useState("");
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
      const data = await signup({ username, email, password });
      setUser(data.user);
      setSuccessMessage(
        "Account created successfully. The backend also created the starter wallet.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign up right now.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="gap-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Signup form</h2>
        <p className="text-sm leading-6 text-[var(--color-text-muted)]">
          Signup is a good place to practice feature ownership: this component
          owns form state, the API file owns the request, and the page stays
          focused on layout and teaching context.
        </p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-[var(--color-text-muted)]">
            Username
          </span>
          <Input
            type="text"
            placeholder="Dhruv"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </label>

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
          <span className="font-medium text-[var(--color-text-muted)]">
            Password
          </span>
          <Input
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
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
          {isSubmitting ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="text-sm text-[var(--color-text-muted)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-[var(--color-accent)] transition hover:text-[var(--color-accent-strong)]"
        >
          Go to login
        </Link>
      </p>
    </Card>
  );
}
