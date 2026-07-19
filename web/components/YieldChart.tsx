"use client";

import { useState } from "react";
import type { YieldData } from "@/lib/yields";

const W = 720, H = 320, padL = 44, padR = 104, padT = 18, padB = 34;
const plotW = W - padL - padR;
const plotH = H - padT - padB;

export function YieldChart({ data }: { data: YieldData }) {
  const { weeks, series, fixed } = data;
  const N = weeks.length;

  // y-domain from the data, padded and rounded.
  const all = [...series.flatMap((s) => s.data), fixed.value];
  const ymin = Math.max(0, Math.floor(Math.min(...all) - 1));
  const ymax = Math.ceil(Math.max(...all) + 1);
  const ticks = niceTicks(ymin, ymax);

  const x = (i: number) => padL + (i / (N - 1)) * plotW;
  const y = (v: number) => padT + (1 - (v - ymin) / (ymax - ymin)) * plotH;
  const path = (d: number[]) => d.map((v, i) => `${i ? "L" : "M"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");

  const [hi, setHi] = useState<number | null>(null);
  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left - padL) / plotW) * (N - 1));
    setHi(Math.max(0, Math.min(N - 1, i)));
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {[...series, fixed].map((s) => (
          <span key={s.name} className="flex items-center gap-2 text-[var(--muted)]">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="relative" style={{ width: W }} onMouseMove={onMove} onMouseLeave={() => setHi(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Weekly APY across Stellar yield sources">
            {ticks.map((v) => (
              <g key={v}>
                <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="#2b2b23" strokeWidth="1" />
                <text x={padL - 10} y={y(v) + 4} textAnchor="end" className="font-mono" fontSize="11" fill="#a29e8f">{v}%</text>
              </g>
            ))}
            {weeks.map((w, i) => (
              (i % 2 === 0 || i === N - 1) &&
              <text key={i} x={x(i)} y={H - 12} textAnchor="middle" className="font-mono" fontSize="10" fill="#a29e8f">{w}</text>
            ))}

            {/* Tenor fixed reference */}
            <line x1={padL} y1={y(fixed.value)} x2={W - padR} y2={y(fixed.value)} stroke={fixed.color} strokeWidth="2" strokeDasharray="5 5" />
            <text x={W - padR + 8} y={y(fixed.value) + 4} fontSize="12" fontWeight="600" fill={fixed.color}>fixed {fixed.value}%</text>

            {series.map((s) => (
              <g key={s.name}>
                <path d={path(s.data)} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={x(N - 1)} cy={y(s.data[N - 1])} r="3.5" fill={s.color} />
                <text x={W - padR + 8} y={y(s.data[N - 1]) + 4} fontSize="11" fill={s.color}>{s.data[N - 1].toFixed(1)}%</text>
              </g>
            ))}

            {hi !== null && (
              <g>
                <line x1={x(hi)} y1={padT} x2={x(hi)} y2={H - padB} stroke="#2b2b23" strokeWidth="1" />
                {series.map((s) => (
                  <circle key={s.name} cx={x(hi)} cy={y(s.data[hi])} r="4.5" fill={s.color} stroke="#1a1a15" strokeWidth="2" />
                ))}
              </g>
            )}
          </svg>

          {hi !== null && (
            <div
              className="pointer-events-none absolute top-2 z-10 min-w-[168px] rounded-xl border border-[var(--line)] bg-[var(--card)] p-3 text-sm shadow-lg"
              style={{ left: Math.min(x(hi) + 12, W - 184) }}
            >
              <div className="mb-2 font-mono text-xs text-[var(--muted)]">Week of {weeks[hi]}</div>
              {series.map((s) => (
                <div key={s.name} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-[var(--muted)]">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                  <span className="font-mono font-semibold">{s.data[hi].toFixed(1)}%</span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between gap-4 border-t border-[var(--line)] pt-2">
                <span className="flex items-center gap-2" style={{ color: fixed.color }}>
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: fixed.color }} />
                  {fixed.name}
                </span>
                <span className="font-mono font-semibold" style={{ color: fixed.color }}>{fixed.value}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function niceTicks(min: number, max: number): number[] {
  const step = Math.max(1, Math.round((max - min) / 4));
  const out: number[] = [];
  for (let v = min; v <= max; v += step) out.push(v);
  return out;
}
