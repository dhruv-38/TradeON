import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[rgba(56,73,89,0.10)] bg-[radial-gradient(circle,rgba(56,73,89,0.12)_1.1px,transparent_1.1px),linear-gradient(180deg,rgba(245,249,253,0.92),rgba(237,245,252,0.86))] [background-size:18px_18px,100%_100%] backdrop-blur-sm">
      <div className="grid w-full grid-cols-[auto_1fr_auto] items-center px-2 py-3 sm:px-4 lg:px-6">
        <Link href="/" className="-ml-2 flex items-center justify-self-start">
          <Image
            src="/tradeon-logo.png"
            alt="TradeON"
            width={1211}
            height={732}
            className="h-[4.8rem] w-auto object-cover object-left lg:h-[5.1rem]"
            style={{ width: "auto" }}
          />
        </Link>

        <Link
          href="/auth/login"
          className="group relative col-start-3 inline-flex items-center justify-center justify-self-end overflow-hidden rounded-full border border-[rgba(106,137,167,0.20)] bg-[rgba(245,249,253,0.72)] px-5 py-2.5 text-sm font-semibold tracking-[0.01em] text-[var(--color-ink-soft)] shadow-[0_8px_24px_rgba(106,137,167,0.08)] transition duration-300 hover:-translate-y-0.5 hover:border-[rgba(106,137,167,0.34)] hover:text-[var(--color-ink)] sm:px-6 sm:py-3 sm:text-base"
        >
          <span className="absolute inset-0 rounded-full bg-[linear-gradient(90deg,rgba(189,221,252,0.58),rgba(136,189,242,0.24))] opacity-0 transition duration-300 group-hover:opacity-100" />
          <span className="absolute bottom-2 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-[var(--color-steel)] transition-all duration-300 group-hover:w-10" />
          <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-sky)] opacity-0 blur-[1px] transition duration-300 group-hover:scale-[7] group-hover:opacity-20" />
          <span className="relative">Login</span>
        </Link>
      </div>
    </header>
  );
}
