import { useTournamentStore } from "../../store/useTournamentStore";
import { calculateScores } from "../../utils/scoring";
import type { Season, Tournament } from "../../types";

function getSeasonLeader(season: Season): string | null {
  const totals: Record<string, number> = {};
  for (const t of season.tournaments) {
    if (t.matches.length === 0) continue;
    const scores = calculateScores(t.players, t.matches, t.crownOverrides);
    for (const s of scores) {
      totals[s.playerName] = (totals[s.playerName] || 0) + s.crowns;
    }
  }
  const entries = Object.entries(totals);
  if (entries.length === 0) return null;
  entries.sort(([, a], [, b]) => b - a);
  return entries[0][1] > 0 ? entries[0][0] : null;
}

function getTournamentLeader(t: Tournament): string | null {
  if (t.matches.length === 0) return null;
  const scores = calculateScores(t.players, t.matches, t.crownOverrides);
  if (scores.length === 0 || scores[0].crowns === 0) return null;
  return scores[0].playerName;
}

export function SeasonManager() {
  const seasons = useTournamentStore((s) => s.seasons);
  const activeSeasonId = useTournamentStore((s) => s.activeSeasonId);
  const activeTournamentId = useTournamentStore((s) => s.activeTournamentId);
  const createSeason = useTournamentStore((s) => s.createSeason);
  const setActiveSeason = useTournamentStore((s) => s.setActiveSeason);
  const deleteSeason = useTournamentStore((s) => s.deleteSeason);
  const createTournament = useTournamentStore((s) => s.createTournament);
  const setActiveTournament = useTournamentStore((s) => s.setActiveTournament);
  const deleteTournament = useTournamentStore((s) => s.deleteTournament);
  const activeSeason = seasons.find((s) => s.id === activeSeasonId);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div className="section-title" style={{ margin: 0 }}>Seasons</div>
        <button className="tekken-btn" onClick={createSeason}>
          Neue Season
        </button>
      </div>

      {seasons.length === 0 ? (
        <div className="empty-state">
          <h3>Noch keine Seasons</h3>
          <p>Starte deine erste Season per Klick.</p>
        </div>
      ) : (
        <div className="season-list">
          {seasons.map((season) => {
            const leader = getSeasonLeader(season);
            return (
              <div key={season.id}>
                <div
                  className={`season-item ${season.id === activeSeasonId ? "active" : ""}`}
                  onClick={() => setActiveSeason(season.id)}
                >
                  <div>
                    <div className="season-name">{season.name}</div>
                    <div className="season-meta">
                      {season.tournaments.length} Turnier{season.tournaments.length !== 1 ? "e" : ""}
                      {" "}&middot; {new Date(season.createdAt).toLocaleDateString()}
                      {leader && <> &middot; 👑 {leader}</>}
                    </div>
                  </div>
                  <button
                    className="tekken-btn small secondary delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`"${season.name}" wirklich löschen?`)) deleteSeason(season.id);
                    }}
                  >
                    Löschen
                  </button>
                </div>

                {season.id === activeSeasonId && (
                  <div className="season-tournaments-block">
                    <button
                      className="tekken-btn small"
                      onClick={createTournament}
                    >
                      Neues Turnier
                    </button>

                    <div className="tournament-list">
                      {activeSeason?.tournaments.map((t) => {
                        const tLeader = getTournamentLeader(t);
                        return (
                          <div
                            key={t.id}
                            className={`tournament-item ${t.id === activeTournamentId ? "active" : ""}`}
                            onClick={() => setActiveTournament(t.id)}
                          >
                            <div>
                              <span className="tournament-name">{t.name}</span>
                              {tLeader && <span className="tournament-leader">👑 {tLeader}</span>}
                            </div>
                            <div className="tournament-actions">
                              <span className={`badge ${t.isFinalized ? "finalized" : t.matches.length > 0 ? "in-progress" : ""}`}>
                                {t.isFinalized ? "Fertig" : t.matches.length > 0 ? "Läuft" : "Aufstellung"}
                              </span>
                              <button
                                className="delete-x"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`"${t.name}" wirklich löschen?`)) deleteTournament(t.id);
                                }}
                                title="Turnier löschen"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
