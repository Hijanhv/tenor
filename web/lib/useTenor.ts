"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tenor, type Market } from "./stellar";
import { CONFIG } from "./config";
import { connect as connectWallet, currentAddress, onTestnet } from "./wallet";

export type Balances = {
  usdc: bigint;
  sy: bigint;
  pt: bigint;
  yt: bigint;
  pending: bigint;
};

const ZERO: Balances = { usdc: 0n, sy: 0n, pt: 0n, yt: 0n, pending: 0n };

export function useTenor() {
  const [address, setAddress] = useState<string | null>(null);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [market, setMarket] = useState<Market | null>(null);
  const [ptPrice, setPtPrice] = useState<bigint>(0n);
  const [fixedRate, setFixedRate] = useState<bigint>(0n);
  const [balances, setBalances] = useState<Balances>(ZERO);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);
  const addrRef = useRef<string | null>(null);

  const loadMarket = useCallback(async () => {
    const [m, p, r] = await Promise.all([
      Tenor.marketInfo(),
      Tenor.ptPrice(),
      Tenor.fixedRate(),
    ]);
    setMarket(m);
    setPtPrice(p);
    setFixedRate(r);
  }, []);

  const loadBalances = useCallback(async (a: string) => {
    const [usdc, sy, pt, yt, pending] = await Promise.all([
      Tenor.tokenBalance(CONFIG.usdc, a),
      Tenor.tokenBalance(CONFIG.sy, a),
      Tenor.ptBalance(a),
      Tenor.ytBalance(a),
      Tenor.pendingYield(a),
    ]);
    setBalances({ usdc, sy, pt, yt, pending });
  }, []);

  const refresh = useCallback(async () => {
    try {
      await loadMarket();
      if (addrRef.current) await loadBalances(addrRef.current);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [loadMarket, loadBalances]);

  const connect = useCallback(async () => {
    setError(null);
    try {
      const a = await connectWallet();
      addrRef.current = a;
      setAddress(a);
      setWrongNetwork(!(await onTestnet()));
      await loadBalances(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [loadBalances]);

  // A write action wrapped with busy state and a refresh afterwards.
  const run = useCallback(
    async (label: string, fn: (a: string) => Promise<string>) => {
      if (!addrRef.current) {
        setError("Connect your wallet first");
        return;
      }
      setBusy(label);
      setError(null);
      try {
        const hash = await fn(addrRef.current);
        setLastTx(hash);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(null);
      }
    },
    [refresh]
  );

  const actions = {
    faucetUsdc: () =>
      run("faucet-usdc", (a) => Tenor.faucet(CONFIG.usdc, a, 1_000_0000000n)),
    faucetSy: () =>
      run("faucet-sy", (a) => Tenor.faucet(CONFIG.sy, a, 1_000_0000000n)),
    buyPt: (quoteIn: bigint) => run("buy", (a) => Tenor.buyPt(a, quoteIn)),
    deposit: (syAmt: bigint) => run("deposit", (a) => Tenor.deposit(a, syAmt)),
    combine: (amt: bigint) => run("combine", (a) => Tenor.combine(a, amt)),
    claim: () => run("claim", (a) => Tenor.claimYield(a)),
    redeem: (amt: bigint) => run("redeem", (a) => Tenor.redeemPt(a, amt)),
  };

  useEffect(() => {
    currentAddress().then((a) => {
      if (a) {
        addrRef.current = a;
        setAddress(a);
        onTestnet().then((ok) => setWrongNetwork(!ok));
      }
      refresh();
    });
    const id = setInterval(refresh, 12_000);
    return () => clearInterval(id);
  }, [refresh]);

  return {
    address,
    wrongNetwork,
    market,
    ptPrice,
    fixedRate,
    balances,
    loading,
    busy,
    error,
    lastTx,
    connect,
    refresh,
    actions,
  };
}
