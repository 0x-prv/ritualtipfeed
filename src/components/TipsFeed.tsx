import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { shortAddr } from "@/lib/wallet";
import { PixelCat } from "@/components/PixelCat";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight } from "lucide-react";
import { getLocalTips, subscribeLocalTips, type LocalTip } from "@/lib/localTips";

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
  const [local, setLocal] = useState<LocalTip[]>(() => getLocalTips());
  const [now, setNow] = useState(() => Date.now());

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
    const unsub = subscribeLocalTips(() => {
      setLocal(getLocalTips());
      setNow(Date.now());
    });
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      supabase.removeChannel(ch);
      unsub();
      clearInterval(t);
    };
  }, []);

  const merged = useMemo(() => {
    const seen = new Set<string>();
    const all: (Tip | LocalTip)[] = [];
    for (const t of [...local, ...tips]) {
      const k = `${t.sender_address}-${t.recipient_address}-${t.created_at}`;
      if (seen.has(k)) continue;
      seen.add(k);
      all.push(t);
    }
    return all
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 10);
  }, [tips, local]);

  if (!merged.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No tips yet. Be the first Ritualist to send one.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {merged.map((t) => {
        const ageMs = now - +new Date(t.created_at);
        const isNew = ageMs < 3000;
        return (
        <li
          key={t.id}
          className={
            "rounded-xl border bg-card/60 p-4 backdrop-blur-sm transition hover:border-primary/60 " +
            (isNew
              ? "border-teal-400/70 shadow-[0_0_24px_-4px_rgba(45,212,191,0.55)] animate-pulse"
              : "border-border")
          }
        >
          <div className="flex items-center gap-3">
            <PixelCat
              seed={t.sender_address}
              size={40}
              className="h-10 w-10 rounded-lg border border-border"
            />
            <ArrowRight className="h-4 w-4 text-primary" />
            <PixelCat
              seed={t.recipient_address}
              size={40}
              className="h-10 w-10 rounded-lg border border-border"
            />
            <div className="ml-auto flex items-center gap-2 text-right">
              {isNew && (
                <span className="rounded-full bg-teal-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-300">
                  New
                </span>
              )}
              <div>
              <div className="text-base font-semibold text-primary-foreground">
                <span className="text-accent">{t.amount}</span>{" "}
                <span className="text-xs text-muted-foreground">RITUAL</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
              </div>
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
      );
      })}
    </ul>
  );
}