import Link from "next/link";
import { ReactNode } from "react";

type AuthFormShellProps = {
  title: string;
  description: string;
  alternateLabel: string;
  alternateHref: string;
  alternateText: string;
  children: ReactNode;
};

export function AuthFormShell({
  title,
  description,
  alternateLabel,
  alternateHref,
  alternateText,
  children,
}: AuthFormShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(136,189,242,0.18),transparent_32%)]" />

      <div className="w-full max-w-md rounded-[34px] border border-[rgba(106,137,167,0.22)] bg-[linear-gradient(180deg,rgba(245,249,253,0.96),rgba(189,221,252,0.44))] p-6 shadow-[0_28px_72px_rgba(56,73,89,0.14)] sm:p-8">
        <div>
          <div className="mb-8 space-y-3">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
              {title}
            </h2>
            <p className="text-sm leading-7 text-[var(--color-ink-soft)]">
              {description}
            </p>
          </div>

          {children}
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <Link
            href={alternateHref}
            className="rounded-full border border-transparent px-3 py-1.5 text-sm font-medium text-[var(--color-ink-soft)] transition hover:border-[rgba(106,137,167,0.22)] hover:bg-[rgba(245,249,253,0.85)] hover:text-[var(--color-ink)]"
          >
            {alternateText} <span className="text-[var(--color-sky)]">{alternateLabel}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
