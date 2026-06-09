import Link from "next/link";

const navItems = [
  { href: "/", label: "Workspace" },
  { href: "/login", label: "Login" },
  { href: "/signup", label: "Signup" },
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[rgba(4,10,20,0.72)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-accent)]">
              TO
            </span>
            <div className="space-y-0.5">
              <p className="text-base font-semibold tracking-tight">TradeON</p>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Frontend Lab
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
