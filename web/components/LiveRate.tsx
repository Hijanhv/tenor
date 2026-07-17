"use client";

import { useEffect, useState } from "react";
import { Tenor } from "@/lib/stellar";
import { pct } from "@/lib/format";

// Reads the live fixed rate from the testnet contract for the landing hero.
export function LiveRate() {
  const [rate, setRate] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    Tenor.fixedRate()
      .then((r) => alive && setRate(pct(r)))
      .catch(() => alive && setRate(null));
    return () => {
      alive = false;
    };
  }, []);
  return (
    <span className="inline-flex items-center gap-2 pill px-3 py-1 text-sm font-medium">
      <span className="dot-live" />
      {rate ? (
        <>
          <span className="grad-text font-semibold">{rate} APR</span>
          <span className="text-[var(--muted)]">fixed, live on testnet</span>
        </>
      ) : (
        <span className="text-[var(--muted)]">live on Stellar Testnet</span>
      )}
    </span>
  );
}
