import { useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { avatarUrl, shortAddr } from "@/lib/wallet";
import { toPng } from "html-to-image";
import { Download, Share2 } from "lucide-react";
import { RitualLogo } from "./RitualLogo";

export type TipResult = {
  sender: string;
  recipient: string;
  amount: string;
  message: string;
  txHash: string;
};

export function ThankYouModal({
  tip,
  onClose,
}: {
  tip: TipResult | null;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  async function downloadPng() {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, {
      pixelRatio: 2,
      backgroundColor: "#0d1714",
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `ritual-tip-${Date.now()}.png`;
    a.click();
  }

  function shareOnX() {
    if (!tip) return;
    const text = `I just tipped ${tip.amount} RITUAL to ${shortAddr(
      tip.recipient
    )} on @ritualnet 🜂\n\n"${tip.message || "Keep ritualizing"}"\n\nI am a real Ritualist.`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  return (
    <Dialog open={!!tip} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md border-border bg-card">
        <DialogTitle className="sr-only">Thank you</DialogTitle>
        {tip && (
          <>
            <div
              ref={cardRef}
              className="relative overflow-hidden rounded-2xl p-6 text-center"
              style={{
                background: "var(--gradient-bg)",
                boxShadow: "var(--shadow-glow)",
                border: "1px solid oklch(0.4 0.1 150)",
              }}
            >
              <div className="absolute inset-0 opacity-10 [background:radial-gradient(circle_at_30%_20%,oklch(0.7_0.2_150),transparent_60%)]" />
              <div className="relative">
                <div className="mb-3 flex justify-center">
                  <RitualLogo size={40} />
                </div>
                <img
                  src={avatarUrl(tip.sender)}
                  alt=""
                  className="mx-auto h-24 w-24 rounded-xl border-2 border-primary bg-card"
                />
                <h3 className="mt-4 text-2xl font-bold tracking-tight text-accent">
                  You are a real Ritualist
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tipped on Ritual Chain
                </p>

                <div className="mt-5 rounded-xl border border-border bg-background/40 p-4 text-left text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From</span>
                    <span className="font-mono">{shortAddr(tip.sender)}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-muted-foreground">To</span>
                    <span className="font-mono">{shortAddr(tip.recipient)}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold text-accent">
                      {tip.amount} RITUAL
                    </span>
                  </div>
                  {tip.message && (
                    <p className="mt-3 border-t border-border pt-3 italic text-foreground/90">
                      "{tip.message}"
                    </p>
                  )}
                </div>

                <p className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground">
                  ritual.tip / feed
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button onClick={downloadPng} variant="secondary">
                <Download className="mr-2 h-4 w-4" />
                Download PNG
              </Button>
              <Button onClick={shareOnX}>
                <Share2 className="mr-2 h-4 w-4" />
                Share to X
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}