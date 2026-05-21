import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { shortAddr } from "@/lib/wallet";
import { toast } from "sonner";
import { Fuel, Copy, Share2, Twitter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { addLocalTip } from "@/lib/localTips";
import { useNavigate } from "@tanstack/react-router";
import { WalletAvatar } from "@/components/WalletAvatar";

type GasReq = {
  id: string;
  wallet_address: string;
  reason: string;
  created_at: string;
};

const schema = z.object({
  wallet: z.string().trim().min(4).max(100),
  reason: z.string().trim().min(3, "Tell us why").max(280),
});

function initials(addr: string) {
  const a = addr.replace(/^0x/, "");
  return (a.slice(0, 2) + a.slice(-2)).toUpperCase();
}

async function copy(text: string, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error("Copy failed");
  }
}

export function GasRequestsPage() {
  const [wallet, setWallet] = useState("");
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<GasReq[]>([]);
  const [loading, setLoading] = useState(false);
  const [shareOf, setShareOf] = useState<GasReq | null>(null);
  const navigate = useNavigate();

  async function load() {
    const { data } = await supabase
      .from("gas_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setItems(data as GasReq[]);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("gas-requests-page")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gas_requests" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ wallet, reason });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("gas_requests").insert({
      wallet_address: parsed.data.wallet,
      reason: parsed.data.reason,
    });
    setLoading(false);
    if (error) {
      console.error("Supabase error:", error);
      toast.error(error.message ?? "Failed to submit");
    } else {
      toast.success("Gas request posted");
      setWallet("");
      setReason("");
      navigate({ to: "/" });
    }
  }

  function tweetUrl(g: GasReq) {
    const text = `Need gas on @ritualnet 🔥\n\n${g.reason}\n\nSend to: ${g.wallet_address}\n\nvia Ritual Tip Feed`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8">
      <Toaster theme="dark" position="bottom-center" richColors />
      <header className="space-y-2">
        <button
          onClick={() => navigate({ to: "/" })}
          className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to home
        </button>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
          <Fuel className="h-3.5 w-3.5 text-accent" /> Gas Requests
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Need testnet gas?</h1>
        <p className="text-sm text-muted-foreground">
          Drop your wallet and the community can top you up.
        </p>
      </header>

      <form
        onSubmit={submit}
        className="space-y-3 rounded-xl border border-border bg-card/50 p-4 sm:p-5"
      >
        <div className="space-y-2">
          <Label htmlFor="gw">Your wallet address</Label>
          <Input
            id="gw"
            placeholder="0x…"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            className="h-11 w-full font-mono text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gr">Why do you need gas?</Label>
          <Textarea
            id="gr"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={280}
            placeholder="Building a Ritual oracle but out of testnet gas…"
            className="min-h-[96px] w-full text-sm"
          />
          <div className="text-right text-[10px] text-muted-foreground">
            {reason.length}/280
          </div>
        </div>
        <Button type="submit" disabled={loading} className="h-11 w-full">
          <Fuel className="mr-2 h-4 w-4" />
          {loading ? "Posting…" : "Request Gas"}
        </Button>
      </form>

      <ul className="space-y-3">
        {items.map((g) => (
          <li
            key={g.id}
            className="space-y-3 rounded-xl border border-border bg-card/60 p-4"
          >
            <div className="flex items-center gap-3">
              <WalletAvatar
                address={g.wallet_address}
                className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-xs text-muted-foreground">
                  {shortAddr(g.wallet_address)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(g.created_at), { addSuffix: true })}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShareOf(g)}
                aria-label="Share"
                className="h-11 w-11 shrink-0"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            <p className="break-words text-sm text-foreground/90">{g.reason}</p>

            <div className="flex min-w-0 items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2">
              <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
                {g.wallet_address}
              </code>
              <Button
                size="icon"
                variant="ghost"
                className="h-11 w-11 shrink-0"
                onClick={() => copy(g.wallet_address, "Address copied")}
                aria-label="Copy address"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button
              size="sm"
              variant="secondary"
              className="h-11 w-full"
              onClick={() => copy(g.wallet_address, "Address copied — tip them!")}
            >
              Tip them
            </Button>
          </li>
        ))}
        {!items.length && (
          <p className="text-sm text-muted-foreground">No requests yet.</p>
        )}
      </ul>

      <Dialog open={!!shareOf} onOpenChange={(o) => !o && setShareOf(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Share gas request</DialogTitle>
          </DialogHeader>
          {shareOf && (
            <div className="space-y-4">
              <p className="break-words text-sm text-foreground/90">{shareOf.reason}</p>
              <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-2">
                <code className="min-w-0 flex-1 truncate font-mono text-[11px]">
                  {shareOf.wallet_address}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-11 w-11 shrink-0"
                  onClick={() => copy(shareOf.wallet_address, "Address copied")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              
                href={tweetUrl(shareOf)}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Button className="h-11 w-full">
                  <Twitter className="mr-2 h-4 w-4" />
                  Share on X
                </Button>
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}