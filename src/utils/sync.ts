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

/**
 * Optional observer invoked after every backend write attempt so the UI can
 * show whether data actually reached the server. `false` means the write
 * failed (e.g. the backend process is not running).
 */
export type SyncResultListener = (ok: boolean) => void;
let onResult: SyncResultListener | null = null;
export function setSyncResultListener(fn: SyncResultListener | null): void {
  onResult = fn;
}

async function post(data: AppData): Promise<boolean> {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const ok = res.ok;
    onResult?.(ok);
    return ok;
  } catch {
    onResult?.(false);
    return false;
  }
}

/** Debounced background sync (called on every state change). */
export function syncToBackend(data: AppData): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void post(data);
  }, 1000);
}

/**
 * Immediate, awaitable save. Cancels any pending debounced sync and waits for
 * the backend to confirm the write. Returns true only when data.json was
 * actually persisted. Used by the "Speichern" button and on reconciliation.
 */
export async function saveToBackend(data: AppData): Promise<boolean> {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  return post(data);
}

/**
 * Best-effort synchronous flush during page unload. sendBeacon survives tab
 * close / navigation where a normal fetch would be cancelled, so the last
 * edits reach the backend even if the user closes the app immediately.
 */
export function flushViaBeacon(data: AppData): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  try {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    navigator.sendBeacon(API_URL, blob);
  } catch {
    // ignore — localStorage remains the source of truth and reconciles on next load
  }
}
