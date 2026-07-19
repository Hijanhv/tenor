"use client";

import { useMemo, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { useTenor } from "@/lib/useTenor";
import { CONFIG, CONTRACTS } from "@/lib/config";
import {
  fromUnits,
  toUnits,
  fromScaled,
  pct,
  money,
  shortAddr,
  daysUntil,
} from "@/lib/format";

const FEE = 9970n;
type T = ReturnType<typeof useTenor>;

export default function AppPage() {
  const t = useTenor();
  const m = t.market;
  const days = m ? daysUntil(Number(m.maturity)) : 0;
  const ptPriceNum = fromScaled(t.ptPrice || 0n);
  const periodReturn = ptPriceNum > 0 ? (1 - ptPriceNum) / ptPriceNum : 0;
  const tvl = m ? fromUnits(m.reserve_quote) + fromUnits(m.reserve_pt) * ptPriceNum : 0;
  const prog = fromScaled(t.progress || 0n);

  return (
    <div className="min-h-screen">
      <div className="bg-ambient" />
      <Nav launch={false} />

      {t.wrongNetwork && <Banner text="Your wallet is not on Testnet. Switch Freighter to the Test network." />}
      {t.error && <Banner text={t.error} tone="error" />}
      {t.lastTx && (
        <Banner tone="ok" text={`Confirmed on testnet: ${t.lastTx.slice(0, 12)}…`}
          href={`https://stellar.expert/explorer/testnet/tx/${t.lastTx}`} />
      )}

      <main className="mx-auto max-w-5xl px-5 pb-24 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Fixed rate market</h1>
            <p className="text-sm text-[var(--muted)]">Live on Stellar Testnet, reading straight from the contract.</p>
          </div>
          <WalletButton t={t} />
        </div>

        {/* live market */}
        <section className="card animate-rise p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="dot-live" />
              <div>
                <div className="text-sm font-medium text-[var(--muted)]">TSY market</div>
                <div className="text-lg font-semibold">{days} day tenor</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 text-right">
              <Metric label="Fixed rate" value={m ? pct(t.fixedRate) : "…"} sub="APR" accent />
              <Metric label="PT price" value={m ? ptPriceNum.toFixed(4) : "…"} sub={`+${(periodReturn * 100).toFixed(2)}% at maturity`} />
              <Metric label="Pool liquidity" value={m ? `$${money(tvl, 0)}` : "…"} sub="TSY · USDC" />
            </div>
          </div>
          {/* time progress toward maturity */}
          <div className="mt-6">
            <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
              <span>issued</span><span>{(prog * 100).toFixed(1)}% through tenor</span><span>maturity</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-2)]">
              <div className="grad-fill h-full rounded-full transition-all" style={{ width: `${Math.max(2, prog * 100)}%` }} />
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <EarnFixed t={t} days={days} />
          <CarryVault t={t} rate={m ? pct(t.fixedRate) : "…"} />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Portfolio t={t} />
          <div className="grid gap-6">
            <Split t={t} />
            <Faucet t={t} />
          </div>
        </div>

        <OnChain />
      </main>
      <Footer />
    </div>
  );
}

function EarnFixed({ t, days }: { t: T; days: number }) {
  const [amount, setAmount] = useState("100");
  const m = t.market;
  const preview = useMemo(() => {
    const inUnits = toUnits(amount);
    if (!m || inUnits <= 0n || m.reserve_quote <= 0n) return null;
    const dx = (inUnits * FEE) / 10000n;
    const ptOut = (m.reserve_pt * dx) / (m.reserve_quote + dx);
    const paid = fromUnits(inUnits);
    const receive = fromUnits(ptOut);
    const gain = receive - paid;
    const apr = days > 0 && paid > 0 ? (gain / paid) * (365 / days) : 0;
    return { receive, gain, apr };
  }, [amount, m, days]);
  const usdc = fromUnits(t.balances.usdc);
  const insufficient = parseFloat(amount || "0") > usdc;
  const disabled = !t.address || !preview || t.busy !== null || insufficient || t.wrongNetwork;

  return (
    <div className="card card-hover p-6">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-1)]">Save</div>
      <h2 className="mt-1 text-lg font-semibold">Earn a fixed rate</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Pay USDC now, receive principal that redeems for 1.00 at maturity. The discount is your locked return.</p>
      <div className="field mt-5 flex items-center gap-3 px-4 py-3">
        <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          inputMode="decimal" className="w-full bg-transparent text-2xl font-semibold outline-none" placeholder="0" />
        <span className="shrink-0 text-sm font-medium text-[var(--muted)]">USDC</span>
      </div>
      <div className="mt-2 flex justify-between text-xs text-[var(--muted)]">
        <span>Balance {money(usdc)} USDC</span>
        <button className="font-medium text-[var(--brand-1)]" onClick={() => setAmount(usdc ? String(usdc) : "0")}>max</button>
      </div>
      {preview && (
        <div className="mt-4 space-y-2 rounded-2xl bg-[var(--bg-2)] p-4 text-sm">
          <Row label="You receive" value={`${money(preview.receive)} PT`} />
          <Row label="Locked gain at maturity" value={`+${money(preview.gain)} USDC`} good />
          <Row label="Effective fixed rate" value={`${(preview.apr * 100).toFixed(2)}% APR`} strong />
        </div>
      )}
      <button disabled={disabled} onClick={() => t.actions.buyPt(toUnits(amount))} className="btn-primary mt-5 w-full rounded-xl py-3 font-semibold">
        {t.busy === "buy" ? "Locking…" : insufficient ? "Not enough USDC" : "Lock fixed rate"}
      </button>
    </div>
  );
}

