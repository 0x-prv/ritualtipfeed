import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { TipForm } from "@/components/TipForm";
import { SiteHeader } from "@/components/SiteHeader";
import { TipsFeed } from "@/components/TipsFeed";
import { Leaderboard } from "@/components/Leaderboard";
import { GasRequests } from "@/components/GasRequests";
import { ThankYouModal, type TipResult } from "@/components/ThankYouModal";
import { connectWallet, shortAddr, TIP_CONTRACT } from "@/lib/wallet";

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

function Index() {
  const [account, setAccount] = useState<string | null>(null);
  const [prefillRecipient, setPrefillRecipient] = useState<string | undefined>();
  const [thankTip, setThankTip] = useState<TipResult | null>(null);

  async function handleConnect() {
    try {
      const a = await connectWallet();
      setAccount(a);
      toast.success("Connected to Ritual Chain");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to connect");
    }
  }

  function handleTipThem(addr: string) {
    setPrefillRecipient(addr);
    document.getElementById("tip-form")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen">
      <Toaster theme="dark" position="top-center" richColors />
      <SiteHeader account={account} onConnect={handleConnect} />

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

          <p className="text-center text-[10px] text-muted-foreground font-mono">
            contract {shortAddr(TIP_CONTRACT)}
          </p>
        </aside>

        {/* Right: Feed + gas requests */}
        <div className="space-y-6 md:col-span-2">
          <section className="rounded-2xl border border-border bg-card/60 p-6">
            <h3 className="mb-4 text-lg font-semibold">Recent tips</h3>
            <TipsFeed />
          </section>

          <section className="rounded-2xl border border-border bg-card/60 p-6">
            <h3 className="mb-1 text-lg font-semibold">Gas requests</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Out of testnet gas? Drop your address and let the community fuel you.
            </p>
            <GasRequests onTipThem={handleTipThem} />
          </section>
        </div>
      </main>

      <ThankYouModal tip={thankTip} onClose={() => setThankTip(null)} />
    </div>
  );
}
