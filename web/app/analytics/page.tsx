import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { YieldChart } from "@/components/YieldChart";
import { getYields } from "@/lib/yields";

export const metadata: Metadata = {
  title: "Yield analytics · Tenor",
  description: "Live Stellar yields against a Tenor fixed rate, from DeFiLlama.",
};

export const revalidate = 3600;

export default async function Analytics() {
  const data = await getYields();

  const floating = data.series.flatMap((s) => s.data);
  const low = Math.min(...floating);
  const high = Math.max(...floating);
  const swing = avg(data.series.map((s) => range(s.data))) / 2;
  const averages = [
    { name: data.fixed.name, value: data.fixed.value, color: data.fixed.color, note: "locked, no drift" },
    ...data.series.map((s) => ({ name: s.name, value: +avg(s.data).toFixed(2), color: s.color, note: "floating" })),
  ];
  const max = Math.max(...averages.map((a) => a.value)) * 1.1;
  const asOf = data.asOf ? new Date(data.asOf).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;

  return (
    <div className="min-h-screen">
      <div className="bg-ambient" />
      <Nav />

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-10">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-1)]">Analytics</div>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Fixed against floating, over time
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
          Yields on Stellar move every week. A Tenor rate does not. Below is how
          the biggest yield sources on Stellar have actually moved, and where a
          rate you could lock sits against them.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 pill px-3 py-1.5 text-xs text-[var(--muted)]">
          <span className="dot-live" />
          {data.live ? (
            <>Live from DeFiLlama{asOf ? `, updated ${asOf}` : ""}. Refreshes hourly.</>
          ) : (
            <>Showing the last cached reading from DeFiLlama.</>
          )}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile k="Tenor fixed rate" v={`${data.fixed.value.toFixed(2)}%`} sub="lock and hold" accent />
          <Tile k="Floating low" v={`${low.toFixed(2)}%`} sub="lowest week, 12 weeks" />
          <Tile k="Floating high" v={`${high.toFixed(2)}%`} sub="highest week, 12 weeks" />
          <Tile k="Weekly swing" v={`±${swing.toFixed(1)}%`} sub="avg across sources" />
        </div>

        <section className="card mt-6 p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Weekly APY across Stellar yield sources</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            The pink line is a Tenor fixed rate. The rest float. Hover to read any week.
          </p>
          <div className="mt-6">
            <YieldChart data={data} />
          </div>
        </section>

        <section className="card mt-6 p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Average APY over the window</h2>
          <div className="mt-6 space-y-4">
            {averages.map((a) => (
              <div key={a.name} className="grid grid-cols-[130px_1fr_auto] items-center gap-4">
                <div className="text-sm">
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-[var(--muted)]">{a.note}</div>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[var(--bg-2)]">
                  <div className="h-full rounded-full" style={{ width: `${(a.value / max) * 100}%`, background: a.color }} />
                </div>
                <div className="w-14 text-right font-mono font-semibold">{a.value.toFixed(1)}%</div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-[var(--muted)]">
            Floating sources beat the fixed rate in some weeks and trail it in
            others. The point of a fixed rate is not to always win. It is to know
            the number in advance.
          </p>
        </section>

        <p className="mt-6 text-xs text-[var(--muted)]">
          Source: DeFiLlama Yields, Stellar pools (Blend, Ondo). The Tenor fixed
          line shows the current lockable rate held flat.
        </p>
      </main>
      <Footer />
    </div>
  );
}

function Tile({ k, v, sub, accent }: { k: string; v: string; sub: string; accent?: boolean }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-medium text-[var(--muted)]">{k}</div>
      <div className={`mt-1 text-3xl font-bold ${accent ? "grad-text" : ""}`}>{v}</div>
      <div className="mt-1 text-xs text-[var(--muted)]">{sub}</div>
    </div>
  );
}

const avg = (a: number[]) => a.reduce((s, n) => s + n, 0) / a.length;
const range = (a: number[]) => Math.max(...a) - Math.min(...a);
