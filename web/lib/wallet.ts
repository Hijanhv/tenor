import {
  isConnected,
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

export async function connect(): Promise<string> {
  const res = await requestAccess();
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

export async function onTestnet(): Promise<boolean> {
  try {
    const res = await getNetwork();
    const net = (res as { network?: string }).network ?? "";
    return net.toUpperCase().includes("TEST");
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
