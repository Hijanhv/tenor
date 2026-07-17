"use client";

import { useMemo, useState } from "react";
import { Logo } from "@/components/Logo";
import { useTenor } from "@/lib/useTenor";
import { CONFIG } from "@/lib/config";
import {
  fromUnits,
  toUnits,
  fromScaled,
  pct,
  money,
  shortAddr,
  daysUntil,
} from "@/lib/format";

const FEE = 9970n; // 1 - 0.30%

export default function Page() {
  const t = useTenor();
  const m = t.market;

  const days = m ? daysUntil(Number(m.maturity)) : 0;
  const ptPriceNum = fromScaled(t.ptPrice || 0n);
  const periodReturn = ptPriceNum > 0 ? (1 - ptPriceNum) / ptPriceNum : 0;
  const tvl = m
    ? fromUnits(m.reserve_quote) + fromUnits(m.reserve_pt) * ptPriceNum
    : 0;

  return (
    <div className="min-h-screen">
      <Header t={t} />

      {t.wrongNetwork && (
        <Banner text="Your wallet is not on Testnet. Switch Freighter to the Test network to trade." />
      )}
      {t.error && <Banner text={t.error} tone="error" />}
      {t.lastTx && (
        <Banner
          tone="ok"
          text={`Confirmed on testnet: ${t.lastTx.slice(0, 10)}…`}
          href={`https://stellar.expert/explorer/testnet/tx/${t.lastTx}`}
        />
      )}

      <main className="mx-auto max-w-5xl px-5 pb-24">
        {/* Hero */}
        <section className="pt-12 pb-8 text-center">
          <p className="pill mx-auto mb-5 inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Live on Stellar Testnet
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Lock a <span className="grad-text">fixed rate</span> on Stellar yield
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
            Tenor splits any yield bearing asset into a Principal token and a Yield
            token. Buy principal at a discount and lock a guaranteed return, or
            trade the interest rate on its own.
          </p>
        </section>

        {/* Live market */}
        <section className="card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-slate-500">Market</div>
              <div className="mt-1 text-lg font-semibold">
                TSY · {days} day tenor
              </div>
              <div className="text-sm text-slate-400">
                matures in {days} days
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 text-right">
              <Metric
                label="Fixed rate"
                value={m ? pct(t.fixedRate) : "…"}
                sub="APR"
                accent
              />
              <Metric
                label="PT price"
                value={m ? ptPriceNum.toFixed(4) : "…"}
                sub={`+${(periodReturn * 100).toFixed(2)}% at maturity`}
              />
              <Metric
                label="Pool liquidity"
                value={m ? `$${money(tvl, 0)}` : "…"}
                sub="TSY · USDC"
              />
            </div>
          </div>
          <SplitBar />
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <EarnFixed t={t} periodReturn={periodReturn} days={days} />
          <Portfolio t={t} />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Split t={t} />
          <Faucet t={t} />
        </div>

        <Strategy t={t} rate={m ? pct(t.fixedRate) : "…"} />
      </main>

      <Footer />
    </div>
  );
}

type T = ReturnType<typeof useTenor>;

function Header({ t }: { t: T }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-xl font-bold tracking-tight">Tenor</span>
          <span className="pill ml-2 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            Testnet
          </span>
        </div>
        {t.address ? (
          <span className="pill px-3 py-1.5 text-sm font-medium text-slate-700">
            {shortAddr(t.address)}
          </span>
        ) : (
          <button
            onClick={t.connect}
            className="btn-primary rounded-full px-4 py-2 text-sm font-semibold"
          >
            Connect wallet
          </button>
        )}
      </div>
    </header>
  );
}

