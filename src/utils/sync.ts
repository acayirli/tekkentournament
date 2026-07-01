import type { AppData } from "../types";

const API_URL = "/api/data";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export async function loadFromBackend(): Promise<AppData | null> {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) return null;
    return (await res.json()) as AppData;
  } catch {
    return null;
  }
}

export function syncToBackend(data: AppData): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => {
      // Backend not available — silent fail, localStorage still works
    });
  }, 1000);
}
