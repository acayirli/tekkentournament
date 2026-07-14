import { useState } from "react";
import type { ViewTab } from "../../types";
import { useTournamentStore } from "../../store/useTournamentStore";
import { useSyncStatus } from "../../store/useSyncStatus";

const TABS: { key: ViewTab; label: string }[] = [
  { key: "setup", label: "Aufstellung" },
  { key: "matches", label: "Kämpfe" },
  { key: "seasons", label: "Seasons" },
  { key: "statistics", label: "Statistiken" },
];

type SaveState = "idle" | "saving" | "saved" | "error";

export function Header() {
  const activeView = useTournamentStore((s) => s.activeView);
  const setActiveView = useTournamentStore((s) => s.setActiveView);
  const activeSeason = useTournamentStore((s) => s.getActiveSeason());
  const activeTournament = useTournamentStore((s) => s.getActiveTournament());
  const saveNow = useTournamentStore((s) => s.saveNow);
  const syncState = useSyncStatus((s) => s.state);

  const [saveState, setSaveState] = useState<SaveState>("idle");

  const handleSave = async () => {
    setSaveState("saving");
    const ok = await saveNow();
    setSaveState(ok ? "saved" : "error");
    if (ok) {
      window.setTimeout(() => setSaveState("idle"), 2500);
    }
  };

  const saveLabel: Record<SaveState, string> = {
    idle: "Speichern",
    saving: "Speichert…",
    saved: "✓ Gespeichert",
    error: "✗ Fehler – erneut",
  };

  const syncInfo: Record<typeof syncState, { text: string; cls: string }> = {
    synced: { text: "● Auf Server gesichert", cls: "ok" },
    pending: { text: "● Speichert…", cls: "pending" },
    error: { text: "⚠ NICHT gesichert – Server läuft nicht?", cls: "error" },
  };

  return (
    <header className="header">
      <div className="header-top">
        <h1 className="header-title">
          <span>Tekken 8</span> Tournament
        </h1>
        <div className="context-bar">
          {activeSeason ? (
            <>
              <span className="context-segment">{activeSeason.name}</span>
              {activeTournament && (
                <>
                  <span className="context-sep">/</span>
                  <span className="context-segment active">{activeTournament.name}</span>
                </>
              )}
            </>
          ) : (
            <span className="context-segment dim">Keine Season ausgewählt</span>
          )}
          <span className={`sync-indicator ${syncInfo[syncState].cls}`}>
            {syncInfo[syncState].text}
          </span>
          <button
            className={`tekken-btn small save-btn ${saveState}`}
            onClick={handleSave}
            disabled={saveState === "saving"}
            title="Alle Daten sofort auf dem Server speichern"
          >
            {saveLabel[saveState]}
          </button>
        </div>
      </div>
      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${activeView === t.key ? "active" : ""}`}
            onClick={() => setActiveView(t.key)}
          >
            <span style={{ display: "inline-block", transform: "skewX(3deg)" }}>
              {t.label}
            </span>
          </button>
        ))}
      </nav>
    </header>
  );
}
