import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { HeroArt } from "@/components/HeroArt";
import { HowItWorks } from "@/components/HowItWorks";
import { YieldSources } from "@/components/YieldSources";
import { CONFIG } from "@/lib/config";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <div className="bg-ambient" />
      <Nav />

      {/* hero */}
      <section className="mx-auto flex min-h-[calc(100vh-72px)] max-w-6xl items-center px-5 py-12">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="animate-rise">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-1)]">
              The fixed rate market for Stellar
            </div>
            <h1 className="mt-5 font-display text-6xl font-semibold leading-[1.0] tracking-tight sm:text-7xl">
              Lock a <span className="font-display italic grad-text">fixed rate</span> on Stellar yield.
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-[var(--muted)]">
              Right now every yield on Stellar floats, so you never really know
              what next week pays. Tenor splits a yield bearing asset into
              principal and yield, and lets you lock a return that is set the
              moment you buy it.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/app" className="btn-primary px-7 py-3.5 text-[15px] font-semibold">
                Launch app
              </Link>
              <a href={CONFIG.docs} target="_blank" rel="noreferrer" className="btn-ghost rounded-full px-7 py-3.5 text-[15px] font-semibold">
                Read the docs
              </a>
            </div>

            <div className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-[var(--line)] pt-7">
              <Pitch t="Lock a rate" d="Buy a guaranteed return." />
              <Pitch t="Trade the rate" d="Go long or short yield." />
              <Pitch t="Automate carry" d="Let a vault run it." />
            </div>
          </div>

          <div className="animate-floaty">
            <HeroArt />
          </div>
        </div>
      </section>

      {/* how fixed rate carry works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-1)]">
          How it works
        </div>
        <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          A fixed rate, carried to maturity
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
          A principal token pays exactly 1.00 at maturity. Today it trades below
          that. Buy it low, hold it, redeem it at par, and the gap is a return
          that was fixed the moment you bought. Tap any card to trace it.
        </p>
        <div className="mt-10">
          <HowItWorks />
        </div>
      </section>

      {/* floating yield sources */}
      <YieldSources />

      {/* faq */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-16">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-1)]">
          FAQ
        </div>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">Questions, answered</h2>
        <div className="mt-8">
          <Faq q="Is the rate really fixed?">
            Yes. When you buy a principal token below par it redeems for exactly
            1.00 at maturity. The difference is your return, and it is set the
            moment you buy, whatever floating rates do afterward.
          </Faq>
          <Faq q="Is this a fixed rate or a fixed yield?">
            A fixed rate. You lock an annualized return for the length of the
            tenor, not an APY that drifts from one week to the next.
          </Faq>
          <Faq q="What happens at maturity?">
            Your principal redeems one for one for the underlying asset. There is
            nothing to manage in between.
          </Faq>
          <Faq q="Where does the yield go?">
            To whoever holds the yield token. If you only want certainty, hold
            principal. If you want a position on the rate, hold yield.
          </Faq>
          <Faq q="What can I earn on?">
            Any yield bearing Stellar asset, such as a Blend position, a DeFindex
            share, or a tokenized treasury. The testnet demo uses a mock yield
            token so a fresh wallet can try it.
          </Faq>
          <Faq q="Is it live?">
            Yes, on Stellar testnet. Every number in the app reads straight from
            the contract.
          </Faq>
        </div>
      </section>

      {/* analytics link */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="card flex flex-col items-start justify-between gap-5 p-8 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-display text-2xl font-semibold tracking-tight">See fixed against floating</h3>
            <p className="mt-2 max-w-md text-[var(--muted)]">
              Live yields across Stellar apps, week by week, next to a locked
              Tenor rate. Real data from DeFiLlama.
            </p>
          </div>
          <Link href="/analytics" className="btn-ghost shrink-0 rounded-full px-6 py-3 text-sm font-semibold">
            Open analytics
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Pitch({ t, d }: { t: string; d: string }) {
  return (
    <div>
      <div className="text-sm font-semibold text-[var(--text)]">{t}</div>
      <div className="mt-1 text-xs text-[var(--muted)]">{d}</div>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="faq">
      <summary>{q}</summary>
      <p>{children}</p>
    </details>
  );
}
