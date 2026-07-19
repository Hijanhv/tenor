import deployment from "../deployment.json";

// All addresses come from the live testnet deployment (deploy/deploy_testnet.sh).
export const CONFIG = {
  network: deployment.network,
  rpcUrl: deployment.rpc,
  networkPassphrase: deployment.passphrase,
  tokenizer: deployment.tokenizer,
  sy: deployment.sy,
  usdc: deployment.usdc,
  maturity: deployment.maturity as number,
  // A valid, funded testnet public key used only as the source for read-only
  // simulations (no signature, no fees, nothing is submitted).
  readSource: deployment.issuer,
  github: "https://github.com/Hijanhv/tenor",
  docs: "https://tenor-421719bc.mintlify.site",
  explorer: (id: string) =>
    `https://stellar.expert/explorer/testnet/contract/${id}`,
  account: (id: string) =>
    `https://stellar.expert/explorer/testnet/account/${id}`,
};

// The deployed contracts, for the "on chain" panel and docs.
export const CONTRACTS = [
  { label: "Tokenizer + AMM + Vault", id: deployment.tokenizer, note: "the protocol" },
  { label: "Test yield asset (TSY)", id: deployment.sy, note: "underlying" },
  { label: "Test USDC", id: deployment.usdc, note: "stable quote" },
];

// Fixed point scales used by the contract.
export const SCALE = 10_000_000; // 1e7  (index, prices, rate)
export const TOKEN_DECIMALS = 7; // SY / USDC / PT / YT
