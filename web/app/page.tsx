import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CandleChart } from "@/components/CandleChart";
import { LiveRate } from "@/components/LiveRate";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <div className="bg-ambient" />
      <Nav />

      {/* hero */}
      <section className="mx-auto max-w-6xl px-5 pt-16 pb-10 sm:pt-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="animate-rise">
            <LiveRate />
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Lock a <span className="grad-animated">fixed rate</span> on Stellar yield.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-[var(--muted)]">
              Tenor splits any yield bearing asset into a principal token and a
              yield token. Buy principal at a discount and lock a guaranteed
              return, or trade the interest rate on its own. The fixed rate layer
              Stellar was missing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/app" className="btn-primary rounded-full px-6 py-3 font-semibold">Launch app</Link>
              <Link href="/docs" className="btn-ghost rounded-full px-6 py-3 font-semibold">Read the docs</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm text-[var(--muted)]">
              <Stat n="9/9" l="tests passing" />
              <Stat n="0" l="fixed rate rivals on Stellar" />
              <Stat n="~5s" l="settlement" />
            </div>
          </div>

          <div className="card animate-floaty p-6 sm:p-8">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-semibold">Principal token</span>
              <span className="text-[var(--up)]">converging to par →</span>
            </div>
            <CandleChart className="w-full" />
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <Mini label="Buy at" value="0.95" />
              <Mini label="Redeems at" value="1.00" grad />
              <Mini label="Locked" value="fixed" />
            </div>
          </div>
        </div>
      </section>

      {/* problem */}
      <Section id="problem" kicker="The problem" title="Every yield on Stellar is a guess">
        <p>
          Blend, DeFindex, and tokenized treasuries brought real yield to Stellar,
          and real world assets grew more than 100 percent last year. But every
          rate floats. Park stablecoins in a pool and you have no idea what next
          week pays. Eight percent today, three percent next month. No way to lock
          a rate, no way to buy a guaranteed return, no way to take a view on rates.
        </p>
        <p className="mt-4">
          The public Stellar DeFi directory has exchanges, lending, and
          collateralized debt, and <b>zero</b> fixed rate or yield tokenization
          products. The whole interest rate layer of DeFi, the part serious savers
          and institutions need, is empty.
        </p>
      </Section>

      {/* solution + how */}
      <Section id="how" kicker="The solution" title="Split the asset. Fix the rate.">
        <p>
          Give Tenor a yield bearing asset and a maturity. It mints two tokens you
          can hold or trade on their own.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card title="PT · principal" tone="brand">
            Redeems for exactly 1.00 at maturity. Bought below par today, the
            discount is a locked fixed rate. For savers who want certainty.
          </Card>
          <Card title="YT · yield" tone="amber">
            Collects all the yield until maturity. Go long the rate if you think it
            rises, sell it if you think it falls. For traders.
          </Card>
        </div>
        <p className="mt-6 text-sm text-[var(--muted)]">
          One rule ties them together: PT + YT always recombine into the original
          asset. A time decay AMM prices PT so it climbs to par by maturity, which
          keeps the implied fixed rate stable rather than drifting with the clock.
        </p>
      </Section>

      {/* strategy */}
      <Section kicker="The quant strategy" title="Fixed rate carry, automated">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <p>
              A principal token bought at a discount climbs to par by maturity.
              That climb is contractually fixed the moment you buy. The carry vault
              takes one deposit, buys the cheapest principal, holds to maturity,
              and redeems at par. No liquidations, no floating rate risk.
            </p>
            <div className="mt-5 rounded-2xl bg-[var(--bg-2)] p-4 font-mono text-sm">
              fixed_rate = (1 / pt_price − 1) × year / tenor
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">
              The rate is computed inside the contract, not guessed by the app.
            </p>
          </div>
          <img src="/quant-carry.svg" alt="PT converges to par" className="w-full rounded-2xl border border-[var(--line)]" />
        </div>
      </Section>

      {/* why stellar */}
      <Section kicker="Why Stellar needs this" title="A primitive, not another app">
        <p>
          Stellar is betting on real world assets and stablecoin yield. That
          capital does not move for floating, unpredictable returns. It moves for
          fixed rates it can model and hedge. Tenor turns Blend positions,
          DeFindex shares, and tokenized treasuries into fixed rate instruments and
          gives them a yield market, deepening liquidity across all of them.
          Filling the empty interest rate layer is one of the highest leverage
          things that can be built on Stellar right now.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Who title="Savers" body="A real fixed rate on dollars. Lock a number, stop watching APYs." />
          <Who title="Traders" body="The first clean way to go long or short Stellar interest rates." />
          <Who title="Institutions" body="Predictable, hedgeable returns, the precondition for moving size on chain." />
        </div>
      </Section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="card grad-fill overflow-hidden p-10 text-center text-white">
          <h2 className="text-3xl font-bold tracking-tight">Lock your first fixed rate</h2>
          <p className="mx-auto mt-3 max-w-md text-white/85">
            Connect Freighter on testnet, grab test tokens from the faucet, and
            lock a rate in a couple of clicks.
          </p>
          <Link href="/app" className="mt-6 inline-block rounded-full bg-white px-7 py-3 font-semibold text-[var(--brand-1)]">
            Launch the app
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Section({ id, kicker, title, children }: { id?: string; kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-1)]">{kicker}</div>
      <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      <div className="mt-5 max-w-2xl text-lg text-[var(--muted)]">{children}</div>
    </section>
  );
}

function Card({ title, tone, children }: { title: string; tone: "brand" | "amber"; children: React.ReactNode }) {
  return (
    <div className="card card-hover p-6">
      <div className={`text-sm font-bold ${tone === "brand" ? "grad-text" : "text-[var(--accent)]"}`}>{title}</div>
      <p className="mt-2 text-[var(--muted)]">{children}</p>
    </div>
  );
}

function Who({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5">
      <div className="font-semibold">{title}</div>
      <p className="mt-1 text-sm text-[var(--muted)]">{body}</p>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <span className="text-lg font-bold text-[var(--text)]">{n}</span>{" "}
      <span>{l}</span>
    </div>
  );
}

function Mini({ label, value, grad }: { label: string; value: string; grad?: boolean }) {
  return (
    <div className="rounded-xl bg-[var(--bg-2)] p-3">
      <div className="text-[11px] text-[var(--muted)]">{label}</div>
      <div className={`text-lg font-bold ${grad ? "grad-text" : ""}`}>{value}</div>
    </div>
  );
}
