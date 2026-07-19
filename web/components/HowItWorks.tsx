"use client";

import { useState } from "react";

const STEPS = [
  { id: "buy", n: "01", t: "Buy below par", d: "A principal token that pays 1.00 at maturity trades at, say, 0.95 today." },
  { id: "hold", n: "02", t: "Hold to maturity", d: "Nothing to watch. The price climbs to 1.00 on a path the contract fixes." },
  { id: "redeem", n: "03", t: "Redeem at par", d: "You get 1.00 back. The gap you bought at was your locked return." },
];

export function HowItWorks() {
  const [on, setOn] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setOn((s) => ({ ...s, [id]: !s[id] }));

  const cardProps = (id: string) => ({
    role: "button" as const,
    tabIndex: 0,
    onClick: () => toggle(id),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(id); }
    },
    className: `card tcard ${on[id] ? "on" : ""}`,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* the three steps */}
      <div className="grid gap-4">
        {STEPS.map((s) => (
          <div key={s.id} {...cardProps(s.id)}>
            <div className="p-6">
              <div className="tcard-n font-mono text-sm text-[var(--brand-1)]">{s.n}</div>
              <div className="mt-2 text-lg font-semibold">{s.t}</div>
              <p className="tcard-muted mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{s.d}</p>
            </div>
          </div>
        ))}
      </div>

      {/* worked example */}
      <div {...cardProps("wx")}>
        <div className="p-6 sm:p-7">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Worked example</span>
            <span className="tcard-muted text-[var(--up)]">180 day tenor</span>
          </div>

          <ParChart on={on.wx} />

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <Cell k="You pay" v="0.95" on={on.wx} />
            <Cell k="Redeems at" v="1.00" on={on.wx} accent />
            <Cell k="Fixed rate" v="10.7%" on={on.wx} />
          </div>

          {/* the fixed rate carry formula, explained */}
          <div className={`mt-5 rounded-xl border p-4 ${on.wx ? "border-white/25 bg-white/10" : "border-[var(--line)] bg-[var(--bg-2)]"}`}>
            <div className="font-mono text-sm">fixed_rate = (1 / price - 1) × (year / tenor)</div>
            <ul className="tcard-muted mt-3 space-y-1.5 text-xs text-[var(--muted)]">
              <li><b className="font-semibold text-[var(--text)]">1 / price - 1</b> is the return over the whole tenor. Pay 0.95, get 1.00, that is 5.3%.</li>
              <li><b className="font-semibold text-[var(--text)]">year / tenor</b> annualizes it. Over 180 days you multiply by about 2.03.</li>
              <li>Result: 10.7% a year, computed on chain the moment you buy, not guessed by the app.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// A clean price-to-par curve. Pink by default; switches to white only when the
// card is toggled pink, so the line stays visible either way. Replaces the old
// candlesticks.
function ParChart({ on }: { on?: boolean }) {
  const c = on ? "#ffffff" : "#ff54c2";
  return (
    <svg viewBox="0 0 300 150" className="mt-4 w-full" fill="none" role="img" aria-label="Principal price climbing from 0.95 to par">
      <defs>
        <linearGradient id="wxfill" x1="0" y1="20" x2="0" y2="132" gradientUnits="userSpaceOnUse">
          <stop stopColor={c} stopOpacity="0.28" />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* par line */}
      <line x1="16" y1="30" x2="284" y2="30" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="3 6" />
      <text x="284" y="24" textAnchor="end" className="font-mono" fontSize="11" fill="#ffffff" opacity="0.7">par 1.00</text>
      {/* area + curve */}
      <path d="M16 120 C 90 116 150 92 216 60 C 250 44 268 36 284 32 L284 132 L16 132 Z" fill="url(#wxfill)" />
      <path d="M16 120 C 90 116 150 92 216 60 C 250 44 268 36 284 32" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
      {/* endpoints */}
      <circle cx="16" cy="120" r="4" fill={c} />
      <text x="22" y="116" className="font-mono" fontSize="11" fill="#ffffff" opacity="0.7">0.95</text>
      <circle cx="284" cy="32" r="4.5" fill={c} />
    </svg>
  );
}

function Cell({ k, v, on, accent }: { k: string; v: string; on?: boolean; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${on ? "border-white/20 bg-white/10" : "border-[var(--line)] bg-[var(--bg-2)]"}`}>
      <div className="tcard-muted text-[11px] text-[var(--muted)]">{k}</div>
      <div className={`mt-0.5 text-lg font-bold ${accent && !on ? "grad-text" : ""}`}>{v}</div>
    </div>
  );
}
