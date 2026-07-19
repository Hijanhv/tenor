// Live Stellar yields from DeFiLlama. Server side fetch with hourly revalidate,
// so the analytics page shows real, current data rather than samples.

export type Series = { name: string; color: string; data: number[] };
export type YieldData = {
  weeks: string[];
  series: Series[];
  fixed: { name: string; color: string; value: number };
  asOf: string | null;
  live: boolean;
};

// Stable DeFiLlama pool ids for Stellar yield sources with real history.
const POOLS = [
  { name: "Blend USDC", color: "#3987e5", id: "ecf788e3-d2ef-4fdd-9ece-8a2d96226ddf" },
  { name: "Blend EURC", color: "#199e70", id: "3a61420f-6f6e-45f9-accc-8d23f5a32d33" },
  { name: "Ondo USDY", color: "#c98500", id: "a66e2d12-188b-407d-aaec-d95640e08ef7" },
];

type Point = { timestamp: string; apy: number };

async function chart(id: string): Promise<Point[]> {
  const r = await fetch(`https://yields.llama.fi/chart/${id}`, {
    next: { revalidate: 3600 },
  });
  if (!r.ok) throw new Error(`llama ${r.status}`);
  const j = (await r.json()) as { data: Point[] };
  return j.data ?? [];
}

// One point per week for the last ~12 weeks.
function weekly(points: Point[]): Point[] {
  const out: Point[] = [];
  for (let i = points.length - 1; i >= 0 && out.length < 12; i -= 7) out.unshift(points[i]);
  return out;
}

const FALLBACK: YieldData = {
  weeks: ["5/2", "5/9", "5/16", "5/23", "5/30", "6/6", "6/13", "6/20", "6/27", "7/4", "7/11", "7/18"],
  series: [
    { name: "Blend USDC", color: "#3987e5", data: [9.62, 9.01, 8.65, 8.62, 8.41, 8.34, 7.96, 6.76, 5.96, 8.16, 6.32, 7.5] },
    { name: "Blend EURC", color: "#199e70", data: [6.4, 6.2, 6.0, 6.1, 5.9, 5.7, 5.8, 6.0, 5.9, 5.8, 5.9, 5.86] },
    { name: "Ondo USDY", color: "#c98500", data: [4.1, 4.0, 3.9, 3.8, 3.7, 3.7, 3.6, 3.6, 3.55, 3.55, 3.55, 3.55] },
  ],
  fixed: { name: "Tenor fixed", color: "#e10098", value: 7.5 },
  asOf: null,
  live: false,
};

export async function getYields(): Promise<YieldData> {
  try {
    const settled = await Promise.allSettled(POOLS.map((p) => chart(p.id)));
    // Keep only pools that returned enough history for a weekly series.
    const kept = POOLS.map((p, i) => {
      const res = settled[i];
      if (res.status !== "fulfilled") return null;
      const w = weekly(res.value);
      return w.length >= 6 ? { pool: p, w } : null;
    }).filter((x): x is { pool: (typeof POOLS)[number]; w: Point[] } => x !== null);

    if (kept.length < 2) return FALLBACK;

    const n = Math.min(12, ...kept.map((k) => k.w.length));
    if (n < 4) return FALLBACK;

    const series: Series[] = kept.map((k) => ({
      name: k.pool.name,
      color: k.pool.color,
      data: k.w.slice(-n).map((pt) => +Number(pt.apy).toFixed(2)),
    }));
    const refTs = kept[0].w.slice(-n).map((pt) => pt.timestamp);
    const weeks = refTs.map((t) => {
      const d = new Date(t);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    const blend = series[0].data;
    const value = blend[blend.length - 1];

    return {
      weeks,
      series,
      fixed: { name: "Tenor fixed", color: "#e10098", value },
      asOf: refTs[refTs.length - 1] ?? null,
      live: true,
    };
  } catch {
    return FALLBACK;
  }
}
