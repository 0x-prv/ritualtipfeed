import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { TipForm } from "@/components/TipForm";
import { SiteHeader } from "@/components/SiteHeader";
import { TipsFeed } from "@/components/TipsFeed";
import { Leaderboard } from "@/components/Leaderboard";
import { ThankYouModal, type TipResult } from "@/components/ThankYouModal";
import { ProfileSetup } from "@/components/ProfileSetup";
import { shortAddr, TIP_CONTRACT } from "@/lib/wallet";
import { fetchHandle, saveHandle } from "@/lib/profiles";
import { useWallet } from "@/lib/walletContext";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Ritual Tip Feed — Tip Ritual Chain builders" },
      {
        name: "description",
        content:
          "Tip Ritual Chain builders in RITUAL, share thank-you cards, and request testnet gas.",
      },
    ],
  }),
});

// ─── X Handle Gate Modal ───────────────────────────────────────────────────
function XGate({
  account,
  onDone,
}: {
  account: string;
  onDone: (handle: string) => void;
}) {
  const [handle, setHandle] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const clean = handle.trim().replace(/^@/, "");
    if (!clean) {
      toast.error("Please enter your X handle");
      return;
    }
    setSaving(true);
    try {
      await saveHandle(account, clean);
      toast.success(`X handle @${clean} linked!`);
      onDone(clean);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save handle");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm px-4">
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center"
        style={{ boxShadow: "var(--shadow-glow)" }}
      >
        {/* X logo */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-accent">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-foreground">Connect your X</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Link your X (Twitter) handle to participate in the Ritual Tip Feed community.
        </p>

        <div className="mt-6 space-y-3">
          <div className="flex items-center rounded-lg border border-border bg-input/50 px-3 py-2">
            <span className="text-muted-foreground text-sm mr-1">@</span>
            <input
              type="text"
              placeholder="yourhandle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            {saving ? "Saving…" : "Continue to Ritual Tip Feed →"}
          </button>
        </div>

        <p className="mt-4 text-[10px] text-muted-foreground">
          Your handle will appear in tips and leaderboard.
        </p>
      </div>
    </div>
  );
}

// ─── Connect Wallet Gate ───────────────────────────────────────────────────
function WalletGate({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm px-4">
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center"
        style={{ boxShadow: "var(--shadow-glow)" }}
      >
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7 text-accent">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-foreground">Connect your wallet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect to Ritual Chain to access the Tip Feed community.
        </p>

        <button
          onClick={onConnect}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          Connect Wallet →
        </button>
      </div>
    </div>
  );
}

// ─── Main Index ────────────────────────────────────────────────────────────
function Index() {
  const { account, ready, connect, disconnect } = useWallet();
  const [xHandle, setXHandle] = useState<string | null | undefined>(undefined);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [prefillRecipient, setPrefillRecipient] = useState<string | undefined>();
  const [thankTip, setThankTip] = useState<TipResult | null>(null);

  // When account connects, check if they already have an X handle
  useEffect(() => {
    if (!account) {
      setXHandle(undefined);
      return;
    }
    setCheckingHandle(true);
    fetchHandle(account)
      .then((h) => setXHandle(h ?? null))
      .finally(() => setCheckingHandle(false));
  }, [account]);

  async function handleConnect() {
    try {
      await connect();
      toast.success("Connected to Ritual Chain");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to connect");
    }
  }

  function handleDisconnect() {
    disconnect();
    setXHandle(undefined);
    toast.success("Wallet disconnected");
  }

  // Wait for restore to complete before deciding to show gates (avoids flicker
  // and avoids re-prompting on every navigation back to home).
  const showWalletGate = ready && !account;
  const showXGate = ready && !!account && !checkingHandle && xHandle === null;

  return (
    <div className="min-h-screen">
      <Toaster theme="dark" position="top-center" richColors />
      <SiteHeader account={account} onConnect={handleConnect} onDisconnect={handleDisconnect} />

      {/* Gates */}
      {showWalletGate && <WalletGate onConnect={handleConnect} />}
      {showXGate && (
        <XGate account={account!} onDone={(h) => {
          console.log('XGate onDone called with handle:', h);
          setXHandle(h);
        }} />
      )}

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <p className="mb-3 inline-block rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-accent">
            Ritual community · Tipping
          </p>
          <h2 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Send a token of{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-ritual)" }}
            >
              gratitude
            </span>{" "}
            on-chain
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Tip Ritual Chain builders, mint a thank-you card, request testnet gas —
            the whole community in one feed.
          </p>
        </div>
      </section>

      {/* Main grid */}
      <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 md:grid-cols-3">
        {/* Left: Tip form + leaderboard */}
        <aside className="space-y-6 md:col-span-1">
          <section
            id="tip-form"
            className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <h3 className="mb-1 text-lg font-semibold">Send a tip</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Native RITUAL transfer on Chain ID 1979.
            </p>
            <TipForm
              account={account}
              prefillRecipient={prefillRecipient}
              onSent={(t) => setThankTip(t)}
            />
          </section>

          <section className="rounded-2xl border border-border bg-card/60 p-6">
            <h3 className="mb-4 text-lg font-semibold">Top Tippers</h3>
            <Leaderboard />
          </section>

          {account && (
            <section className="rounded-2xl border border-border bg-card/60 p-6">
              <h3 className="mb-1 text-lg font-semibold">Your profile</h3>
              <p className="mb-4 text-xs text-muted-foreground">
                Link your X handle to use your real profile picture.
              </p>
              <ProfileSetup account={account} />
            </section>
          )}

          <p className="text-center text-[10px] text-muted-foreground font-mono">
            contract {shortAddr(TIP_CONTRACT)}
          </p>
        </aside>

        {/* Right: Feed */}
        <div className="space-y-6 md:col-span-2">
          <section className="rounded-2xl border border-border bg-card/60 p-6">
            <h3 className="mb-4 text-lg font-semibold">Recent tips</h3>
            <TipsFeed />
          </section>
        </div>
      </main>

      <ThankYouModal tip={thankTip} onClose={() => setThankTip(null)} />
    </div>
  );
}
