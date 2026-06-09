import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "../../lib/cn";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export function ButtonLink({ href, children, className }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[var(--color-accent-strong)]",
        className,
      )}
    >
      {children}
    </Link>
  );
}
