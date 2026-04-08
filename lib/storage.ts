import type { ReviewHistory } from "@/types/receipt";

const STORAGE_KEY = "review_history";
const MAX_ITEMS = 50;

export function loadHistory(): ReviewHistory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ReviewHistory[];
  } catch {
    return [];
  }
}

export function saveHistory(items: ReviewHistory[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = items.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage might be full or unavailable
  }
}
