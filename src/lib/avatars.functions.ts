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
    console.log('syncWalletAvatar called with:', { walletAddress, handle });

    // Fetch the avatar from unavatar (server-side -> no CORS issue)
    const res = await fetch(`https://unavatar.io/twitter/${encodeURIComponent(handle)}`, {
      headers: { "User-Agent": "RitualTipFeed/1.0" },
    });
    console.log('Avatar fetch response:', { status: res.status, ok: res.ok });
    if (!res.ok) {
      console.log('Avatar fetch failed');
      return { avatarUrl: null as string | null, error: `Avatar fetch failed (${res.status})` };
    }
    const contentType = res.headers.get("content-type") || "image/png";
    const ext = contentType.includes("jpeg") ? "jpg"
      : contentType.includes("webp") ? "webp"
      : contentType.includes("gif") ? "gif"
      : "png";
    const bytes = new Uint8Array(await res.arrayBuffer());

    const path = `${walletAddress.toLowerCase()}.${ext}`;
    console.log('Uploading avatar to path:', path);
    const { error: upErr } = await supabaseAdmin.storage
      .from("wallet-avatars")
      .upload(path, bytes, { contentType, upsert: true });
    if (upErr) {
      console.log('Avatar upload error:', upErr);
      return { avatarUrl: null, error: upErr.message };
    }

    const { data: pub } = supabaseAdmin.storage.from("wallet-avatars").getPublicUrl(path);
    const avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;
    console.log('Public URL generated:', avatarUrl);

    const { error: dbErr } = await supabaseAdmin
      .from("wallet_profiles")
      .upsert(
        { wallet_address: walletAddress, x_handle: handle, avatar_url: avatarUrl },
        { onConflict: "wallet_address" },
      );
    if (dbErr) {
      console.log('Database upsert error:', dbErr);
      return { avatarUrl: null, error: dbErr.message };
    }
    console.log('Avatar sync completed successfully for wallet:', walletAddress);

    return { avatarUrl, error: null };
  });