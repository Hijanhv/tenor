import { SCALE, TOKEN_DECIMALS } from "./config";

const UNIT = 10 ** TOKEN_DECIMALS;

// token stroops -> human number
export function fromUnits(v: bigint | number | string): number {
  return Number(BigInt(v)) / UNIT;
}

// human number -> token stroops (bigint)
export function toUnits(v: number | string): bigint {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (!isFinite(n) || n <= 0) return 0n;
  return BigInt(Math.round(n * UNIT));
}

// 1e7-scaled price -> number (e.g. 9_500_000 -> 0.95)
export function fromScaled(v: bigint | number | string): number {
  return Number(BigInt(v)) / SCALE;
}

export function pct(scaledRate: bigint | number | string): string {
  return (fromScaled(scaledRate) * 100).toFixed(2) + "%";
}

export function money(n: number, digits = 2): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function shortAddr(a: string): string {
  return a.length > 12 ? `${a.slice(0, 5)}…${a.slice(-4)}` : a;
}

export function daysUntil(unixSeconds: number): number {
  return Math.max(0, Math.round((unixSeconds - Date.now() / 1000) / 86400));
}
