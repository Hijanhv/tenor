import Link from "next/link";
import { Logo } from "./Logo";
import { CONFIG } from "@/lib/config";

const IS_MAINNET = CONFIG.network === "mainnet";
// The live mainnet tokenizer, surfaced in the header even while the app demos on testnet.
const MAINNET_CONTRACT =
  "https://stellar.expert/explorer/public/contract/CDZFACPLN7EDI55KU4OOSFWTD56DM4GVAUZJ6CMOUQTFKYUQ2BWFQVZI";

export function Nav({ launch = true }: { launch?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={54} />
          <span className="text-3xl font-bold tracking-tight">Tenor</span>
          <span className="pill ml-1 px-2.5 py-0.5 text-[11px] font-medium text-[var(--muted)]">
            {IS_MAINNET ? "Mainnet" : "Testnet demo"}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {!IS_MAINNET && (
            <a
              href={MAINNET_CONTRACT}
              target="_blank"
              rel="noreferrer"
              className="pill hidden px-2.5 py-1 text-[11px] font-medium text-[var(--brand-1)] sm:inline"
            >
              ● Live on mainnet ↗
            </a>
          )}
          {launch && (
            <Link href="/app" className="btn-primary rounded-full px-5 py-2.5 text-sm font-semibold">
              Launch app
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
