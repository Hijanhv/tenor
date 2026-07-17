const { chromium } = require("playwright");

const OUT = "/Users/janhavi/tenor/assets/twitter";

// tuning-fork mark (matches the app logo)
const MARK = (s = 120) => `
<svg width="${s}" height="${s}" viewBox="0 0 120 120" fill="none">
  <defs>
    <linearGradient id="tg" x1="28" y1="12" x2="94" y2="108" gradientUnits="userSpaceOnUse">
      <stop stop-color="#2F4BFF"/><stop offset="1" stop-color="#06B6D4"/>
    </linearGradient>
    <linearGradient id="tgy" x1="72" y1="14" x2="86" y2="60" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FBBF24"/><stop offset="1" stop-color="#F97316"/>
    </linearGradient>
  </defs>
  <path d="M60 104 V78" stroke="url(#tg)" stroke-width="11" stroke-linecap="round"/>
  <path d="M60 78 C60 66 44 66 44 54 M60 78 C60 66 76 66 76 54" stroke="url(#tg)" stroke-width="11" stroke-linecap="round" fill="none"/>
  <path d="M44 54 V24" stroke="url(#tg)" stroke-width="11" stroke-linecap="round"/>
  <circle cx="44" cy="17" r="7" fill="#2F4BFF"/>
  <path d="M76 54 C76 42 70 40 76 30 C80 24 82 26 84 20" stroke="url(#tgy)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M77 17 L85 13 L87 21 Z" fill="#F97316"/>
</svg>`;

// candlesticks + convergence curve
const CANDLES = `
<svg viewBox="0 0 250 140" width="440" fill="none">
  <defs><linearGradient id="cc" x1="0" y1="120" x2="250" y2="20" gradientUnits="userSpaceOnUse">
    <stop stop-color="#2f4bff"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs>
  ${[[14,96,78,70,104,1],[40,86,92,80,100,0],[66,92,70,62,98,1],[92,74,60,52,80,1],[118,66,74,58,82,0],[144,72,52,44,78,1],[170,56,44,36,62,1],[196,48,34,26,54,1],[222,40,30,22,46,1]]
    .map(([x,o,c,hi,lo,up])=>{const top=Math.min(o,c),h=Math.max(3,Math.abs(o-c)),col=up?"#10b981":"#ef4444";
    return `<line x1="${x}" y1="${hi}" x2="${x}" y2="${lo}" stroke="${col}" stroke-width="1.5" opacity="0.6"/><rect x="${x-5}" y="${top}" width="10" height="${h}" rx="2" fill="${col}" opacity="0.9"/>`}).join("")}
  <path d="M8 118 C70 110 150 60 244 26" fill="none" stroke="url(#cc)" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="244" cy="26" r="5" fill="#06b6d4"/>
</svg>`;

