// Stellar yield sources Tenor can tokenize, shown with their own logos and linked
// to each project. No tiles or backgrounds. Colourful brands keep their colour;
// monochrome brands render as a clean white mark.
const SOURCES = [
  { name: "Stellar", img: "/logos/stellar.svg", url: "https://www.stellar.org", mono: true, h: 34 },
  { name: "Blend", img: "/logos/blend.svg", url: "https://www.blend.capital", mono: false, h: 42 },
  { name: "DeFindex", img: "/logos/defindex.svg", url: "https://www.defindex.io", mono: false, h: 30 },
  { name: "Ondo", img: "/logos/ondo.svg", url: "https://ondo.finance", mono: true, h: 30 },
  { name: "Reflector", img: "/logos/reflector.svg", url: "https://reflector.network", mono: true, h: 34 },
];

export function YieldSources() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-1)]">
          Yield from across Stellar
        </div>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Tenor plugs into the yield already on Stellar
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[var(--muted)]">
          Any yield bearing asset can become a fixed rate. Tenor draws liquidity
          from the sources people already use.
        </p>
      </div>

      <div className="mt-14 flex flex-wrap items-center justify-center gap-x-14 gap-y-10">
        {SOURCES.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noreferrer noopener"
            title={s.name}
            aria-label={`${s.name} website`}
            className="inline-flex items-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.img}
              alt={`${s.name} logo`}
              className={s.mono ? "logo-mono" : "logo-color"}
              style={{ height: s.h, width: "auto" }}
            />
          </a>
        ))}
      </div>
    </section>
  );
}