function CarryVault({ t, rate }: { t: T; rate: string }) {
  const [amount, setAmount] = useState("100");
  const v = t.vault;
  const usdc = fromUnits(t.balances.usdc);
  const insufficient = parseFloat(amount || "0") > usdc;
  const nav = v ? fromUnits(v.nav_quote) : 0;
  const yours = fromUnits(t.vaultShares);
  return (
    <div className="card card-hover p-6">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">Quant strategy</div>
      <h2 className="mt-1 text-lg font-semibold">Fixed rate carry vault</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">One deposit. The vault buys discounted principal, holds to maturity, and redeems at par. The carry, automated.</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Vault size" value={`$${money(nav, 0)}`} />
        <Stat label="Locked rate" value={rate} grad />
        <Stat label="Your shares" value={money(yours)} />
        <Stat label="Status" value={v?.settled ? "settled" : "earning"} />
      </div>

      <div className="field mt-4 flex items-center gap-3 px-4 py-3">
        <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          inputMode="decimal" className="w-full bg-transparent text-xl font-semibold outline-none" placeholder="0" />
        <span className="shrink-0 text-sm font-medium text-[var(--muted)]">USDC</span>
      </div>
      <div className="mt-3 flex gap-3">
        <button disabled={!t.address || t.busy !== null || insufficient || parseFloat(amount || "0") <= 0}
          onClick={() => t.actions.vaultDeposit(toUnits(amount))} className="btn-primary flex-1 rounded-xl py-3 font-semibold">
          {t.busy === "vault-deposit" ? "Depositing…" : "Deposit to vault"}
        </button>
        {v?.settled && (
          <button disabled={t.busy !== null || t.vaultShares <= 0n} onClick={t.actions.vaultClaim} className="btn-ghost rounded-xl px-4 py-3 text-sm font-semibold">
            {t.busy === "vault-claim" ? "Claiming…" : "Claim"}
          </button>
        )}
      </div>
    </div>
  );
}

