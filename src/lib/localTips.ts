export type LocalTip = {
  id: string;
  sender_address: string;
  recipient_address: string;
  amount: number;
  message: string | null;
  created_at: string;
  _local: true;
};

const KEY = "ritual:local-tips";
const EVT = "ritual:local-tips-updated";
const MAX = 10;

export function getLocalTips(): LocalTip[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addLocalTip(tip: Omit<LocalTip, "id" | "created_at" | "_local"> & { id?: string; created_at?: string }): LocalTip {
  const entry: LocalTip = {
    id: tip.id ?? `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sender_address: tip.sender_address,
    recipient_address: tip.recipient_address,
    amount: tip.amount,
    message: tip.message ?? null,
    created_at: tip.created_at ?? new Date().toISOString(),
    _local: true,
  };
  const next = [entry, ...getLocalTips()].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVT, { detail: entry }));
  } catch {
    // ignore
  }
  return entry;
}

export function subscribeLocalTips(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener("storage", handler);
  };
}