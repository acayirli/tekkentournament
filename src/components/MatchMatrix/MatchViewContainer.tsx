import { useState } from "react";
import { useTournamentStore } from "../../store/useTournamentStore";
import { MatchMatrix } from "./MatchMatrix";
import { SequentialView } from "./SequentialView";

export function MatchViewContainer() {
  const [viewMode, setViewMode] = useState<"matrix" | "sequential">("matrix");
  const tournament = useTournamentStore((s) => s.getActiveTournament());

  if (!tournament || tournament.matches.length === 0) {
    return (
      <div className="empty-state">
        <h3>Noch keine Kämpfe</h3>
        <p>Starte zuerst ein Turnier im Aufstellung-Tab.</p>
      </div>
    );
  }

  const played = tournament.matches.filter((m) => m.winnerId).length;
  const total = tournament.matches.length;
  const pct = total > 0 ? (played / total) * 100 : 0;

  const playerProgress = tournament.players.map((p) => {
    const playerMatches = tournament.matches.filter(
      (m) => m.player1Id === p.id || m.player2Id === p.id
    );
    const playerPlayed = playerMatches.filter((m) => m.winnerId).length;
    return { name: p.name, played: playerPlayed, total: playerMatches.length };
  });

  return (
    <div>
      <div className="progress-text">
        {played} / {total} Kämpfe ({Math.round(pct)}%)
      </div>
      <div className="progress-bar">
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="player-progress">
        {playerProgress.map((p) => {
          const playerPct = p.total > 0 ? (p.played / p.total) * 100 : 0;
          return (
            <div key={p.name} className="player-progress-item">
              <span className="player-progress-name">{p.name}</span>
              <div className="player-progress-bar">
                <div className="fill" style={{ width: `${playerPct}%` }} />
              </div>
              <span className="player-progress-count">
                {p.played}/{p.total}
              </span>
            </div>
          );
        })}
      </div>

      <div className="view-toggle">
        <button
          className={`tekken-btn small ${viewMode === "matrix" ? "" : "secondary"}`}
          onClick={() => setViewMode("matrix")}
        >
          Matrix
        </button>
        <button
          className={`tekken-btn small ${viewMode === "sequential" ? "" : "secondary"}`}
          onClick={() => setViewMode("sequential")}
        >
          Reihenfolge
        </button>
      </div>

      {viewMode === "matrix" ? <MatchMatrix /> : <SequentialView />}
    </div>
  );
}
