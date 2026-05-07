import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { avatarUrl, shortAddr } from "@/lib/wallet";
import { toast } from "sonner";
import { Fuel } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type GasReq = {
  id: string;
  wallet_address: string;
  reason: string;
  created_at: string;
};

const schema = z.object({
  wallet: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  reason: z.string().trim().min(3, "Tell us why").max(280),
});

export function GasRequests({
  onTipThem,
}: {
  onTipThem: (address: string) => void;
}) {
  const [wallet, setWallet] = useState("");
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<GasReq[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("gas_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setItems(data as GasReq[]);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("gas-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gas_requests" },
        () => load()
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
      toast.error("Failed to submit");
    } else {
      toast.success("Gas request posted");
      setWallet("");
      setReason("");
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card/50 p-4">
        <div className="space-y-2">
          <Label htmlFor="gw">Your wallet address</Label>
          <Input
            id="gw"
            placeholder="0x…"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            className="font-mono"
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
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          <Fuel className="mr-2 h-4 w-4" />
          {loading ? "Posting…" : "Request Gas"}
        </Button>
      </form>

      <ul className="space-y-3">
        {items.map((g) => (
          <li
            key={g.id}
            className="rounded-xl border border-border bg-card/60 p-4"
          >
            <div className="flex items-center gap-3">
              <img
                src={avatarUrl(g.wallet_address)}
                alt=""
                className="h-9 w-9 rounded border border-border"
              />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs text-muted-foreground">
                  {shortAddr(g.wallet_address)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(g.created_at), { addSuffix: true })}
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onTipThem(g.wallet_address)}
              >
                Tip them
              </Button>
            </div>
            <p className="mt-2 text-sm text-foreground/90">{g.reason}</p>
          </li>
        ))}
        {!items.length && (
          <p className="text-sm text-muted-foreground">No requests yet.</p>
        )}
      </ul>
    </div>
  );
}