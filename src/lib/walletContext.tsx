import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { connectWallet as requestConnect, ensureRitualNetwork } from "@/lib/wallet";

const STORAGE_KEY = "ritual.wallet.account";
const DISCONNECT_KEY = "walletDisconnected";
const LEGACY_DISCONNECT_KEY = "ritual.wallet.disconnected";

type WalletCtx = {
  account: string | null;
  ready: boolean;
  connecting: boolean;
  connect: () => Promise<string | null>;
  disconnect: () => void;
};

const Ctx = createContext<WalletCtx | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Never auto-connect: wallet state is only established via explicit user action.
  useEffect(() => {
    setReady(true);

    const eth = (window as any).ethereum;
    if (!eth?.on) return;

    const onAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        setAccount(null);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(DISCONNECT_KEY, "true");
        localStorage.setItem(LEGACY_DISCONNECT_KEY, "1");
      } else {
        if (localStorage.getItem(DISCONNECT_KEY) === "true" || localStorage.getItem(LEGACY_DISCONNECT_KEY) === "1") return;
        setAccount(accounts[0]);
        localStorage.setItem(STORAGE_KEY, accounts[0]);
      }
    };
    const onChainChanged = () => {
      // no-op; we keep the same account
    };
    eth.on("accountsChanged", onAccountsChanged);
    eth.on("chainChanged", onChainChanged);
    return () => {
      eth.removeListener?.("accountsChanged", onAccountsChanged);
      eth.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  async function connect() {
    setConnecting(true);
    try {
      const a = await requestConnect();
      setAccount(a);
      localStorage.setItem(STORAGE_KEY, a);
      localStorage.removeItem(DISCONNECT_KEY);
      localStorage.removeItem(LEGACY_DISCONNECT_KEY);
      try { await ensureRitualNetwork(); } catch { /* ignore */ }
      return a;
    } finally {
      setConnecting(false);
    }
  }

  function disconnect() {
    setAccount(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(DISCONNECT_KEY, "true");
    localStorage.setItem(LEGACY_DISCONNECT_KEY, "1");
    sessionStorage.removeItem(STORAGE_KEY);
    // Best-effort: ask wallet to revoke permissions (MetaMask 11+)
    const eth = (window as any).ethereum;
    try {
      eth?.request?.({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      }).catch(() => {});
    } catch { /* ignore */ }
  }

  return (
    <Ctx.Provider value={{ account, ready, connecting, connect, disconnect }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWallet() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWallet must be used inside <WalletProvider>");
  return v;
}
