import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const syncWalletAvatar = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        walletAddress: z.string().min(4).max(100),
        handle: z.string().min(1).max(64).regex(/^[A-Za-z0-9_]+$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { walletAddress, handle } = data;

    // Fetch the avatar from unavatar (server-side -> no CORS issue)
    const res = await fetch(`https://unavatar.io/twitter/${encodeURIComponent(handle)}`, {
      headers: { "User-Agent": "RitualTipFeed/1.0" },
    });
    if (!res.ok) {
      return { avatarUrl: null as string | null, error: `Avatar fetch failed (${res.status})` };
    }
    const contentType = res.headers.get("content-type") || "image/png";
    const ext = contentType.includes("jpeg") ? "jpg"
      : contentType.includes("webp") ? "webp"
      : contentType.includes("gif") ? "gif"
      : "png";
    const bytes = new Uint8Array(await res.arrayBuffer());

    const path = `${walletAddress.toLowerCase()}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("wallet-avatars")
      .upload(path, bytes, { contentType, upsert: true });
    if (upErr) {
      return { avatarUrl: null, error: upErr.message };
    }

    const { data: pub } = supabaseAdmin.storage.from("wallet-avatars").getPublicUrl(path);
    const avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;

    const { error: dbErr } = await supabaseAdmin
      .from("wallet_profiles")
      .upsert(
        { wallet_address: walletAddress, x_handle: handle, avatar_url: avatarUrl },
        { onConflict: "wallet_address" },
      );
    if (dbErr) {
      return { avatarUrl: null, error: dbErr.message };
    }

    return { avatarUrl, error: null };
  });