const BASE = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; font-family:'Inter',system-ui,sans-serif; }
  .frame { width:100%; height:100%; position:relative; overflow:hidden;
    background:
      radial-gradient(50rem 30rem at 88% -10%, rgba(47,75,255,.16), transparent 60%),
      radial-gradient(40rem 30rem at 4% 6%, rgba(245,158,11,.13), transparent 55%),
      radial-gradient(36rem 30rem at 60% 118%, rgba(6,182,212,.14), transparent 60%),
      linear-gradient(180deg,#fbf5ee,#f4eadd 100%);
    background-color:#fbf5ee; color:#171310; }
  .grad { background:linear-gradient(105deg,#2f4bff,#7c3aed 48%,#06b6d4); -webkit-background-clip:text; background-clip:text; color:transparent; }
  .pill { display:inline-flex; align-items:center; gap:8px; border:1px solid #ece0d2; background:#fffdfa; border-radius:999px; padding:8px 16px; font-weight:600; font-size:20px; }
  .dot { width:12px; height:12px; border-radius:99px; background:#10b981; }
  .muted { color:#6d6156; }
  .kicker { text-transform:uppercase; letter-spacing:.12em; font-weight:700; color:#2f4bff; }
  .chip { border:1px solid #ece0d2; background:#fffdfa; border-radius:18px; padding:18px 22px; }
</style>`;

const wrap = (inner) => `${BASE}<div class="frame">${inner}</div>`;

// ---- cards ----
const cards = [];

// profile 400x400
cards.push({ name: "profile", w: 400, h: 400, html: wrap(`
  <div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px">
    ${MARK(200)}
    <div style="font-size:52px;font-weight:800;letter-spacing:-1px" class="grad">Tenor</div>
  </div>`) });

// banner 1500x500
cards.push({ name: "banner", w: 1500, h: 500, html: wrap(`
  <div style="height:100%;display:flex;align-items:center;justify-content:space-between;padding:0 80px">
    <div style="max-width:820px">
      <div style="display:flex;align-items:center;gap:16px">${MARK(76)}<span style="font-size:40px;font-weight:800" class="grad">Tenor</span></div>
      <div style="font-size:58px;font-weight:900;letter-spacing:-1.5px;line-height:1.05;margin-top:22px">The <span class="grad">fixed rate</span> market for Stellar</div>
      <div class="muted" style="font-size:26px;margin-top:16px">Split any yield asset into principal and yield. Lock a rate, or trade the rate.</div>
      <div style="display:flex;gap:14px;margin-top:26px">
        <span class="pill">tenor-blond-xi.vercel.app</span>
        <span class="pill">@tenor_stellar</span>
      </div>
    </div>
    <div style="opacity:.98">${CANDLES}</div>
  </div>`) });

// thread cards 1200x675
const T = (inner) => wrap(`<div style="height:100%;padding:70px 76px;display:flex;flex-direction:column">${inner}</div>`);
const foot = `<div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center;font-size:20px" class="muted">
  <span style="display:flex;align-items:center;gap:10px">${MARK(30)}<b style="color:#171310">Tenor</b></span><span>@tenor_stellar</span></div>`;

cards.push({ name: "t1-hook", w: 1200, h: 675, html: T(`
  <div class="pill"><span class="dot"></span> Live on Stellar Testnet</div>
  <div style="font-size:78px;font-weight:900;letter-spacing:-2px;line-height:1.03;margin-top:28px">The <span class="grad">fixed rate</span><br/>market for Stellar</div>
  <div class="muted" style="font-size:30px;margin-top:22px;max-width:820px">Lock a guaranteed yield. Or trade the interest rate itself. The layer Stellar DeFi was missing. A thread 🧵</div>
  ${foot}`) });

cards.push({ name: "t2-problem", w: 1200, h: 675, html: T(`
  <div class="kicker" style="font-size:22px">The problem</div>
  <div style="font-size:60px;font-weight:900;letter-spacing:-1.5px;margin-top:16px;line-height:1.05">Every yield on Stellar<br/>is a <span class="grad">guess</span></div>
  <div class="muted" style="font-size:29px;margin-top:22px;max-width:900px">Blend, DeFindex, tokenized T-bills brought real yield on chain. But every rate floats. 8% today, 3% next month. No way to lock it.</div>
  <div class="chip" style="margin-top:26px;font-size:26px;font-weight:700">Fixed rate products on Stellar today: <span class="grad">0</span></div>
  ${foot}`) });

cards.push({ name: "t3-solution", w: 1200, h: 675, html: T(`
  <div class="kicker" style="font-size:22px">The solution</div>
  <div style="font-size:60px;font-weight:900;letter-spacing:-1.5px;margin-top:16px">Split the asset. <span class="grad">Fix the rate.</span></div>
  <div style="display:flex;gap:22px;margin-top:32px">
    <div class="chip" style="flex:1"><div style="font-size:30px;font-weight:800" class="grad">PT · principal</div><div class="muted" style="font-size:23px;margin-top:8px">Redeems for 1.00 at maturity. Buy at a discount, lock a fixed return.</div></div>
    <div class="chip" style="flex:1"><div style="font-size:30px;font-weight:800;color:#f97316">YT · yield</div><div class="muted" style="font-size:23px;margin-top:8px">Collects all the yield. Go long or short the rate.</div></div>
  </div>
  <div class="muted" style="font-size:23px;margin-top:22px">PT + YT always recombine into the original asset.</div>
  ${foot}`) });

cards.push({ name: "t4-strategy", w: 1200, h: 675, html: T(`
  <div class="kicker" style="font-size:22px">The quant strategy</div>
  <div style="font-size:58px;font-weight:900;letter-spacing:-1.5px;margin-top:14px">Fixed rate carry, <span class="grad">automated</span></div>
  <div style="display:flex;align-items:center;gap:30px;margin-top:26px">
    <div style="flex:1"><div class="muted" style="font-size:27px">Buy principal below par. It climbs to 1.00 by maturity. That climb is contractually fixed. The vault does it in one click.</div>
    <div class="chip" style="margin-top:20px;font-size:22px;font-family:monospace">fixed_rate = (1/price − 1) × yr/tenor</div></div>
    <div>${CANDLES}</div>
  </div>
  ${foot}`) });

cards.push({ name: "t5-proof", w: 1200, h: 675, html: T(`
  <div class="kicker" style="font-size:22px">Shipped, not slides</div>
  <div style="font-size:58px;font-weight:900;letter-spacing:-1.5px;margin-top:14px">Live on testnet. <span class="grad">Open source.</span></div>
  <div style="display:flex;gap:18px;margin-top:34px">
    <div class="chip" style="flex:1;text-align:center"><div style="font-size:46px;font-weight:900" class="grad">9/9</div><div class="muted" style="font-size:22px">tests passing</div></div>
    <div class="chip" style="flex:1;text-align:center"><div style="font-size:46px;font-weight:900" class="grad">~5s</div><div class="muted" style="font-size:22px">settlement</div></div>
    <div class="chip" style="flex:1;text-align:center"><div style="font-size:46px;font-weight:900" class="grad">Soroban</div><div class="muted" style="font-size:22px">Rust contracts</div></div>
  </div>
  <div class="muted" style="font-size:25px;margin-top:26px">Tokenizer + time-decay AMM + carry vault, all on chain.</div>
  ${foot}`) });

cards.push({ name: "t6-cta", w: 1200, h: 675, html: T(`
  <div style="margin:auto 0">
    <div style="font-size:66px;font-weight:900;letter-spacing:-1.5px;line-height:1.05">Lock your first<br/><span class="grad">fixed rate</span></div>
    <div class="muted" style="font-size:29px;margin-top:22px">Connect Freighter on testnet, grab test tokens, lock a rate in two clicks.</div>
    <div style="display:flex;gap:14px;margin-top:30px">
      <span class="pill" style="font-size:24px">▶ tenor-blond-xi.vercel.app</span>
      <span class="pill" style="font-size:24px">★ github.com/Hijanhv/tenor</span>
    </div>
  </div>
  ${foot}`) });

(async () => {
  const browser = await chromium.launch();
  for (const c of cards) {
    const page = await browser.newPage({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 2 });
    await page.setContent(c.html, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/${c.name}.png` });
    await page.close();
    console.log("wrote", c.name, `${c.w}x${c.h}`);
  }
  await browser.close();
})();
