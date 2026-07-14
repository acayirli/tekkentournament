import { create } from "zustand";

export type SyncState =
  | "synced" // backend confirmed the latest data
  | "pending" // local change not yet confirmed by backend
  | "error"; // last backend write failed (e.g. server not running)

interface SyncStatusStore {
  state: SyncState;
  lastSavedAt: number | null;
  markPending: () => void;
  markResult: (ok: boolean, at: number) => void;
}

/**
 * UI-only sync status. Deliberately a SEPARATE store from the persisted
 * tournament store: updating it must not trigger the tournament store's
 * subscribe (which would schedule another backend write and loop).
 */
export const useSyncStatus = create<SyncStatusStore>((set) => ({
  state: "synced",
  lastSavedAt: null,
  markPending: () => set({ state: "pending" }),
  markResult: (ok, at) =>
    set(ok ? { state: "synced", lastSavedAt: at } : { state: "error" }),
}));
