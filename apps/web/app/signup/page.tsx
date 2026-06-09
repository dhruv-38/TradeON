import { AppShell } from "../../components/layout/app-shell";
import { SignupForm } from "../../features/auth/components/signup-form";

export default function SignupPage() {
  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--color-accent)]">
            Authentication
          </p>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight">
              Add signup before building the dashboard.
            </h1>
            <p className="max-w-xl text-base leading-7 text-[var(--color-text-muted)]">
              A complete auth flow teaches better frontend habits than a single
              login screen. This page mirrors the login structure so you can see
              how reusable patterns should look in a growing app.
            </p>
          </div>
        </div>

        <SignupForm />
      </section>
    </AppShell>
  );
}
