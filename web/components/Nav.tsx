import Link from "next/link";
import { Logo } from "./Logo";

export function Nav({ launch = true }: { launch?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={54} />
          <span className="text-3xl font-bold tracking-tight">Tenor</span>
          <span className="pill ml-1 px-2.5 py-0.5 text-[11px] font-medium text-[var(--muted)]">Testnet</span>
        </Link>

        {launch && (
          <Link href="/app" className="btn-primary rounded-full px-5 py-2.5 text-sm font-semibold">
            Launch app
          </Link>
        )}
      </div>
    </header>
  );
}
