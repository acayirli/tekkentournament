import { useTournamentStore } from "../../store/useTournamentStore";
import { calculateScores } from "../../utils/scoring";
import { EditableCell } from "../shared/EditableCell";

export function Scoreboard() {
  const tournament = useTournamentStore((s) => s.getActiveTournament());
  const finalizeTournament = useTournamentStore((s) => s.finalizeTournament);
  const setCrownOverride = useTournamentStore((s) => s.setCrownOverride);

  if (!tournament || tournament.matches.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Scoreboard Yet</h3>
        <p>Start a tournament and play some matches first.</p>
      </div>
    );
  }

  const scores = calculateScores(
    tournament.players,
    tournament.matches,
    tournament.crownOverrides
  );

  const allPlayed = tournament.matches.every((m) => m.winnerId !== null);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div className="section-title" style={{ margin: 0 }}>Scoreboard</div>
        {!tournament.isFinalized && (
          <button
            className="tekken-btn gold"
            disabled={!allPlayed}
            onClick={finalizeTournament}
            title={allPlayed ? "Finalize tournament" : "All matches must be played first"}
          >
            Finalize
          </button>
        )}
        {tournament.isFinalized && (
          <span style={{ color: "var(--green)", fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: 1 }}>
            Finalized
          </span>
        )}
      </div>

      <table className="scoreboard-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Win %</th>
            <th>Crowns</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s, i) => (
            <tr key={s.playerId}>
              <td className={`rank ${i === 0 ? "gold" : ""}`}>{i + 1}</td>
              <td className="player-col">{s.playerName}</td>
              <td>{s.wins}</td>
              <td>{s.losses}</td>
              <td className="win-rate">
                {Math.round(s.winRate * 100)}%
                {s.tiebroken && <span className="tiebreak-label">DV</span>}
              </td>
              <td>
                <span className="crown-icon">👑</span>
                <EditableCell
                  value={s.crowns}
                  onChange={(val) => setCrownOverride(s.playerId, val)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
