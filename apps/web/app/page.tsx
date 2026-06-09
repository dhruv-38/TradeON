import Link from "next/link";
import { AppShell } from "../components/layout/app-shell";
import { Card } from "../components/ui/card";
import { ButtonLink } from "../components/ui/button-link";

const nextSteps = [
  {
    title: "Build auth flow",
    description:
      "Finish signup, login, logout, and session restore before expanding product screens.",
  },
  {
    title: "Create the trading workspace",
    description:
      "Split the page into market watch, chart area, order entry, and positions panels.",
  },
  {
    title: "Add realtime state carefully",
    description:
      "Use WebSockets for prices and live position updates, but avoid putting all server data in Zustand.",
  },
];

const frontendRules = [
  "Keep pages thin and move behavior into feature components.",
  "Model loading, error, and empty states for every async screen.",
  "Use Zustand only for truly shared client state.",
  "Create reusable UI after a pattern repeats, not before.",
];

export default function HomePage() {
  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <Card className="gap-6">
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--color-accent)]">
              Frontend Workspace
            </p>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Build the frontend one solid layer at a time.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
                The backend is already carrying most of the product logic. This
                app should now become a clean, readable surface for auth,
                market views, charts, orders, and positions.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/login">Go To Login</ButtonLink>
            <ButtonLink
              href="/signup"
              className="bg-transparent text-[var(--color-text)] ring-1 ring-[var(--color-border)] hover:bg-white/5 hover:text-[var(--color-accent)]"
            >
              Create Account
            </ButtonLink>
            <Link
              href="#standards"
              className="inline-flex items-center rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              See Standards
            </Link>
          </div>
        </Card>

        <Card className="gap-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Current Foundation
          </p>
          <dl className="grid gap-4 text-sm">
            <div className="rounded-2xl border border-[var(--color-border)] bg-black/10 p-4">
              <dt className="text-[var(--color-text-muted)]">Framework</dt>
              <dd className="mt-1 text-base font-medium">Next.js 16 + React 19</dd>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-black/10 p-4">
              <dt className="text-[var(--color-text-muted)]">Styling</dt>
              <dd className="mt-1 text-base font-medium">Tailwind CSS 4</dd>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-black/10 p-4">
              <dt className="text-[var(--color-text-muted)]">Client State</dt>
              <dd className="mt-1 text-base font-medium">Zustand for shared UI state</dd>
            </div>
          </dl>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {nextSteps.map((step, index) => (
          <Card key={step.title}>
            <span className="text-sm font-medium text-[var(--color-accent)]">
              0{index + 1}
            </span>
            <h2 className="text-xl font-semibold">{step.title}</h2>
            <p className="text-sm leading-6 text-[var(--color-text-muted)]">
              {step.description}
            </p>
          </Card>
        ))}
      </section>

      <section
        id="standards"
        className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]"
      >
        <Card className="gap-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Folder Direction
          </p>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-5 font-mono text-sm leading-7 text-[var(--color-text-muted)]">
            <p>app/</p>
            <p>components/</p>
            <p>features/</p>
            <p>hooks/</p>
            <p>lib/</p>
            <p>store/</p>
            <p>types/</p>
          </div>
        </Card>

        <Card className="gap-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Working Rules
          </p>
          <ul className="grid gap-3">
            {frontendRules.map((rule) => (
              <li
                key={rule}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-4 py-3 text-sm leading-6 text-[var(--color-text-muted)]"
              >
                {rule}
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </AppShell>
  );
}
