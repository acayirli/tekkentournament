import { useTournamentStore } from "../../store/useTournamentStore";
import { calculateScores, calculateAllTimeCrowns } from "../../utils/scoring";
import { EditableCell } from "../shared/EditableCell";

export function Sidebar() {
  const tournament = useTournamentStore((s) => s.getActiveTournament());
  const activeSeason = useTournamentStore((s) => s.getActiveSeason());
  const seasons = useTournamentStore((s) => s.seasons);
  const globalOverrides = useTournamentStore((s) => s.globalCrownOverrides);
  const finalizeTournament = useTournamentStore((s) => s.finalizeTournament);
  const setGlobalCrownOverride = useTournamentStore((s) => s.setGlobalCrownOverride);

  const hasMatches = tournament && tournament.matches.length > 0;

  const scores = hasMatches
    ? calculateScores(tournament.players, tournament.matches, tournament.crownOverrides)
    : [];

  const played = hasMatches ? tournament.matches.filter((m) => m.winnerId).length : 0;
  const total = hasMatches ? tournament.matches.length : 0;
  const allPlayed = played === total && total > 0;

  // Season crowns
  const seasonCrownTotals: Record<string, number> = {};
  if (activeSeason) {
    for (const t of activeSeason.tournaments) {
      if (!t.isFinalized || t.matches.length === 0) continue;
      const s = calculateScores(t.players, t.matches, t.crownOverrides);
      for (const sc of s) {
        seasonCrownTotals[sc.playerName] = (seasonCrownTotals[sc.playerName] || 0) + sc.crowns;
      }
    }
  }
  const seasonCrownEntries = Object.entries(seasonCrownTotals).sort(([, a], [, b]) => b - a);

  // All-time crowns
  const allCrownMaps: Record<string, number>[] = [];
  for (const season of seasons) {
    for (const t of season.tournaments) {
      if (!t.isFinalized || t.matches.length === 0) continue;
      const s = calculateScores(t.players, t.matches, t.crownOverrides);
      const map: Record<string, number> = {};
      for (const sc of s) map[sc.playerName] = sc.crowns;
      allCrownMaps.push(map);
    }
  }
  const allTimeCrowns = calculateAllTimeCrowns(allCrownMaps, globalOverrides);
  const crownEntries = Object.entries(allTimeCrowns).sort(([, a], [, b]) => b - a);

  const showRangliste = hasMatches;
  const showAnything = showRangliste || seasonCrownEntries.length > 0 || crownEntries.length > 0;

  if (!showAnything) return null;

  return (
    <aside className="matches-sidebar">
      {showRangliste && (
        <div className="sidebar-section">
          <div className="sidebar-title">Rangliste</div>
          {scores.map((s, i) => (
            <div key={s.playerId} className="sidebar-score-row">
              <span className={`sidebar-rank ${i === 0 ? "gold" : ""}`}>{i + 1}</span>
              <span className="sidebar-player-name">{s.playerName}</span>
              {s.tiebroken && <span className="tiebreak-label">DV</span>}
              <span className="sidebar-stat win">{s.wins}S</span>
              <span className="sidebar-stat">{s.losses}N</span>
            </div>
          ))}
          {!tournament.isFinalized && (
            <button
              className="tekken-btn small gold"
              disabled={!allPlayed}
              onClick={finalizeTournament}
              style={{ marginTop: 12, width: "100%" }}
            >
              {allPlayed ? "Abschließen" : `${total - played} übrig`}
            </button>
          )}
          {tournament.isFinalized && (
            <div style={{ marginTop: 8, color: "var(--green)", fontFamily: "var(--font-heading)", textTransform: "uppercase", fontSize: 12, letterSpacing: 1, textAlign: "center" }}>
              Abgeschlossen
            </div>
          )}
        </div>
      )}

      {seasonCrownEntries.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-title">Season-Kronen</div>
          {seasonCrownEntries.map(([name, crowns]) => (
            <div key={name} className="sidebar-crown-row">
              <span className="sidebar-player-name">{name}</span>
              <span className="sidebar-crown-val">👑 {crowns}</span>
            </div>
          ))}
        </div>
      )}

      {crownEntries.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-title">Gesamt-Kronen</div>
          {crownEntries.map(([name, crowns]) => (
            <div key={name} className="sidebar-crown-row">
              <span className="sidebar-player-name">{name}</span>
              <span className="sidebar-crown-val">
                👑 <EditableCell value={crowns} onChange={(val) => setGlobalCrownOverride(name, val)} />
              </span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