function Portfolio({ t }: { t: T }) {
  const b = t.balances;
  const matured = t.market?.matured;
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold">Your position</h2>
      {!t.address ? (
        <p className="mt-3 text-sm text-[var(--muted)]">Connect your wallet to see balances.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="USDC" value={money(fromUnits(b.usdc))} />
            <Stat label="TSY" value={money(fromUnits(b.sy))} />
            <Stat label="PT · principal" value={money(fromUnits(b.pt))} grad />
            <Stat label="YT · yield" value={money(fromUnits(b.yt))} amber />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-[var(--bg-2)] p-4">
            <div>
              <div className="text-xs text-[var(--muted)]">Claimable yield</div>
              <div className="text-lg font-semibold">{money(fromUnits(b.pending))}</div>
            </div>
            <button disabled={t.busy !== null || b.pending <= 0n} onClick={t.actions.claim} className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold">
              {t.busy === "claim" ? "Claiming…" : "Claim yield"}
            </button>
          </div>
          {matured && b.pt > 0n && (
            <button disabled={t.busy !== null} onClick={() => t.actions.redeem(b.pt)} className="btn-ghost mt-3 w-full rounded-xl py-2.5 text-sm font-semibold">
              {t.busy === "redeem" ? "Redeeming…" : "Redeem PT at par"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function Split({ t }: { t: T }) {
  const [amount, setAmount] = useState("100");
  const sy = fromUnits(t.balances.sy);
  const insufficient = parseFloat(amount || "0") > sy;
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold">Split yield</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Deposit the yield asset to mint equal PT and YT. Recombine any time.</p>
      <div className="field mt-4 flex items-center gap-3 px-4 py-3">
        <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          inputMode="decimal" className="w-full bg-transparent text-xl font-semibold outline-none" placeholder="0" />
        <span className="shrink-0 text-sm font-medium text-[var(--muted)]">TSY</span>
      </div>
      <div className="mt-2 text-xs text-[var(--muted)]">Balance {money(sy)} TSY</div>
      <button disabled={!t.address || t.busy !== null || insufficient || parseFloat(amount || "0") <= 0}
        onClick={() => t.actions.deposit(toUnits(amount))} className="btn-primary mt-4 w-full rounded-xl py-3 font-semibold">
        {t.busy === "deposit" ? "Splitting…" : "Split into PT + YT"}
      </button>
    </div>
  );
}

function Faucet({ t }: { t: T }) {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold">Test faucet</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Grab testnet tokens to try it. No real value.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button disabled={!t.address || t.busy !== null} onClick={t.actions.faucetUsdc} className="btn-ghost rounded-xl py-3 text-sm font-semibold">
          {t.busy === "faucet-usdc" ? "Minting…" : "1,000 USDC"}
        </button>
        <button disabled={!t.address || t.busy !== null} onClick={t.actions.faucetSy} className="btn-ghost rounded-xl py-3 text-sm font-semibold">
          {t.busy === "faucet-sy" ? "Minting…" : "1,000 TSY"}
        </button>
      </div>
    </div>
  );
}

function OnChain() {
  return (
    <section className="card mt-6 p-6">
      <h2 className="text-lg font-semibold">On chain</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Every value on this page is read live from these testnet contracts.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {CONTRACTS.map((c) => (
          <a key={c.id} href={CONFIG.explorer(c.id)} target="_blank" rel="noreferrer" className="rounded-2xl border border-[var(--line)] p-4 hover:bg-[var(--bg-2)]">
            <div className="text-xs text-[var(--muted)]">{c.label}</div>
            <div className="mt-1 font-mono text-sm text-[var(--brand-1)]">{shortAddr(c.id)}</div>
          </a>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-xs font-medium text-[var(--muted)]">{label}</div>
      <div className={`text-2xl font-bold ${accent ? "grad-text" : ""}`}>{value}</div>
      {sub && <div className="text-[11px] text-[var(--muted)]">{sub}</div>}
    </div>
  );
}

function Stat({ label, value, grad, amber }: { label: string; value: string; grad?: boolean; amber?: boolean }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] p-3">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className={`text-lg font-semibold ${grad ? "grad-text" : amber ? "text-[var(--accent)]" : ""}`}>{value}</div>
    </div>
  );
}

function Row({ label, value, good, strong }: { label: string; value: string; good?: boolean; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--muted)]">{label}</span>
      <span className={good ? "font-semibold text-[var(--up)]" : strong ? "font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}

function WalletButton({ t }: { t: T }) {
  const [open, setOpen] = useState(false);

  if (!t.address) {
    return (
      <button onClick={t.connect} className="btn-primary rounded-full px-4 py-2 text-sm font-semibold">
        Connect wallet
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="pill flex items-center gap-2 px-3 py-1.5 text-sm font-medium"
      >
        <span className={t.wrongNetwork ? "h-2 w-2 rounded-full bg-[var(--down)]" : "dot-live"} />
        {shortAddr(t.address)}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-64 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-2 shadow-xl">
            <div className="px-3 pt-2 text-[11px] uppercase tracking-wide text-[var(--muted)]">Connected wallet</div>
            <div className="break-all px-3 pb-2 pt-1 font-mono text-xs text-[var(--text)]">{t.address}</div>
            {t.wrongNetwork && (
              <div className="mx-1 mb-1 rounded-lg bg-[var(--bg-2)] px-3 py-2 text-xs text-[var(--down)]">
                Wallet is not on Testnet. Switch Freighter to the Test network.
              </div>
            )}
            <button
              onClick={() => { t.disconnect(); setOpen(false); }}
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-[var(--bg-2)]"
            >
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Banner({ text, tone = "warn", href }: { text: string; tone?: "warn" | "error" | "ok"; href?: string }) {
  const tones = {
    warn: "bg-amber-50 text-amber-800 border-amber-200",
    error: "bg-rose-50 text-rose-700 border-rose-200",
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const body = <div className={`border-b ${tones[tone]} px-5 py-2 text-center text-sm`}>{text}{href && <span className="ml-2 underline">view</span>}</div>;
  return href ? <a href={href} target="_blank" rel="noreferrer">{body}</a> : body;
}
