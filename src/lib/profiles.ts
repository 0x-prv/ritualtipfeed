import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { avatarUrl } from "@/lib/wallet";

export function xAvatarUrl(handle: string) {
  const h = handle.trim().replace(/^@/, "");
  return `https://unavatar.io/twitter/${encodeURIComponent(h)}`;
}

const cache = new Map<string, string | null>(); // address(lower) -> handle | null
const inflight = new Map<string, Promise<string | null>>();
const listeners = new Map<string, Set<(h: string | null) => void>>();

function notify(addr: string, handle: string | null) {
  const ls = listeners.get(addr);
  if (ls) ls.forEach((fn) => fn(handle));
}

export async function fetchHandle(address: string): Promise<string | null> {
  const key = address.toLowerCase();
  if (cache.has(key)) return cache.get(key) ?? null;
  if (inflight.has(key)) return inflight.get(key)!;
  const p = (async () => {
    const { data } = await supabase
      .from("wallet_profiles")
      .select("x_handle")
      .ilike("wallet_address", address)
      .maybeSingle();
    const h = (data?.x_handle ?? null) || null;
    cache.set(key, h);
    notify(key, h);
    inflight.delete(key);
    return h;
  })();
  inflight.set(key, p);
  return p;
}

export function setHandleLocal(address: string, handle: string | null) {
  const key = address.toLowerCase();
  cache.set(key, handle);
  notify(key, handle);
}

export async function saveHandle(address: string, handle: string) {
  const clean = handle.trim().replace(/^@/, "");
  const { error } = await supabase
    .from("wallet_profiles")
    .upsert(
      { wallet_address: address, x_handle: clean || null },
      { onConflict: "wallet_address" },
    );
  if (error) throw error;
  setHandleLocal(address, clean || null);
}

export function useHandle(address?: string | null) {
  const [handle, setHandle] = useState<string | null>(() =>
    address ? cache.get(address.toLowerCase()) ?? null : null,
  );
  useEffect(() => {
    if (!address) {
      setHandle(null);
      return;
    }
    const key = address.toLowerCase();
    const set = listeners.get(key) ?? new Set();
    set.add(setHandle);
    listeners.set(key, set);
    if (cache.has(key)) {
      setHandle(cache.get(key) ?? null);
    } else {
      fetchHandle(address).then(setHandle);
    }
    return () => {
      set.delete(setHandle);
    };
  }, [address]);
  return handle;
}

export function resolvedAvatar(address: string, handle?: string | null) {
  return handle ? xAvatarUrl(handle) : avatarUrl(address);
}
