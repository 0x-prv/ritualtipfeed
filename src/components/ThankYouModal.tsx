import { useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { shortAddr } from "@/lib/wallet";
import { useHandle, useStoredAvatar, xAvatarUrl } from "@/lib/profiles";
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

export function ThankYouModal({ tip, onClose }: { tip: TipResult | null; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const handle = useHandle(tip?.sender ?? null);
  const stored = useStoredAvatar(tip?.sender ?? null);
  const finalAvatar = tip
    ? stored || (handle ? xAvatarUrl(handle) : avatarUrl(tip.sender))
    : "";

  async function downloadPng() {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: "#050e08" });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `ritualist-${Date.now()}.png`;
    a.click();
  }

  function shareOnX() {
    if (!tip) return;
    const text = `Just tipped ${tip.amount} RITUAL to ${shortAddr(tip.recipient)} on @ritualnet\n\n${tip.message ? `"${tip.message}"\n\n` : ""}I am a real Ritualist. 🔥\n\n#RitualChain #Ritualist`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  }

  if (!tip) return null;

  const xHandle = handle ? `@${handle}` : shortAddr(tip.sender);

  return (
    <Dialog open={!!tip} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm border-0 bg-transparent p-0 shadow-none [&>button]:text-white">
        <DialogTitle className="sr-only">Thank you card</DialogTitle>
        <div className="flex flex-col gap-3">
          <div
            ref={cardRef}
            style={{
              position: "relative",
              borderRadius: "24px",
              overflow: "hidden",
              padding: "2px",
              background: "linear-gradient(135deg, rgba(74,222,128,0.4) 0%, rgba(21,128,61,0.1) 50%, rgba(74,222,128,0.3) 100%)",
              boxShadow: "0 25px 60px -12px rgba(34,197,94,0.4), 0 0 0 1px rgba(74,222,128,0.15)",
            }}
          >
            <div
              style={{
                background: "linear-gradient(160deg, rgba(5,20,10,0.95) 0%, rgba(8,30,16,0.98) 40%, rgba(5,15,8,0.95) 100%)",
                backdropFilter: "blur(40px)",
                borderRadius: "22px",
                padding: "28px 24px 24px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", top: "-60px", left: "-60px", width: "220px", height: "220px", background: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: "-40px", right: "-40px", width: "180px", height: "180px", background: "radial-gradient(circle, rgba(21,128,61,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.5), transparent)", pointerEvents: "none" }} />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <RitualLogo size={26} />
                  <span style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(134,239,172,0.8)", fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>Ritual Tip Feed</span>
                </div>
                <div style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(134,239,172,0.6)", border: "1px solid rgba(74,222,128,0.25)", padding: "3px 10px", borderRadius: "999px", fontFamily: "monospace", background: "rgba(34,197,94,0.08)" }}>TESTNET</div>
              </div>

              <div style={{ textAlign: "center", marginBottom: "22px", position: "relative" }}>
                <div style={{ display: "inline-block", position: "relative", margin: "0 auto 14px" }}>
                  <div style={{ width: "96px", height: "96px", borderRadius: "50%", padding: "3px", background: "linear-gradient(135deg, rgba(74,222,128,0.8), rgba(21,128,61,0.4), rgba(74,222,128,0.8))", boxShadow: "0 0 30px rgba(34,197,94,0.5), 0 0 60px rgba(34,197,94,0.2)" }}>
                    <div style={{ width: "90px", height: "90px", borderRadius: "50%", overflow: "hidden", background: "#071a0c" }}>
                      {finalAvatar && <img src={finalAvatar} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                  </div>
                  <div style={{ position: "absolute", bottom: "4px", right: "4px", width: "16px", height: "16px", borderRadius: "50%", background: "linear-gradient(135deg, #4ade80, #16a34a)", border: "2px solid #050e08", boxShadow: "0 0 10px rgba(74,222,128,0.8)" }} />
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(134,239,172,0.9)", fontFamily: "ui-monospace, monospace", marginBottom: "10px", letterSpacing: "0.05em" }}>{xHandle}</div>
                <div style={{ fontSize: "13px", color: "rgba(187,247,208,0.7)", marginBottom: "4px" }}>You are a real</div>
                <div style={{ fontSize: "28px", fontWeight: 800, background: "linear-gradient(135deg, #4ade80 0%, #86efac 50%, #22c55e 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.03em", lineHeight: 1.1, filter: "drop-shadow(0 0 20px rgba(74,222,128,0.4))" }}>Ritualist</div>
              </div>

              {tip.message && (
                <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: "12px", padding: "12px 14px", marginBottom: "14px" }}>
                  <p style={{ fontSize: "12px", fontStyle: "italic", color: "rgba(187,247,208,0.85)", lineHeight: 1.6, margin: 0, textAlign: "center" }}>"{tip.message}"</p>
                </div>
              )}

              <div style={{ background: "rgba(5,20,10,0.6)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: "14px", padding: "14px 16px" }}>
                {[{ label: "From", value: shortAddr(tip.sender) }, { label: "To", value: shortAddr(tip.recipient) }].map((row, i) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: i === 0 ? "8px" : "0", paddingBottom: i === 0 ? "8px" : "0", borderBottom: i === 0 ? "1px solid rgba(74,222,128,0.08)" : "none" }}>
                    <span style={{ fontSize: "10px", color: "rgba(134,239,172,0.5)", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>{row.label}</span>
                    <span style={{ fontSize: "11px", color: "rgba(187,247,208,0.8)", fontFamily: "monospace" }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(74,222,128,0.12)" }}>
                  <span style={{ fontSize: "10px", color: "rgba(134,239,172,0.5)", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>Amount</span>
                  <span style={{ fontSize: "15px", fontWeight: 700, fontFamily: "monospace", background: "linear-gradient(135deg, #4ade80, #86efac)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 8px rgba(74,222,128,0.5))" }}>{tip.amount} RITUAL</span>
                </div>
              </div>

              <div style={{ marginTop: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(74,222,128,0.35)", fontFamily: "monospace" }}>ritual.tip / feed</span>
                <span style={{ fontSize: "8px", letterSpacing: "0.15em", color: "rgba(74,222,128,0.35)", fontFamily: "monospace" }}>CHAIN ID 1979</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={downloadPng} variant="secondary" className="h-11 border border-green-800/30 bg-green-950/50 text-green-300 hover:bg-green-900/50">
              <Download className="mr-2 h-4 w-4" />Download PNG
            </Button>
            <Button onClick={shareOnX} className="h-11" style={{ background: "linear-gradient(135deg, #15803d, #16a34a)", boxShadow: "0 4px 20px rgba(34,197,94,0.3)" }}>
              <Share2 className="mr-2 h-4 w-4" />Share to X
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
