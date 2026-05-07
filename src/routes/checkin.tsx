import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { connectWallet, avatarUrl, shortAddr } from "@/lib/wallet";
import { WalletAvatar } from "@/components/WalletAvatar";
import { toPng } from "html-to-image";
import { Download, Share2, Flame, Trophy, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/checkin")({
  component: CheckinPage,
  head: () => ({
    meta: [
      { title: "Daily Check-in — Ritual Tip Feed" },
      {
        name: "description",
        content:
          "Check in once a day on Ritual Chain. Build your streak and climb the leaderboard.",
      },
    ],
  }),
});

type Row = { wallet_address: string; check_in_date: string };

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function computeStreak(dates: string[]): number {
  // dates: YYYY-MM-DD ascending unique. Streak = consecutive days ending today or yesterday.
  if (!dates.length) return 0;
  const set = new Set(dates);
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  let cursor = new Date(today);
  if (!set.has(fmt(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!set.has(fmt(cursor))) return 0;
  }
  let streak = 0;
  while (set.has(fmt(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function CheckinPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [checkedToday, setCheckedToday] = useState(false);
  const [board, setBoard] = useState<{ address: string; streak: number }[]>([]);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  async function handleConnect() {
    try {
      const a = await connectWallet();
      setAccount(a);
    } catch (e: any) {
      toast.error(e?.message ?? "Connect failed");
    }
  }

  async function loadMine(addr: string) {
    const { data } = await supabase
      .from("check_ins")
      .select("check_in_date")
      .ilike("wallet_address", addr)
      .order("check_in_date", { ascending: true });
    const dates = (data ?? []).map((r: any) => r.check_in_date as string);
    setStreak(computeStreak(dates));
    setCheckedToday(dates.includes(todayUTC()));
  }

  async function loadBoard() {
    const { data } = await supabase
      .from("check_ins")
      .select("wallet_address, check_in_date")
      .order("check_in_date", { ascending: true })
      .limit(2000);
    if (!data) return;
    const byWallet = new Map<string, string[]>();
    for (const r of data as Row[]) {
      const k = r.wallet_address.toLowerCase();
      const arr = byWallet.get(k) ?? [];
      arr.push(r.check_in_date);
      byWallet.set(k, arr);
    }
    const list: { address: string; streak: number }[] = [];
    for (const [addr, dates] of byWallet) {
      list.push({ address: addr, streak: computeStreak(dates) });
    }
    list.sort((a, b) => b.streak - a.streak);
    setBoard(list.filter((r) => r.streak > 0).slice(0, 10));
  }

  useEffect(() => {
    loadBoard();
  }, []);

  useEffect(() => {
    if (account) loadMine(account);
  }, [account]);

  async function checkIn() {
    if (!account) return;
    setBusy(true);
    const { error } = await supabase.from("check_ins").insert({
      wallet_address: account,
      check_in_date: todayUTC(),
    });
    setBusy(false);
    if (error) {
      if (error.code === "23505") {
        toast.info("Already checked in today");
        setCheckedToday(true);
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Checked in 🔥");
    await Promise.all([loadMine(account), loadBoard()]);
  }

  async function downloadPng() {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, {
      pixelRatio: 2,
      backgroundColor: "#0d1714",
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `ritual-streak-${streak}.png`;
    a.click();
  }

  function shareX() {
    const text = `Day ${streak} streak on Ritual Tip Feed!\n\nI am a real Ritualist 🔥\n\nhttps://ritual-tip-feed--Prvvvritual04.replit.app/`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster theme="dark" position="top-center" richColors />
      <SiteHeader account={account} onConnect={handleConnect} />

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-2">
        <section
          className="rounded-2xl border border-border bg-card/60 p-6"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          <div className="mb-4 text-center">
            <p className="inline-block rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-accent">
              Daily Ritual
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Check in. Stay a <span className="text-accent">Ritualist</span>.
            </h2>
          </div>

          {!account ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                Connect MetaMask to start your streak.
              </p>
              <Button onClick={handleConnect}>Connect MetaMask</Button>
            </div>
          ) : (
            <>
              <div
                ref={cardRef}
                className="relative overflow-hidden rounded-2xl p-6 text-center"
                style={{
                  background: "var(--gradient-bg)",
                  border: "1px solid oklch(0.4 0.1 150)",
                }}
              >
                <div className="absolute inset-0 opacity-10 [background:radial-gradient(circle_at_70%_20%,oklch(0.7_0.2_150),transparent_60%)]" />
                <div className="relative">
                  <img
                    src={avatarUrl(account)}
                    alt=""
                    className="mx-auto h-20 w-20 rounded-xl border-2 border-primary bg-card"
                  />
                  <p className="mt-3 font-mono text-xs text-muted-foreground">
                    {shortAddr(account)}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Flame className="h-7 w-7 text-accent" />
                    <span className="text-4xl font-bold text-accent">
                      {streak}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      day{streak === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-foreground/80">
                    {streak > 0
                      ? "I am a real Ritualist 🔥"
                      : "Start your streak today."}
                  </p>
                  <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                    ritual.tip / feed
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <Button
                  onClick={checkIn}
                  disabled={busy || checkedToday}
                  className="col-span-3"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {checkedToday ? "Checked in today" : busy ? "Checking…" : "Check in"}
                </Button>
                <Button onClick={downloadPng} variant="secondary">
                  <Download className="mr-2 h-4 w-4" />
                  PNG
                </Button>
                <Button onClick={shareX} className="col-span-2">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share to X
                </Button>
              </div>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card/60 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-accent" />
            Longest streaks
          </h3>
          {!board.length ? (
            <p className="text-sm text-muted-foreground">
              No streaks yet. Be first.
            </p>
          ) : (
            <ol className="space-y-2">
              {board.map((r, i) => (
                <li
                  key={r.address}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card/60 p-3"
                >
                  <span className="w-6 text-center font-bold text-accent">
                    {i + 1}
                  </span>
                  <WalletAvatar
                    address={r.address}
                    className="h-8 w-8 rounded border border-border"
                  />
                  <span className="font-mono text-xs text-muted-foreground">
                    {shortAddr(r.address)}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-sm font-semibold text-foreground">
                    <Flame className="h-4 w-4 text-accent" />
                    {r.streak}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
}