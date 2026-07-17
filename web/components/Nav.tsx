import Link from "next/link";
import { Logo } from "./Logo";
import { CONFIG } from "@/lib/config";

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7 0-.7 0-.7 1.2.1 1.8 1.2 1.8 1.2 1 .1.8 1.7 2.6 1.2.1-.7.4-1.2.7-1.5-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 016 0C17 4.6 18 4.9 18 4.9c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.9 2H22l-7.4 8.5L23 22h-6.8l-5.3-6.9L4.8 22H2l7.9-9L1.4 2h6.9l4.8 6.3L18.9 2zm-2.4 18h1.9L7.6 3.9H5.6L16.5 20z" />
    </svg>
  );
}

export function Nav({ launch = true }: { launch?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={44} />
          <span className="text-2xl font-bold tracking-tight">Tenor</span>
          <span className="pill ml-1 px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]">Testnet</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-[var(--muted)] sm:flex">
          <Link href="/#problem" className="hover:text-[var(--text)]">Problem</Link>
          <Link href="/#how" className="hover:text-[var(--text)]">How it works</Link>
          <Link href="/docs" className="hover:text-[var(--text)]">Docs</Link>
          <a href={CONFIG.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[var(--text)]">
            <GitHubIcon /> GitHub
          </a>
          <a href={CONFIG.twitter} target="_blank" rel="noreferrer" aria-label="Tenor on X" className="hover:text-[var(--text)]">
            <XIcon />
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <a href={CONFIG.twitter} target="_blank" rel="noreferrer" aria-label="Tenor on X" className="text-[var(--muted)] hover:text-[var(--text)] sm:hidden">
            <XIcon />
          </a>
          <a href={CONFIG.github} target="_blank" rel="noreferrer" className="text-[var(--muted)] hover:text-[var(--text)] sm:hidden">
            <GitHubIcon />
          </a>
          {launch && (
            <Link href="/app" className="btn-primary rounded-full px-4 py-2 text-sm font-semibold">
              Launch app
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
