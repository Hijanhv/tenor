import Link from "next/link";
import { CONFIG, CONTRACTS } from "@/lib/config";
import { shortAddr } from "@/lib/format";

export function Footer() {
  return (
    <footer className="mt-8 border-t border-[var(--line)] bg-[var(--card)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3">
        <div>
          <div className="text-lg font-bold tracking-tight">Tenor</div>
          <p className="mt-2 max-w-xs text-sm text-[var(--muted)]">
            The fixed rate market for Stellar.
          </p>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Deployed on testnet
          </div>
          <ul className="mt-4 space-y-2.5 text-sm">
            {CONTRACTS.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">{c.label}</span>
                <a
                  className="font-mono text-[var(--brand-1)] hover:underline"
                  href={CONFIG.explorer(c.id)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {shortAddr(c.id)}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Links
          </div>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="text-[var(--muted)] hover:text-[var(--text)]" href="/app">Launch app</Link></li>
            <li><Link className="text-[var(--muted)] hover:text-[var(--text)]" href="/analytics">Analytics</Link></li>
            <li><a className="text-[var(--muted)] hover:text-[var(--text)]" href={CONFIG.docs} target="_blank" rel="noreferrer">Docs</a></li>
            <li><a className="text-[var(--muted)] hover:text-[var(--text)]" href={CONFIG.github} target="_blank" rel="noreferrer">GitHub repository</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--line)] py-5 text-center text-xs text-[var(--muted)]">
        Tenor runs on Stellar Testnet. Test assets have no real value.
      </div>
    </footer>
  );
}
