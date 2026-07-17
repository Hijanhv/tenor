<p align="center">
  <img src="assets/tenor-logo.svg" alt="Tenor" width="380"/>
</p>

# Tenor — the fixed-rate market Stellar is missing

> Yield tokenization for Soroban. Split any yield‑bearing Stellar asset into **Principal (PT)** and **Yield (YT)** tokens — lock in a **fixed rate**, or trade the **interest rate** itself. "Pendle for Stellar."

<p align="center"><em>Turn Stellar's floating, unpredictable yields into predictable, tradable ones.</em></p>

---

## The problem

Stellar DeFi now has real yield — Blend lending pools, DeFindex vaults, tokenized T‑bills like USDY. RWA + TVL grew **~118%+ in 2025**. But **every yield on Stellar today is floating and unpredictable**, and the public DeFi directory has *zero* fixed‑rate, yield‑tokenization, options, or structured‑products protocols. That entire interest‑rate layer of DeFi — the layer serious and institutional capital needs — is empty.

Floating‑only yield is exactly what blocks predictable savings and institutional RWA flows. Fixed‑rate DeFi ("Pendle") is the defining 2026 DeFi narrative. **It doesn't exist on Stellar. Tenor is that primitive.**

## What Tenor does

Take a yield‑bearing asset (an "SY" — e.g. a Blend pool token) and a maturity date. Tenor splits it into two tradable tokens:

| Token | Redeems for | Use |
| --- | --- | --- |
| **PT** – Principal Token | exactly `1` unit of the asset **at maturity** | Buy at a discount today → **lock a fixed rate** ("earn a guaranteed 7.5% for 1yr") |
| **YT** – Yield Token | **all the yield** the SY earns until maturity | **Go long / short the interest rate** — a pure rates trade |

**Invariant:** `PT(x) + YT(x) == x` units of the underlying asset. They can always be recombined.

```
                          ┌── PT ──►  fixed-rate savers  (buy discount → lock rate)
  yield-bearing asset ──► split
     (Blend / USDY /       └── YT ──►  yield traders      (long/short the rate)
      DeFindex share)
                          PT/YT trade on the Tenor rate AMM → implied fixed-rate curve
```

Three layers:
1. **Tokenizer** — the core primitive: split / recombine / redeem, and stream yield to YT holders (MasterChef accumulator). ✅ built & tested
2. **Rate AMM** — trade PT/YT and discover the implied fixed rate. 🚧
3. **Products** — a one‑tap "earn fixed X%" savings vault, a long/short‑yield screen, and a systematic **fixed‑rate carry** strategy vault. 🚧

## Why it composes the whole ecosystem

Tenor is a **primitive**, not an app — it makes *other* protocols more useful:

- **Blend / DeFindex** pool tokens → become fixed‑rate instruments
- **USDY & tokenized T‑bills** → get an on‑chain fixed‑rate market
- **Reflector** → feeds the SY→asset exchange rate / marks
- **Soroswap** → PT/YT are tradable assets (roadmap: SEP‑41 wrap)

## Repo structure

```
tenor/
├── contracts/
│   └── tokenizer/     # Soroban (Rust) — core yield-tokenization engine  ✅
├── web/               # Next.js PWA — the "lock a fixed rate" app          🚧
└── README.md
```

## Contracts — status

The tokenizer core is implemented and tested (soroban‑sdk 26):

`initialize · sync · deposit · combine · redeem_pt · claim_yield · transfer_pt · transfer_yt · pending_yield · implied_fixed_rate · market_info`

```bash
cd contracts/tokenizer
cargo test          # split, accrue+claim+redeem, combine, multi-YT split, implied rate
stellar contract build
```

> Build note: pin `ed25519-dalek` to 2.2.0 (`cargo update -p ed25519-dalek@3.0.0 --precise 2.2.0`) — newer 3.0.0 breaks `soroban-env-host` testutils.

## Roadmap (hackathon build)

- [x] Yield‑tokenization core (PT/YT split, yield streaming, redemption)
- [x] Implied fixed‑rate math
- [ ] Rate AMM (PT/USDC pool + implied‑rate curve)
- [ ] Mock yield‑bearing SY vault for a self‑driving demo
- [ ] Next.js PWA — fixed‑rate savings + yield trading + portfolio
- [ ] Testnet deployment + explorer links
- [ ] Fixed‑rate carry strategy vault
- [ ] Demo video

## License

MIT
