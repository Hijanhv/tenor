import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CONFIG, CONTRACTS } from "@/lib/config";

export const metadata: Metadata = {
  title: "Docs — Tenor",
  description: "How Tenor works: principal and yield tokens, the time decay AMM, the carry vault, and the deployed contracts.",
};

export default function Docs() {
  return (
    <div className="min-h-screen">
      <div className="bg-ambient" />
      <Nav />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="text-4xl font-bold tracking-tight">Docs</h1>
        <p className="mt-3 text-lg text-[var(--muted)]">
          Tenor is a fixed rate protocol on Stellar. It splits a yield bearing
          asset into a principal token and a yield token, prices them with a time
          decay AMM, and runs a carry vault on top. Everything below is live on
          Stellar Testnet.
        </p>

        <H id="concepts">Core concepts</H>
        <Table rows={[
          ["SY", "The yield bearing underlying, for example a Blend pool token or a tokenized T-bill. In the demo it is a mock token called TSY."],
          ["PT", "Principal token. Redeems for exactly 1.00 of the asset at maturity. Bought below par, the discount is a locked fixed rate."],
          ["YT", "Yield token. Collects all the yield the SY earns until maturity. A pure position on the interest rate."],
          ["Invariant", "PT(x) + YT(x) = x. Principal plus yield always recombine into the original asset."],
        ]} />

        <H id="use">How to use it</H>
        <ol className="mt-3 list-decimal space-y-3 pl-5 text-[var(--muted)]">
          <li><b className="text-[var(--text)]">Lock a fixed rate.</b> Buy PT with USDC. It redeems for 1.00 at maturity, so the discount you pay is your guaranteed return.</li>
          <li><b className="text-[var(--text)]">Trade the yield.</b> Split SY into PT and YT, then hold or sell YT to express a view on where rates go.</li>
          <li><b className="text-[var(--text)]">Provide liquidity.</b> Seed the PT and USDC pool and earn swap fees on a market that did not exist before.</li>
          <li><b className="text-[var(--text)]">Run the carry vault.</b> Deposit USDC once. The vault buys discounted PT, holds to maturity, redeems at par, and hands you the locked return.</li>
        </ol>

        <H id="amm">Time decay AMM</H>
        <p className="mt-3 text-[var(--muted)]">
          The pool prices PT against a stable token, with a pull to par curve. As
          the tenor elapses, an effective reserve grows so the PT price climbs
          toward 1.00 by maturity. This keeps the implied fixed rate stable over
          time instead of drifting with the clock, and it means principal cannot be
          worth less than par at settlement.
        </p>

        <H id="carry">The carry strategy</H>
        <p className="mt-3 text-[var(--muted)]">
          The rate is computed on chain from the PT price and time to maturity:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-2xl bg-[var(--bg-2)] p-4 font-mono text-sm">
{`fixed_rate = (1 / pt_price - 1) * (seconds_per_year / seconds_to_maturity)`}
        </pre>
        <img src="/quant-carry.svg" alt="PT converges to par by maturity" className="mt-4 w-full rounded-2xl border border-[var(--line)]" />

        <H id="contracts">Deployed contracts</H>
        <p className="mt-3 text-[var(--muted)]">All on Stellar Testnet. The app reads every value straight from these.</p>
        <div className="mt-3 space-y-2">
          {CONTRACTS.map((c) => (
            <a key={c.id} href={CONFIG.explorer(c.id)} target="_blank" rel="noreferrer"
              className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 hover:bg-[var(--bg-2)]">
              <div>
                <div className="font-medium">{c.label}</div>
                <div className="text-xs text-[var(--muted)]">{c.note}</div>
              </div>
              <span className="font-mono text-xs text-[var(--brand-1)] break-all">{c.id}</span>
            </a>
          ))}
        </div>

        <H id="setup">Testnet setup</H>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[var(--muted)]">
          <li>Install the Freighter wallet and switch it to the Test network.</li>
          <li>Open the app and connect. Use the faucet to mint test USDC and TSY.</li>
          <li>Lock a fixed rate, split yield, or deposit into the carry vault.</li>
        </ol>

        <H id="links">Source</H>
        <p className="mt-3 text-[var(--muted)]">
          The full protocol, contracts, and tests are open source on{" "}
          <a className="text-[var(--brand-1)] hover:underline" href={CONFIG.github} target="_blank" rel="noreferrer">GitHub</a>.
        </p>
      </main>
      <Footer />
    </div>
  );
}

function H({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="mt-10 scroll-mt-20 text-2xl font-bold tracking-tight">{children}</h2>;
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <div className="mt-3 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--card)]">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[80px_1fr] gap-3 p-4">
          <div className="font-mono font-semibold text-[var(--brand-1)]">{k}</div>
          <div className="text-sm text-[var(--muted)]">{v}</div>
        </div>
      ))}
    </div>
  );
}
