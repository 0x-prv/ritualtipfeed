import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { fetchHandle, saveHandle, useStoredAvatar, xAvatarUrl } from "@/lib/profiles";
import { avatarUrl, shortAddr } from "@/lib/wallet";
import { useWallet } from "@/lib/walletContext";

export const Route = createFileRoute("/")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { account, ready, connect, disconnect } = useWallet();
  const [xHandle, setXHandle] = useState<string | null | undefined>(undefined);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [inputHandle, setInputHandle] = useState("");
  const [saving, setSaving] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const storedAvatar = useStoredAvatar(account);

  useEffect(() => {
    if (!account) {
      setXHandle(undefined);
      setInputHandle("");
      return;
    }
    setCheckingHandle(true);
    fetchHandle(account)
      .then((h) => {
        setXHandle(h ?? null);
        setInputHandle(h ?? "");
      })
      .finally(() => setCheckingHandle(false));
  }, [account]);

  useEffect(() => {
    if (!showWelcome) return;
    const canvas = document.getElementById("confetti-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const colors = ["#1D9E75","#9FE1CB","#5DCAA5","#ffffff","#0F6E56"];
    const pieces = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 8 + 4,
      h: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.08,
      speed: Math.random() * 2 + 1,
      done: false,
    }));
    let frame = 0;
    let raf: number;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let allDone = true;
      pieces.forEach((p) => {
        if (p.done) return;
        allDone = false;
        p.y += p.speed;
        p.rot += p.rotSpeed;
        if (p.y > canvas.height) { p.done = true; return; }
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (!allDone && frame++ < 300) raf = requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    animate();
    return () => cancelAnimationFrame(raf);
  }, [showWelcome]);

  const displayHandle = xHandle?.trim().replace(/^@/, "") || "ritualist";
  const avatar = useMemo(() => {
    if (!account) return "";
    if (storedAvatar) return storedAvatar;
    if (xHandle && !imgErr) return xAvatarUrl(xHandle);
    return avatarUrl(account);
  }, [account, storedAvatar, xHandle, imgErr]);

  const showWalletStep = ready && !account;
  const showXStep = ready && !!account && !checkingHandle && xHandle === null;
  const showWelcome = ready && !!account && !checkingHandle && xHandle !== null;

  async function onConnect() {
    try {
      await connect();
      toast.success("Wallet connected");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to connect wallet");
    }
  }

  async function onSaveHandle() {
    if (!account) return;
    const clean = inputHandle.trim().replace(/^@/, "");
    if (!clean) return toast.error("Enter your X handle");
    setSaving(true);
    try {
      await saveHandle(account, clean);
      setXHandle(clean);
      toast.success("X connected");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to connect X");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Toaster theme="dark" position="top-center" richColors />
      <SiteHeader account={account} onConnect={onConnect} onDisconnect={disconnect} />

      <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-10">
        {showWalletStep && (
          <section className="w-full max-w-md rounded-2xl border border-border bg-card/70 p-6 text-center" style={{ boxShadow: "var(--shadow-glow)" }}>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Step 1</p>
            <h2 className="mt-2 text-2xl font-bold">Connect Wallet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Connect your wallet to begin onboarding.</p>
            <Button className="mt-6 w-full" onClick={onConnect}>Connect Wallet</Button>
          </section>
        )}

        {showXStep && (
          <section className="w-full max-w-md rounded-2xl border border-border bg-card/70 p-6 text-center" style={{ boxShadow: "var(--shadow-glow)" }}>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Step 2</p>
            <h2 className="mt-2 text-2xl font-bold">Connect X</h2>
            <p className="mt-2 text-sm text-muted-foreground">Add your X handle so we can show your profile on your welcome card.</p>
            <div className="mt-4 rounded-lg border border-border bg-background/60 px-3 py-2 text-left">
              <span className="mr-1 text-muted-foreground">@</span>
              <input value={inputHandle} onChange={(e) => setInputHandle(e.target.value)} className="w-[85%] bg-transparent outline-none" placeholder="yourhandle" />
            </div>
            <Button className="mt-4 w-full" onClick={onSaveHandle} disabled={saving}>{saving ? "Saving..." : "Continue"}</Button>
          </section>
        )}

        {showWelcome && account && (
          <section className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card/70 p-6 sm:p-8" style={{ boxShadow: "var(--shadow-glow)" }}>
            <canvas id="confetti-canvas" className="pointer-events-none absolute inset-0 h-full w-full rounded-2xl" />
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Step 3</p>
            <h2 className="mt-2 text-2xl font-bold">Welcome to Ritual Tip Feed</h2>
            <p className="mt-1 text-sm text-muted-foreground">You're all set. Tip builders, check in daily, and earn your place on the leaderboard.</p>
            <div className="mt-5 flex items-center gap-4 rounded-xl border border-border bg-background/40 p-4">
              <img src={avatar} alt="X avatar" onError={() => setImgErr(true)} className="h-16 w-16 shrink-0 rounded-full border border-border object-cover sm:h-20 sm:w-20" />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{displayHandle}</p>
                <p className="truncate text-sm text-accent">@{displayHandle}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{shortAddr(account)}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Network", value: "Ritual" },
                { label: "Status", value: "Active" },
                { label: "Testnet", value: "Chain" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-border bg-background/40 p-3 text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className={`mt-1 text-base font-semibold ${s.value === "Active" ? "text-accent" : ""}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button onClick={() => navigate({ to: "/request-card" })}>Request Gas</Button>
              <Button variant="secondary" onClick={() => navigate({ to: "/home" })}>Home</Button>
              <Button variant="secondary" onClick={() => navigate({ to: "/check-ins" })}>Check Ins</Button>
              <Button variant="secondary" onClick={() => navigate({ to: "/trivia" })}>Trivia</Button>
              <Button
                variant="secondary"
                className="col-span-2 bg-black text-white hover:bg-zinc-800"
                onClick={() => {
                  const text = encodeURIComponent(`Just joined Ritual Tip Feed on Ritual Chain Testnet!\n\nTip builders. Check in daily. Earn your spot.\n\n#RitualChain #RitualTipFeed`);
                  const url = encodeURIComponent("https://ritual-tip-feed-iwkg.vercel.app");
                  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
                }}
              >
                Share on X
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}