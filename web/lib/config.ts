import deployment from "../deployment.json";

// Addresses come from deployment.json, written by the deploy scripts.
// mainnet: deploy/deploy_mainnet.sh (real Ondo USDY + Circle USDC).
// testnet: deploy/deploy_testnet.sh (mock tokens with a faucet).
const NET = deployment.network;
// stellar.expert path segment: "public" for mainnet, "testnet" for testnet.
const EXP = NET === "mainnet" ? "public" : "testnet";
// Optional fields — present on mainnet config, absent on the older testnet one.
const D = deployment as typeof deployment & {
  syLabel?: string;
  usdcLabel?: string;
  faucet?: boolean;
};

export const CONFIG = {
  network: NET,
  rpcUrl: deployment.rpc,
  networkPassphrase: deployment.passphrase,
  tokenizer: deployment.tokenizer,
  sy: deployment.sy,
  usdc: deployment.usdc,
  // Display tickers for the underlying / quote. Testnet used TSY; mainnet is USDY.
  syLabel: D.syLabel ?? "TSY",
  usdcLabel: D.usdcLabel ?? "USDC",
  // Whether the built-in mint faucet exists. Only true on testnet mock tokens —
  // real USDY/USDC have no public mint, so the faucet is hidden on mainnet.
  faucet: D.faucet ?? true,
  maturity: deployment.maturity as number,
  // A funded public key used only as the source for read-only simulations
  // (no signature, no fees, nothing is submitted).
  readSource: deployment.issuer,
  github: "https://github.com/Hijanhv/tenor",
  docs: "https://tenor-421719bc.mintlify.site",
  twitter: "https://x.com/tenor_stellar",
  explorerNet: EXP,
  explorer: (id: string) =>
    `https://stellar.expert/explorer/${EXP}/contract/${id}`,
  account: (id: string) =>
    `https://stellar.expert/explorer/${EXP}/account/${id}`,
  tx: (hash: string) =>
    `https://stellar.expert/explorer/${EXP}/tx/${hash}`,
};

// The deployed contracts, for the "on chain" panel and docs.
export const CONTRACTS = [
  { label: "Tokenizer + AMM + Vault", id: deployment.tokenizer, note: "the protocol" },
  { label: `Underlying (${CONFIG.syLabel})`, id: deployment.sy, note: "underlying" },
  { label: `Quote (${CONFIG.usdcLabel})`, id: deployment.usdc, note: "stable quote" },
];

// Fixed point scales used by the contract.
export const SCALE = 10_000_000; // 1e7  (index, prices, rate)
export const TOKEN_DECIMALS = 7; // SY / USDC / PT / YT
