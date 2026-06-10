import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "../components/site-header";

export default function HomePage() {
  return (
    <main className="h-screen overflow-hidden">
      <SiteHeader />

      <section className="mx-auto flex h-[calc(100vh-88px)] max-w-7xl items-center justify-center px-6 py-12 lg:px-10">
        <div className="relative w-full overflow-hidden rounded-[42px] border border-[var(--color-line)] bg-[rgba(245,249,253,0.82)] px-6 py-18 shadow-[0_30px_80px_rgba(106,137,167,0.16)] sm:px-10 lg:px-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(136,189,242,0.16),transparent_34%)]" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Image
              src="/tradeon-logo.png"
              alt=""
              width={1211}
              height={732}
              className="h-auto w-[min(78vw,760px)] opacity-[0.10] saturate-75"
              loading="eager"
              priority
            />
          </div>

          <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
            <div className="space-y-5">
              <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] sm:text-6xl lg:text-7xl">
                Trade Smarter. Move Faster.
              </h1>
              <p className="mx-auto max-w-2xl text-lg leading-8 text-[var(--color-ink-soft)] sm:text-xl">
                A trading workspace built for confident execution, sharper
                decisions, and a faster flow from idea to action.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/auth/login"
                className="group inline-flex min-w-48 items-center justify-center rounded-full border border-[rgba(56,73,89,0.12)] bg-[linear-gradient(135deg,var(--color-ink-soft),var(--color-ink))] px-2 py-2 shadow-[0_18px_38px_rgba(56,73,89,0.20)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(56,73,89,0.26)]"
                style={{ color: "#ffffff" }}
              >
                <span
                  className="inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0))] px-10 py-3 text-base font-semibold tracking-[0.02em] text-white"
                  style={{ color: "#ffffff" }}
                >
                  Trade
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
