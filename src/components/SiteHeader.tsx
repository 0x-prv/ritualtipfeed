import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import ritualLogo from "@/assets/ritual-logo.png";
import { shortAddr } from "@/lib/wallet";

export function SiteHeader({
  account,
  onConnect,
}: {
  account?: string | null;
  onConnect?: () => void;
}) {
  return (
    <header className="border-b border-border/60 backdrop-blur-md bg-background/40 sticky top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={ritualLogo}
            alt="Ritual"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
          />
          <div>
            <h1 className="text-lg font-bold tracking-tight">Ritual Tip Feed</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Ritual Chain · Testnet
            </p>
          </div>
        </Link>
        <nav className="hidden gap-1 md:flex">
          {[
            { to: "/", label: "Tips" },
            { to: "/trivia", label: "Trivia" },
            { to: "/checkin", label: "Check-in" },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: true }}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/30 data-[status=active]:bg-primary/15 data-[status=active]:text-accent data-[status=active]:font-semibold"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        {onConnect && (
          <Button onClick={onConnect} variant={account ? "secondary" : "default"} size="sm">
            <Wallet className="mr-2 h-4 w-4" />
            {account ? shortAddr(account) : "Connect"}
          </Button>
        )}
      </div>
      <nav className="flex justify-center gap-1 border-t border-border/40 py-2 md:hidden">
        {[
          { to: "/", label: "Tips" },
          { to: "/trivia", label: "Trivia" },
          { to: "/checkin", label: "Check-in" },
        ].map((l) => (
          <Link
            key={l.to}
            to={l.to}
            activeOptions={{ exact: true }}
            className="rounded-md px-3 py-1 text-xs text-muted-foreground hover:text-foreground data-[status=active]:bg-primary/15 data-[status=active]:text-accent data-[status=active]:font-semibold"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}