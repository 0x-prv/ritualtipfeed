import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchHandle, saveHandle, xAvatarUrl } from "@/lib/profiles";
import { avatarUrl, shortAddr } from "@/lib/wallet";
import { toast } from "sonner";
import { Twitter, Save } from "lucide-react";

export function ProfileSetup({ account }: { account: string | null }) {
  const [handle, setHandle] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    setImgErr(false);
    if (!account) {
      setHandle("");
      setSaved(null);
      return;
    }
    fetchHandle(account).then((h) => {
      setSaved(h);
      setHandle(h ?? "");
    });
  }, [account]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!account) return;
    setBusy(true);
    try {
      await saveHandle(account, handle);
      setSaved(handle.trim().replace(/^@/, "") || null);
      setImgErr(false);
      toast.success(handle ? "X profile linked" : "Profile cleared");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  if (!account) return null;

  const previewSrc =
    handle && !imgErr ? xAvatarUrl(handle) : avatarUrl(account);

  return (
    <form onSubmit={onSave} className="space-y-3">
      <div className="flex items-center gap-3">
        <img
          key={previewSrc}
          src={previewSrc}
          onError={() => setImgErr(true)}
          alt=""
          className="h-12 w-12 rounded-lg border border-border bg-muted"
        />
        <div className="min-w-0">
          <div className="font-mono text-xs text-muted-foreground">
            {shortAddr(account)}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {saved ? `linked: @${saved}` : "DiceBear fallback"}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="xh" className="flex items-center gap-1">
          <Twitter className="h-3.5 w-3.5" /> X / Twitter handle
        </Label>
        <Input
          id="xh"
          placeholder="prvvvritual"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />
        <p className="text-[10px] text-muted-foreground">
          We auto-fetch your avatar via unavatar.io. No OAuth.
        </p>
      </div>
      <Button type="submit" disabled={busy} size="sm" className="w-full">
        <Save className="mr-2 h-4 w-4" />
        {busy ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
