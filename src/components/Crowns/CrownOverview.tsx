import { useTournamentStore } from "../../store/useTournamentStore";
import { calculateScores, calculateAllTimeCrowns } from "../../utils/scoring";
import { EditableCell } from "../shared/EditableCell";

export function CrownOverview() {
  const seasons = useTournamentStore((s) => s.seasons);
  const activeSeason = useTournamentStore((s) => s.getActiveSeason());
  const globalOverrides = useTournamentStore((s) => s.globalCrownOverrides);
  const setGlobalCrownOverride = useTournamentStore((s) => s.setGlobalCrownOverride);

  // Per-tournament crowns for the active season
  const tournamentCrowns: { tournamentName: string; scores: { name: string; crowns: number }[] }[] = [];

  if (activeSeason) {
    for (const t of activeSeason.tournaments) {
      if (t.matches.length === 0) continue;
      const scores = calculateScores(t.players, t.matches, t.crownOverrides);
      tournamentCrowns.push({
        tournamentName: t.name,
        scores: scores.map((s) => ({ name: s.playerName, crowns: s.crowns })),
      });
    }
  }

  // All-time crowns across all seasons
  const allCrownMaps: Record<string, number>[] = [];
  const playerNames = new Map<string, string>();

  for (const season of seasons) {
    for (const t of season.tournaments) {
      if (t.matches.length === 0) continue;
      const scores = calculateScores(t.players, t.matches, t.crownOverrides);
      const map: Record<string, number> = {};
      for (const s of scores) {
        map[s.playerName] = s.crowns;
        playerNames.set(s.playerName, s.playerName);
      }
      allCrownMaps.push(map);
    }
  }

  const allTime = calculateAllTimeCrowns(allCrownMaps, globalOverrides);
  const allTimeEntries = Object.entries(allTime)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="crowns-section">
      <div>
        <div className="section-title">All-Time Crowns</div>
        {allTimeEntries.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No crowns awarded yet.</p>
        ) : (
          allTimeEntries.map(([name, crowns]) => (
            <div key={name} className="crown-card" style={{ marginBottom: 8 }}>
              <div className="player-info">
                <span className="player-name">{name}</span>
              </div>
              <div className="crown-edit">
                <span className="crown-icon">👑</span>
                <EditableCell
                  value={crowns}
                  onChange={(val) => setGlobalCrownOverride(name, val)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {tournamentCrowns.length > 0 && (
        <div>
          <div className="section-title">Season Crowns</div>
          {tournamentCrowns.map((tc) => (
            <div key={tc.tournamentName} style={{ marginBottom: 16 }}>
              <h4 style={{ fontFamily: "var(--font-heading)", marginBottom: 8, color: "var(--text-secondary)" }}>
                {tc.tournamentName}
              </h4>
              {tc.scores
                .filter((s) => s.crowns > 0)
                .map((s) => (
                  <div key={s.name} className="crown-card" style={{ marginBottom: 6 }}>
                    <span className="player-name">{s.name}</span>
                    <span className="crown-count">
                      {"👑".repeat(s.crowns)} {s.crowns}
                    </span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
