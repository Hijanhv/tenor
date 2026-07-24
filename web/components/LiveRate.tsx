"use client";

import { useEffect, useState } from "react";
import { Tenor } from "@/lib/stellar";
import { pct } from "@/lib/format";
import { CONFIG } from "@/lib/config";

const NET_LABEL = CONFIG.network === "mainnet" ? "Mainnet" : "Testnet";

// Reads the live fixed rate from the contract for the landing hero. A zero rate
// means the market has no liquidity yet (e.g. a freshly launched mainnet market),
// so we show a "live on <network>" label rather than a misleading 0% APR.
export function LiveRate() {
  const [rate, setRate] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    Tenor.fixedRate()
      .then((r) => alive && setRate(r > 0n ? pct(r) : null))
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
          <span className="text-[var(--muted)]">fixed, live on {NET_LABEL.toLowerCase()}</span>
        </>
      ) : (
        <span className="text-[var(--muted)]">live on Stellar {NET_LABEL}</span>
      )}
    </span>
  );
}
