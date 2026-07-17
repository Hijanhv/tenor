import {
  rpc,
  Contract,
  TransactionBuilder,
  Account,
  Address,
  nativeToScVal,
  scValToNative,
  BASE_FEE,
  xdr,
} from "@stellar/stellar-sdk";
import { CONFIG } from "./config";
import { sign } from "./wallet";

const server = new rpc.Server(CONFIG.rpcUrl, { allowHttp: false });

const addr = (a: string): xdr.ScVal => Address.fromString(a).toScVal();
const i128 = (v: bigint | number): xdr.ScVal =>
  nativeToScVal(BigInt(v), { type: "i128" });

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Read-only call against the live contract via simulation. No signature, no fees.
async function read<T>(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = []
): Promise<T> {
  const source = new Account(CONFIG.readSource, "0");
  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: CONFIG.networkPassphrase,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`${method} failed: ${sim.error}`);
  }
  const retval = sim.result?.retval;
  return (retval ? scValToNative(retval) : null) as T;
}

// State-changing call: prepare, sign with Freighter, submit, wait for success.
async function write(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  walletAddress: string
): Promise<string> {
  const account = await server.getAccount(walletAddress);
  const tx = new TransactionBuilder(account, {
    fee: (Number(BASE_FEE) * 100).toString(),
    networkPassphrase: CONFIG.networkPassphrase,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(120)
    .build();

  const prepared = await server.prepareTransaction(tx);
  const signedXdr = await sign(prepared.toXDR(), walletAddress);
  const sent = await server.sendTransaction(
    TransactionBuilder.fromXDR(signedXdr, CONFIG.networkPassphrase)
  );
  if (sent.status === "ERROR") {
    throw new Error(`submit failed: ${JSON.stringify(sent.errorResult)}`);
  }

  let got = await server.getTransaction(sent.hash);
  const started = Date.now();
  while (got.status === "NOT_FOUND" && Date.now() - started < 40_000) {
    await sleep(1200);
    got = await server.getTransaction(sent.hash);
  }
  if (got.status !== "SUCCESS") {
    throw new Error(`transaction ${sent.hash} did not succeed: ${got.status}`);
  }
  return sent.hash;
}

export type Market = {
  underlying: string;
  quote: string;
  maturity: bigint;
  index: bigint;
  total_pt: bigint;
  total_yt: bigint;
  total_sy: bigint;
  reserve_pt: bigint;
  reserve_quote: bigint;
  matured: boolean;
};

export const Tenor = {
  marketInfo: () => read<Market>(CONFIG.tokenizer, "market_info"),
  ptPrice: () => read<bigint>(CONFIG.tokenizer, "pt_price"),
  fixedRate: () => read<bigint>(CONFIG.tokenizer, "fixed_rate"),
  quoteBuyPt: (quoteIn: bigint) =>
    read<bigint>(CONFIG.tokenizer, "quote_buy_pt", [i128(quoteIn)]),
  ptBalance: (a: string) =>
    read<bigint>(CONFIG.tokenizer, "pt_balance", [addr(a)]),
  ytBalance: (a: string) =>
    read<bigint>(CONFIG.tokenizer, "yt_balance", [addr(a)]),
  pendingYield: (a: string) =>
    read<bigint>(CONFIG.tokenizer, "pending_yield", [addr(a)]),
  tokenBalance: (token: string, a: string) =>
    read<bigint>(token, "balance", [addr(a)]),

  // writes
  faucet: (token: string, to: string, amount: bigint) =>
    write(token, "mint", [addr(to), i128(amount)], to),
  buyPt: (buyer: string, quoteIn: bigint) =>
    write(CONFIG.tokenizer, "buy_pt", [addr(buyer), i128(quoteIn)], buyer),
  sellPt: (seller: string, ptIn: bigint) =>
    write(CONFIG.tokenizer, "sell_pt", [addr(seller), i128(ptIn)], seller),
  deposit: (user: string, syAmt: bigint) =>
    write(CONFIG.tokenizer, "deposit", [addr(user), i128(syAmt)], user),
  combine: (user: string, amt: bigint) =>
    write(CONFIG.tokenizer, "combine", [addr(user), i128(amt)], user),
  claimYield: (user: string) =>
    write(CONFIG.tokenizer, "claim_yield", [addr(user)], user),
  redeemPt: (user: string, amt: bigint) =>
    write(CONFIG.tokenizer, "redeem_pt", [addr(user), i128(amt)], user),
};
