import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { shortAddr } from "@/lib/wallet";
import { WalletAvatar } from "@/components/WalletAvatar";
import { Trophy } from "lucide-react";

type Row = { address: string; total: number; count: number };

export function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tips")
        .select("sender_address, amount")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (!data) return;
      const map = new Map<string, Row>();
      for (const t of data as { sender_address: string; amount: number }[]) {
        const k = t.sender_address.toLowerCase();
        const cur = map.get(k) ?? { address: t.sender_address, total: 0, count: 0 };
        cur.total += Number(t.amount);
        cur.count += 1;
        map.set(k, cur);
      }
      const list = Array.from(map.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
      setRows(list);
    })();
  }, []);

  if (!rows.length)
    return <p className="text-sm text-muted-foreground">No tippers yet.</p>;

  return (
    <ol className="space-y-2">
      {rows.map((r, i) => (
        <li
          key={r.address}
          className="flex items-center gap-3 rounded-lg border border-border bg-card/60 p-3"
        >
          <span className="w-6 text-center font-bold text-accent">
            {i === 0 ? <Trophy className="mx-auto h-4 w-4" /> : i + 1}
          </span>
          <WalletAvatar
            address={r.address}
            className="h-8 w-8 rounded border border-border"
          />
          <span className="font-mono text-xs text-muted-foreground">
            {shortAddr(r.address)}
          </span>
          <span className="ml-auto text-sm font-semibold text-foreground">
            {r.total.toFixed(3)}{" "}
            <span className="text-xs text-muted-foreground">RITUAL</span>
          </span>
        </li>
      ))}
    </ol>
  );
}