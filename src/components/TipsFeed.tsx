import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { shortAddr } from "@/lib/wallet";
import { WalletAvatar } from "@/components/WalletAvatar";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight } from "lucide-react";

type Tip = {
  id: string;
  sender_address: string;
  recipient_address: string;
  amount: number;
  message: string | null;
  created_at: string;
};

export function TipsFeed() {
  const [tips, setTips] = useState<Tip[]>([]);

  async function load() {
    const { data } = await supabase
      .from("tips")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setTips(data as Tip[]);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("tips-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tips" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  if (!tips.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No tips yet. Be the first Ritualist to send one.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {tips.map((t) => (
        <li
          key={t.id}
          className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm transition hover:border-primary/60"
        >
          <div className="flex items-center gap-3">
            <WalletAvatar
              address={t.sender_address}
              className="h-10 w-10 rounded-lg border border-border bg-muted"
            />
            <ArrowRight className="h-4 w-4 text-primary" />
            <WalletAvatar
              address={t.recipient_address}
              className="h-10 w-10 rounded-lg border border-border bg-muted"
            />
            <div className="ml-auto text-right">
              <div className="text-base font-semibold text-primary-foreground">
                <span className="text-accent">{t.amount}</span>{" "}
                <span className="text-xs text-muted-foreground">RITUAL</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
            <span>from {shortAddr(t.sender_address)}</span>
            <span>to {shortAddr(t.recipient_address)}</span>
          </div>
          {t.message && (
            <p className="mt-2 text-sm text-foreground/90">"{t.message}"</p>
          )}
        </li>
      ))}
    </ul>
  );
}