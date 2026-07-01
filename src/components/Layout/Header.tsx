import type { ViewTab } from "../../types";
import { useTournamentStore } from "../../store/useTournamentStore";

const TABS: { key: ViewTab; label: string }[] = [
  { key: "setup", label: "Aufstellung" },
  { key: "matches", label: "Kämpfe" },
  { key: "seasons", label: "Seasons" },
];

export function Header() {
  const activeView = useTournamentStore((s) => s.activeView);
  const setActiveView = useTournamentStore((s) => s.setActiveView);
  const activeSeason = useTournamentStore((s) => s.getActiveSeason());
  const activeTournament = useTournamentStore((s) => s.getActiveTournament());

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
