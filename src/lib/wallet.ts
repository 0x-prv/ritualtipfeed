declare global {
  interface Window {
    ethereum?: any;
  }
}

export const RITUAL_CHAIN = {
  chainIdHex: "0x7BB", // 1979
  chainIdDec: 1979,
  chainName: "Ritual Chain Testnet",
  rpcUrls: ["https://rpc.ritualfoundation.org"],
  nativeCurrency: { name: "Ritual", symbol: "RITUAL", decimals: 18 },
  blockExplorerUrls: ["https://explorer.ritualfoundation.org"],
};

export const TIP_CONTRACT = "0xea93DaBc38A48A31763bD0a118ac8E849fE2C4b0";

export async function ensureRitualNetwork() {
  if (!window.ethereum) throw new Error("MetaMask not detected");
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: RITUAL_CHAIN.chainIdHex }],
    });
  } catch (err: any) {
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: RITUAL_CHAIN.chainIdHex,
            chainName: RITUAL_CHAIN.chainName,
            rpcUrls: RITUAL_CHAIN.rpcUrls,
            nativeCurrency: RITUAL_CHAIN.nativeCurrency,
            blockExplorerUrls: RITUAL_CHAIN.blockExplorerUrls,
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

export async function connectWallet(): Promise<string> {
  if (!window.ethereum) throw new Error("MetaMask is not installed");
  const accounts: string[] = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  await ensureRitualNetwork();
  return accounts[0];
}

function toHexWei(amountRitual: string): string {
  // amount in RITUAL (18 decimals). Use BigInt math from string to avoid float issues.
  const [whole, frac = ""] = amountRitual.trim().split(".");
  const fracPadded = (frac + "0".repeat(18)).slice(0, 18);
  const wei = BigInt(whole || "0") * 10n ** 18n + BigInt(fracPadded || "0");
  return "0x" + wei.toString(16);
}

export async function sendTip(params: {
  from: string;
  to: string;
  amountRitual: string;
}): Promise<string> {
  if (!window.ethereum) throw new Error("MetaMask is not installed");
  await ensureRitualNetwork();
  const value = toHexWei(params.amountRitual);
  const txHash: string = await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: params.from,
        to: params.to,
        value,
      },
    ],
  });
  return txHash;
}

export function shortAddr(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(
    seed.toLowerCase()
  )}`;
}