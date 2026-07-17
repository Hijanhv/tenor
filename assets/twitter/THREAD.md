# Tenor launch thread (X / Twitter)

Post as a thread from **@tenor_stellar**. Every post has an image (the PNGs in this folder).
Profile picture: `profile.png` · Header/banner: `banner.png`.

---

**1 / 6** &nbsp;·&nbsp; image: `t1-hook.png`

> Stellar finally has real yield. It also has a problem: every rate floats.
>
> So we built the fixed rate market Stellar was missing.
>
> Lock a guaranteed yield, or trade the interest rate itself. 🧵👇

---

**2 / 6** &nbsp;·&nbsp; image: `t2-problem.png`

> Park stablecoins in a lending pool on Stellar and you are guessing. 8% today, 3% next month.
>
> No way to lock a rate. No way to buy a guaranteed return.
>
> Fixed rate products on Stellar today: zero. The whole interest rate layer is empty.

---

**3 / 6** &nbsp;·&nbsp; image: `t3-solution.png`

> Tenor takes any yield bearing asset and splits it in two:
>
> • PT — redeems for 1.00 at maturity. Buy at a discount, lock a fixed rate.
> • YT — collects all the yield. Go long or short the rate.
>
> PT + YT always recombine into the original. Simple.

---

**4 / 6** &nbsp;·&nbsp; image: `t4-strategy.png`

> The quant strategy: fixed rate carry.
>
> Buy principal below par, it climbs to 1.00 by maturity, and that climb is contractually fixed. Our carry vault does it in one click.
>
> The rate is computed on chain, not guessed by a frontend.

---

**5 / 6** &nbsp;·&nbsp; image: `t5-proof.png`

> Not slides. Shipped.
>
> Live on Stellar Testnet. Tokenizer + time decay AMM + carry vault, all in Rust on Soroban. 9/9 tests passing. Fully open source.

---

**6 / 6** &nbsp;·&nbsp; image: `t6-cta.png`

> Lock your first fixed rate in two clicks.
>
> ▶ App: tenor-blond-xi.vercel.app
> ★ Code: github.com/Hijanhv/tenor
>
> Follow @tenor_stellar for what ships next.
