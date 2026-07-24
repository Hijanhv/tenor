import {
  isConnected,
  isAllowed as freighterIsAllowed,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction,
} from "@stellar/freighter-api";
import { CONFIG } from "./config";

export async function hasFreighter(): Promise<boolean> {
  try {
    const res = await isConnected();
    return !!res && (res as { isConnected?: boolean }).isConnected !== false;
  } catch {
    return false;
  }
}

// Whether the user has already granted this app access in Freighter. Used to
// decide if we can silently restore a session on load.
export async function isAllowed(): Promise<boolean> {
  try {
    const res = await freighterIsAllowed();
    if (typeof res === "boolean") return res;
    return !!(res as { isAllowed?: boolean }).isAllowed;
  } catch {
    return false;
  }
}

// Opens Freighter and returns the account the user approves. requestAccess is the
// method that triggers Freighter's popup (getAddress would connect silently); the
// account is whichever is active in Freighter, and the user picks it there.
export async function connect(): Promise<string> {
  if (!(await hasFreighter())) {
    throw new Error("Freighter not detected. Install the Freighter extension, then reload.");
  }
  const res = await requestAccess();
  const err = (res as { error?: { message?: string } }).error;
  if (err) throw new Error(err.message || "Freighter connection was declined.");
  const address = (res as { address?: string }).address;
  if (!address) throw new Error("Freighter did not return an address");
  return address;
}

export async function currentAddress(): Promise<string | null> {
  try {
    const res = await getAddress();
    return (res as { address?: string }).address ?? null;
  } catch {
    return null;
  }
}

// True when Freighter's active network matches the network this app is configured
// for (CONFIG.network). Works for both testnet and mainnet builds.
export async function onExpectedNetwork(): Promise<boolean> {
  try {
    const res = await getNetwork();
    const net = (res as { network?: string }).network ?? "";
    const want = CONFIG.network === "mainnet" ? "PUBLIC" : "TEST";
    return net.toUpperCase().includes(want);
  } catch {
    return false;
  }
}

// Returns the signed transaction XDR. Handles both v4 ({signedTxXdr}) and
// older (string) Freighter response shapes.
export async function sign(xdr: string, address: string): Promise<string> {
  const res = await signTransaction(xdr, {
    networkPassphrase: CONFIG.networkPassphrase,
    address,
  });
  if (typeof res === "string") return res;
  const signed = (res as { signedTxXdr?: string }).signedTxXdr;
  if (!signed) throw new Error("Freighter did not return a signed transaction");
  return signed;
}
