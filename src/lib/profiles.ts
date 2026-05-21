import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { avatarUrl } from "@/lib/wallet";

export function xAvatarUrl(handle: string) {
  const h = handle.trim().replace(/^@/, "");
  return `https://unavatar.io/twitter/${encodeURIComponent(h)}`;
}

type Profile = { handle: string | null; avatarUrl: string | null };
const cache = new Map<string, Profile>();
const inflight = new Map<string, Promise<Profile>>();
const listeners = new Map<string, Set<(p: Profile) => void>>();

function notify(addr: string, p: Profile) {
  const ls = listeners.get(addr);
  if (ls) ls.forEach((fn) => fn(p));
}

async function fetchProfile(address: string): Promise<Profile> {
  const key = address.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  if (inflight.has(key)) return inflight.get(key)!;
  const p = (async () => {
    const { data } = await supabase
      .from("wallet_profiles")
      .select("x_handle, avatar_url")
      .ilike("wallet_address", address)
      .maybeSingle();
    const profile: Profile = {
      handle: (data?.x_handle ?? null) || null,
      avatarUrl: (data?.avatar_url ?? null) || null,
    };
    cache.set(key, profile);
    notify(key, profile);
    inflight.delete(key);
    return profile;
  })();
  inflight.set(key, p);
  return p;
}

export async function fetchHandle(address: string): Promise<string | null> {
  return (await fetchProfile(address)).handle;
}

export function setProfileLocal(address: string, p: Partial<Profile>) {
  const key = address.toLowerCase();
  const prev = cache.get(key) ?? { handle: null, avatarUrl: null };
  const next = { ...prev, ...p };
  cache.set(key, next);
  notify(key, next);
}

export async function saveHandle(address: string, handle: string) {
  const clean = handle.trim().replace(/^@/, "");
  const xAvatar = clean ? xAvatarUrl(clean) : null;

  const { error } = await supabase
    .from("wallet_profiles")
    .upsert(
      { wallet_address: address, x_handle: clean || null, avatar_url: xAvatar },
      { onConflict: "wallet_address" },
    );
  if (error) throw error;
  setProfileLocal(address, { handle: clean || null, avatarUrl: xAvatar });
}

export function useHandle(address?: string | null) {
  const [handle, setHandle] = useState<string | null>(() =>
    address ? cache.get(address.toLowerCase())?.handle ?? null : null,
  );
  useEffect(() => {
    if (!address) {
      setHandle(null);
      return;
    }
    const key = address.toLowerCase();
    const cb = (p: Profile) => setHandle(p.handle);
    const set = listeners.get(key) ?? new Set<(p: Profile) => void>();
    set.add(cb);
    listeners.set(key, set);
    if (cache.has(key)) {
      setHandle(cache.get(key)!.handle);
    } else {
      fetchProfile(address).then((p) => setHandle(p.handle));
    }
    return () => {
      set.delete(cb);
    };
  }, [address]);
  return handle;
}

export function useStoredAvatar(address?: string | null) {
  const [url, setUrl] = useState<string | null>(() =>
    address ? cache.get(address.toLowerCase())?.avatarUrl ?? null : null,
  );
  useEffect(() => {
    if (!address) {
      setUrl(null);
      return;
    }
    const key = address.toLowerCase();
    const cb = (p: Profile) => setUrl(p.avatarUrl);
    const set = listeners.get(key) ?? new Set<(p: Profile) => void>();
    set.add(cb);
    listeners.set(key, set);
    if (cache.has(key)) {
      setUrl(cache.get(key)!.avatarUrl);
    } else {
      fetchProfile(address).then((p) => setUrl(p.avatarUrl));
    }
    return () => {
      set.delete(cb);
    };
  }, [address]);
  return url;
}

export function resolvedAvatar(address: string, handle?: string | null, stored?: string | null) {
  return stored || (handle ? xAvatarUrl(handle) : avatarUrl(address));
}