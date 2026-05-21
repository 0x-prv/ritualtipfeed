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
          <section className="w-full max-w-2xl rounded-2xl border border-border bg-card/70 p-5 sm:p-8" style={{ boxShadow: "var(--shadow-glow)" }}>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Step 3</p>
            <h2 className="mt-2 text-2xl font-bold">Welcome to Ritual Tip Feed</h2>
            <p className="mt-2 text-sm text-muted-foreground">You're ready. Start with Home to tip builders, then explore Check Ins and Trivia.</p>
            <div className="mt-5 flex items-center gap-4 rounded-xl border border-border bg-background/40 p-4">
              <img src={avatar} alt="X avatar" onError={() => setImgErr(true)} className="h-16 w-16 shrink-0 rounded-full border border-border object-cover sm:h-20 sm:w-20" />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{displayHandle}</p>
                <p className="truncate text-sm text-muted-foreground">@{displayHandle}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{shortAddr(account)}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Button onClick={() => navigate({ to: "/request-card" })}>Request Card</Button>
              <Button variant="secondary" onClick={() => navigate({ to: "/home" })}>Home</Button>
              <Button variant="secondary" onClick={() => navigate({ to: "/check-ins" })}>Check Ins</Button>
              <Button variant="secondary" onClick={() => navigate({ to: "/trivia" })}>Trivia</Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
