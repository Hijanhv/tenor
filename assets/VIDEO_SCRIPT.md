# Tenor — demo video script & storyboard

**Length:** ~2:15 · **Voice:** young man, warm and confident, clear pace · **Music:** minimal
upbeat lo-fi / soft electronic, builds gently, ducks under narration · **Persistent overlay:**
Stellar logo, bottom-right corner, small, ~60% opacity, entire runtime · **Tenor pink #E10098 /
lime accents** throughout.

How to produce: screen-record the live app (testnet, tenor-blond-xi.vercel.app) for the demo
shots, generate the voiceover from the VO lines below (e.g. ElevenLabs, a young male voice), and
assemble in CapCut / Descript / Premiere. Keep the Stellar logo pinned bottom-right the whole time.

---

### 0:00–0:10 — Cold open
- **On screen:** Black. The Tenor ram logo draws in (pink), then the wordmark "Tenor" fades in
  beneath. Tagline types out: "The fixed rate market for Stellar." Stellar logo settles into the
  bottom-right corner and stays there for the rest of the video.
- **VO:** "Stellar DeFi finally has real yield. But there's one thing it's still missing."
- **Music:** soft intro swell.

### 0:10–0:35 — The problem
- **On screen:** An animated line chart of a "yield" that wobbles up and down each week — 8%, then
  5%, then 3% — labeled "floating." A saver icon watches it, uncertain.
- **VO:** "Right now, every yield on Stellar floats. Park your stablecoins in a lending pool and you
  have no idea what next week pays. There's no way to lock a rate, no way to buy a guaranteed
  return, and no way to trade where rates are going. The entire interest-rate layer — the part
  serious savers and institutions actually need — is empty."

### 0:35–1:00 — The solution
- **On screen:** A single coin labeled "yield-bearing asset" splits, with a clean animation, into
  two tokens: **PT** (principal, locks a fixed rate) and **YT** (yield, trade the rate). A small
  formula appears: `PT(x) + YT(x) = x`.
- **VO:** "Tenor is that missing layer. Give it any yield-bearing asset and a maturity date, and it
  splits it into two tokens. The principal token redeems for exactly one-point-zero at maturity —
  buy it at a discount, and that discount is your locked, fixed return. The yield token streams all
  the yield, so traders can go long or short the rate. Principal plus yield always recombine into
  the original. It's a bond market, on Stellar."

### 1:00–1:45 — The demo (screen recording of the live app)
- **On screen:** Real capture of the app. Beats:
  1. Landing page, hero "Lock a fixed rate on Stellar yield," the live 9.78% rate card. Header shows
     "Testnet demo · Live on mainnet ↗".
  2. Click **Launch app** → connect Freighter → tap the faucet for test USDC + TSY.
  3. **Earn a fixed rate**: type an amount, buy PT, watch the locked APR preview, confirm — a real
     testnet transaction confirms on-screen.
  4. Quick cut to the **Analytics** page: live Blend and Ondo yields charting against the flat Tenor
     fixed rate.
- **VO:** "Here it is, live. Connect a wallet, and in a couple of clicks you lock a fixed rate on a
  real, on-chain market — the principal token, the yield token, and a one-click carry vault that
  automates the whole strategy. Every number you see is read straight from the contract. And the
  analytics are real: live Blend and Ondo yields, pulled on-chain, charted against Tenor's fixed
  rate."

### 1:45–2:00 — Real, and on mainnet
- **On screen:** The mainnet contract page on stellar.expert (public network), Ondo USDY and Circle
  USDC shown as the assets. Then a quick shot of the keeper terminal pushing a real Blend rate via
  `sync`, with the DeFiLlama source visible.
- **VO:** "This isn't a mock-up. The protocol is deployed on Stellar mainnet with real Ondo USDY and
  real Circle USDC. And a keeper drives the market's yield from Blend's live lending rate — real
  data, on-chain."

### 2:00–2:15 — Why Stellar needs it + close
- **On screen:** The three yield sources (Blend, DeFindex, Ondo USDY) flow into the Tenor logo, which
  radiates "fixed rate" outward. End on the logo + tagline + the URLs. Stellar logo still in the
  corner.
- **VO:** "Stellar is betting on real-world assets and stablecoin yield — but that capital moves for
  fixed rates it can model, not floating ones. Tenor fills the empty interest-rate layer, and lifts
  every yield source on the network with it. Tenor. The fixed rate market for Stellar."
- **On screen text:** tenor-blond-xi.vercel.app · docs · live on mainnet.
- **Music:** resolve, gentle outro.

---

### Notes
- Keep the "Testnet demo · Live on mainnet ↗" framing honest on camera — demo the working testnet
  market, and show the mainnet contract as proof. Do not imply the mainnet market is populated; it
  is intentionally empty pre-audit.
- Assets on hand: `assets/tenor-banner.png`, `assets/quant-carry.svg`, the app itself, docs at the
  Mintlify site. Grab the Stellar logo from stellar.org/brand.
- Total spoken words ~230, which lands around 2:00–2:15 at a natural pace.