function Metric({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-400">{label}</div>
      <div
        className={`text-2xl font-bold ${accent ? "grad-text" : "text-slate-800"}`}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}

// The visual: one bar of yield bearing asset splitting into PT + YT.
function SplitBar() {
  return (
    <div className="mt-7">
      <div className="mb-2 flex justify-between text-xs font-medium text-slate-400">
        <span>1 yield bearing asset</span>
        <span>splits into</span>
      </div>
      <div className="flex gap-2">
        <div className="grad-fill h-3 flex-1 rounded-l-full opacity-90" />
        <div className="h-3 flex-1 rounded-r-full bg-amber-400 opacity-90" />
      </div>
      <div className="mt-2 flex justify-between text-xs font-medium">
        <span className="grad-text">PT · fixed principal</span>
        <span className="text-amber-500">YT · the yield</span>
      </div>
    </div>
  );
}

function EarnFixed({
  t,
  periodReturn,
  days,
}: {
  t: T;
  periodReturn: number;
  days: number;
}) {
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
  const disabled =
    !t.address || !preview || t.busy !== null || insufficient || t.wrongNetwork;

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold">Earn a fixed rate</h2>
      <p className="mt-1 text-sm text-slate-500">
        Pay USDC now, receive principal tokens that each redeem for 1.00 at
        maturity. The discount is your locked return.
      </p>

      <div className="field mt-5 flex items-center gap-3 px-4 py-3">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          inputMode="decimal"
          className="w-full bg-transparent text-2xl font-semibold outline-none"
          placeholder="0"
        />
        <span className="shrink-0 text-sm font-medium text-slate-500">USDC</span>
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-400">
        <span>Balance {money(usdc)} USDC</span>
        <button
          className="font-medium text-indigo-600"
          onClick={() => setAmount(usdc ? String(usdc) : "0")}
        >
          max
        </button>
      </div>

      {preview && (
        <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm">
          <Row label="You receive" value={`${money(preview.receive)} PT`} />
          <Row
            label="Locked gain at maturity"
            value={`+${money(preview.gain)} USDC`}
            good
          />
          <Row label="Effective fixed rate" value={`${(preview.apr * 100).toFixed(2)}% APR`} strong />
        </div>
      )}

      <button
        disabled={disabled}
        onClick={() => t.actions.buyPt(toUnits(amount))}
        className="btn-primary mt-5 w-full rounded-xl py-3 font-semibold"
      >
        {t.busy === "buy" ? "Locking…" : insufficient ? "Not enough USDC" : "Lock fixed rate"}
      </button>
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
        <p className="mt-3 text-sm text-slate-500">
          Connect your wallet to see balances.
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Holding label="USDC" value={money(fromUnits(b.usdc))} />
            <Holding label="TSY" value={money(fromUnits(b.sy))} />
            <Holding label="PT · principal" value={money(fromUnits(b.pt))} grad />
            <Holding label="YT · yield" value={money(fromUnits(b.yt))} amber />
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
            <div>
              <div className="text-xs text-slate-400">Claimable yield</div>
              <div className="text-lg font-semibold">
                {money(fromUnits(b.pending))}{" "}
                <span className="text-sm text-slate-400">asset units</span>
              </div>
            </div>
            <button
              disabled={t.busy !== null || b.pending <= 0n}
              onClick={t.actions.claim}
              className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold"
            >
              {t.busy === "claim" ? "Claiming…" : "Claim"}
            </button>
          </div>

          {matured && b.pt > 0n && (
            <button
              disabled={t.busy !== null}
              onClick={() => t.actions.redeem(b.pt)}
              className="mt-3 w-full rounded-xl border border-[var(--line)] py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
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
      <h2 className="text-lg font-semibold">Split yield (advanced)</h2>
      <p className="mt-1 text-sm text-slate-500">
        Deposit the yield bearing asset to mint equal PT and YT. Recombine any
        time: PT + YT always equals the original.
      </p>
      <div className="field mt-5 flex items-center gap-3 px-4 py-3">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          inputMode="decimal"
          className="w-full bg-transparent text-2xl font-semibold outline-none"
          placeholder="0"
        />
        <span className="shrink-0 text-sm font-medium text-slate-500">TSY</span>
      </div>
      <div className="mt-2 text-xs text-slate-400">Balance {money(sy)} TSY</div>
      <button
        disabled={!t.address || t.busy !== null || insufficient || parseFloat(amount || "0") <= 0}
        onClick={() => t.actions.deposit(toUnits(amount))}
        className="btn-primary mt-4 w-full rounded-xl py-3 font-semibold"
      >
        {t.busy === "deposit" ? "Splitting…" : "Split into PT + YT"}
      </button>
    </div>
  );
}

function Faucet({ t }: { t: T }) {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold">Test faucet</h2>
      <p className="mt-1 text-sm text-slate-500">
        Grab testnet tokens to try the flow. No real value, testnet only.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          disabled={!t.address || t.busy !== null}
          onClick={t.actions.faucetUsdc}
          className="rounded-xl border border-[var(--line)] py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {t.busy === "faucet-usdc" ? "Minting…" : "Get 1,000 USDC"}
        </button>
        <button
          disabled={!t.address || t.busy !== null}
          onClick={t.actions.faucetSy}
          className="rounded-xl border border-[var(--line)] py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {t.busy === "faucet-sy" ? "Minting…" : "Get 1,000 TSY"}
        </button>
      </div>
      {!t.address && (
        <p className="mt-3 text-xs text-slate-400">Connect a wallet first.</p>
      )}
    </div>
  );
}

function Strategy({ t, rate }: { t: T; rate: string }) {
  return (
    <section className="card mt-6 overflow-hidden">
      <div className="grid md:grid-cols-2">
        <div className="p-6 sm:p-8">
          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            The quant strategy
          </div>
          <h2 className="mt-2 text-xl font-semibold">Fixed rate carry</h2>
          <p className="mt-2 text-sm text-slate-500">
            A principal token bought below par climbs back to 1.00 by maturity.
            That climb is a known, funded return. The strategy buys the cheapest
            principal token, holds to maturity, and books the convergence as a
            locked fixed yield. No liquidations, no floating rate risk.
          </p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="grad-text text-3xl font-bold">{rate}</span>
            <span className="text-sm text-slate-400">locked, right now</span>
          </div>
          <button
            disabled={!t.address || t.busy !== null || t.balances.usdc <= 0n}
            onClick={() => t.actions.buyPt(t.balances.usdc)}
            className="btn-primary mt-5 rounded-xl px-5 py-3 text-sm font-semibold"
          >
            {t.busy === "buy" ? "Locking…" : "Run the carry with my USDC"}
          </button>
        </div>
        <div className="flex items-center justify-center bg-slate-50 p-8">
          <CarryDiagram />
        </div>
      </div>
    </section>
  );
}

// Animated: PT price converging to par (1.00) over the tenor.
function CarryDiagram() {
  return (
    <svg viewBox="0 0 260 160" className="w-full max-w-sm">
      <line x1="30" y1="130" x2="240" y2="130" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="30" y1="30" x2="30" y2="130" stroke="#cbd5e1" strokeWidth="1" />
      <text x="6" y="34" fontSize="9" fill="#94a3b8">1.00</text>
      <text x="6" y="118" fontSize="9" fill="#94a3b8">0.95</text>
      <line x1="30" y1="30" x2="240" y2="30" stroke="#e2e8f0" strokeDasharray="3 3" />
      <path
        d="M30 118 C110 108 190 60 240 30"
        fill="none"
        stroke="url(#cg)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="320"
        strokeDashoffset="320"
      >
        <animate attributeName="stroke-dashoffset" from="320" to="0" dur="2.2s" repeatCount="indefinite" />
      </path>
      <circle r="4" fill="#4F46E5">
        <animateMotion dur="2.2s" repeatCount="indefinite" path="M30 118 C110 108 190 60 240 30" />
      </circle>
      <defs>
        <linearGradient id="cg" x1="30" y1="130" x2="240" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <text x="120" y="150" fontSize="9" fill="#94a3b8">buy → hold → maturity</text>
    </svg>
  );
}

function Row({
  label,
  value,
  good,
  strong,
}: {
  label: string;
  value: string;
  good?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span
        className={
          good
            ? "font-semibold text-emerald-600"
            : strong
            ? "font-semibold text-slate-800"
            : "font-medium text-slate-700"
        }
      >
        {value}
      </span>
    </div>
  );
}

function Holding({
  label,
  value,
  grad,
  amber,
}: {
  label: string;
  value: string;
  grad?: boolean;
  amber?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div
        className={`text-lg font-semibold ${
          grad ? "grad-text" : amber ? "text-amber-500" : "text-slate-800"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Banner({
  text,
  tone = "warn",
  href,
}: {
  text: string;
  tone?: "warn" | "error" | "ok";
  href?: string;
}) {
  const tones = {
    warn: "bg-amber-50 text-amber-800 border-amber-200",
    error: "bg-rose-50 text-rose-700 border-rose-200",
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const body = (
    <div className={`border-b ${tones[tone]} px-5 py-2 text-center text-sm`}>
      {text}
      {href && <span className="ml-2 underline">view</span>}
    </div>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer">
      {body}
    </a>
  ) : (
    body
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-5 py-8 text-center text-sm text-slate-400">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1">
          <a className="hover:text-slate-600" href={CONFIG.explorer(CONFIG.tokenizer)} target="_blank" rel="noreferrer">
            Tokenizer contract
          </a>
          <a className="hover:text-slate-600" href="https://github.com/Hijanhv/tenor" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <span>Stellar Testnet</span>
        </div>
        <p>Tenor · the fixed rate market for Stellar.</p>
      </div>
    </footer>
  );
}
