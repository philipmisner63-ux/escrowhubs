export interface ViewedEscrow {
  address: string;
  type: "simple" | "milestone" | "unknown";
  title?: string;
  timestamp: number;
}

const KEY = "viewed_escrows";
const MAX = 20;

export function getViewedEscrows(): ViewedEscrow[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addViewedEscrow(escrow: Omit<ViewedEscrow, "timestamp">) {
  if (typeof window === "undefined") return;
  const existing = getViewedEscrows().filter(e => e.address !== escrow.address);
  const updated: ViewedEscrow[] = [{ ...escrow, timestamp: Date.now() }, ...existing].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(updated));
}
