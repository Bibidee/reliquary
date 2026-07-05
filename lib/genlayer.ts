import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "") as `0x${string}`;

export { CONTRACT_ADDRESS };

export function getReadClient() {
  return createClient({ chain: studionet });
}

export function getWriteClient(address: string) {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error("No injected wallet found.");
  return createClient({
    chain: studionet,
    provider: ethereum,
    account: address as `0x${string}`,
  });
}
