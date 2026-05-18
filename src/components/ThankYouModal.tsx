import { useRef, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { shortAddr } from "@/lib/wallet";
import { useHandle, xAvatarUrl } from "@/lib/profiles";
import { avatarUrl } from "@/lib/wallet";
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

function AvatarImg({ address }: { address: string }) {
  const handle = useHandle(address);
  const [errored, setErrored] = useState(false);
  const src = handle && !errored ? xAvatarUrl(handle) : avatarUrl(address);
  return (
    <img
      src={src}
      alt=""
      crossOrigin="anonymous"
      onError={() => setErrored(true)}
      className="h-full w-full object-cover"
    />
  );
}

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
      backgroundColor: "#0a1510",
      skipFonts: false,
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `ritualist-${Date.now()}.png`;
    a.click();
  }

  function shareOnX() {
    if (!tip) return;
    const text = `Just tipped ${tip.amount} RITUAL to ${shortAddr(tip.recipient)} on @ritualnet 🜂\n\n${tip.message ? `"${tip.message}"\n\n` : ""}I am a real Ritualist. 🔥\n\n#RitualChain #Ritualist`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  return (
    <Dialog open={!!tip} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm border-0 bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">Thank you card</DialogTitle>
        {tip && (
          <div className="flex flex-col gap-3">
            {/* ── THE CARD ── */}
            <div
              ref={cardRef}
              style={{
                background: "linear-gradient(145deg, #0d1f16 0%, #071009 50%, #0a1a10 100%)",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                borderRadius: "20px",
                overflow: "hidden",
                position: "relative",
                padding: "32px 28px 28px",
                border: "1px solid oklch(0.38 0.08 150 / 0.6)",
                boxShadow: "0 0 60px -10px oklch(0.55 0.18 150 / 0.35), inset 0 1px 0 oklch(0.6 0.15 150 / 0.2)",
              }}
            >
              {/* Background glow blobs */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: "20px",
              }}>
                <div style={{
                  position: "absolute", top: "-40px", left: "-40px", width: "200px", height: "200px",
                  background: "radial-gradient(circle, oklch(0.55 0.18 150 / 0.12) 0%, transparent 70%)",
                  borderRadius: "50%",
                }} />
                <div style={{
                  position: "absolute", bottom: "-20px", right: "-20px", width: "160px", height: "160px",
                  background: "radial-gradient(circle, oklch(0.48 0.14 152 / 0.1) 0%, transparent 70%)",
                  borderRadius: "50%",
                }} />
                {/* Subtle grid lines */}
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: "linear-gradient(oklch(0.55 0.15 150 / 0.04) 1px, transparent 1px), linear-gradient(90deg, oklch(0.55 0.15 150 / 0.04) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }} />
              </div>

              {/* Top row: logo + badge */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <RitualLogo size={28} />
                  <span style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "oklch(0.62 0.16 150)", fontFamily: "monospace" }}>
                    Ritual Tip Feed
                  </span>
                </div>
                <div style={{
                  fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase",
                  color: "oklch(0.55 0.14 150 / 0.8)", border: "1px solid oklch(0.4 0.1 150 / 0.4)",
                  padding: "3px 8px", borderRadius: "999px", fontFamily: "monospace",
                }}>
                  Testnet
                </div>
              </div>

              {/* Avatar + name */}
              <div style={{ position: "relative", textAlign: "center", marginBottom: "20px" }}>
                {/* Hexagonal avatar frame */}
                <div style={{
                  position: "relative", display: "inline-block",
                  width: "88px", height: "88px", margin: "0 auto 12px",
                }}>
                  <div style={{
                    width: "88px", height: "88px", borderRadius: "20px", overflow: "hidden",
                    border: "2px solid oklch(0.55 0.16 150 / 0.7)",
                    boxShadow: "0 0 20px oklch(0.55 0.18 150 / 0.3)",
                  }}>
                    <AvatarImg address={tip.sender} />
                  </div>
                  {/* Green dot */}
                  <div style={{
                    position: "absolute", bottom: "4px", right: "4px",
                    width: "14px", height: "14px", borderRadius: "50%",
                    background: "oklch(0.62 0.2 150)", border: "2px solid #0d1f16",
                    boxShadow: "0 0 8px oklch(0.62 0.2 150 / 0.8)",
                  }} />
                </div>

                <div style={{
                  fontSize: "22px", fontWeight: "700", color: "oklch(0.96 0.015 150)",
                  letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "4px",
                }}>
                  You are a real
                </div>
                <div style={{
                  fontSize: "26px", fontWeight: "800",
                  background: "linear-gradient(135deg, oklch(0.62 0.2 150), oklch(0.75 0.18 145))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.02em",
                }}>
                  Ritualist 🜂
                </div>
              </div>

              {/* Tip details */}
              <div style={{
                background: "oklch(0.13 0.02 160 / 0.7)",
                border: "1px solid oklch(0.35 0.06 150 / 0.4)",
                borderRadius: "12px", padding: "14px 16px",
                marginBottom: tip.message ? "12px" : "0",
              }}>
                {[
                  { label: "From", value: shortAddr(tip.sender) },
                  { label: "To", value: shortAddr(tip.recipient) },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", color: "oklch(0.6 0.02 150)", fontFamily: "monospace" }}>{row.label}</span>
                    <span style={{ fontSize: "11px", color: "oklch(0.85 0.015 150)", fontFamily: "monospace" }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid oklch(0.3 0.04 150 / 0.3)", paddingTop: "8px" }}>
                  <span style={{ fontSize: "11px", color: "oklch(0.6 0.02 150)", fontFamily: "monospace" }}>Amount</span>
                  <span style={{
                    fontSize: "13px", fontWeight: "700", fontFamily: "monospace",
                    color: "oklch(0.72 0.18 150)",
                    textShadow: "0 0 12px oklch(0.62 0.2 150 / 0.5)",
                  }}>{tip.amount} RITUAL</span>
                </div>
              </div>

              {/* Message */}
              {tip.message && (
                <div style={{
                  background: "oklch(0.13 0.02 160 / 0.5)",
                  border: "1px solid oklch(0.35 0.06 150 / 0.3)",
                  borderRadius: "10px", padding: "12px 14px",
                  marginBottom: "0",
                }}>
                  <p style={{
                    fontSize: "12px", fontStyle: "italic",
                    color: "oklch(0.8 0.015 150)", lineHeight: 1.5, margin: 0,
                  }}>
                    "{tip.message}"
                  </p>
                </div>
              )}

              {/* Footer */}
              <div style={{
                marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "oklch(0.45 0.05 150)", fontFamily: "monospace" }}>
                  ritual.tip / feed
                </span>
                <span style={{ fontSize: "9px", letterSpacing: "0.15em", color: "oklch(0.45 0.05 150)", fontFamily: "monospace" }}>
                  CHAIN ID 1979
                </span>
              </div>
            </div>

            {/* ── BUTTONS ── */}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={downloadPng} variant="secondary" className="h-11">
                <Download className="mr-2 h-4 w-4" />
                Download PNG
              </Button>
              <Button onClick={shareOnX} className="h-11" style={{ background: "linear-gradient(135deg, oklch(0.48 0.11 152), oklch(0.62 0.16 150))" }}>
                <Share2 className="mr-2 h-4 w-4" />
                Share to X
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}