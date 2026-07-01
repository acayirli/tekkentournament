import { useTournamentStore } from "../../store/useTournamentStore";
import { groupMatchesByPair } from "../../utils/matchMatrix";
import { MatchCard } from "./MatchCard";

export function MatchMatrix() {
  const tournament = useTournamentStore((s) => s.getActiveTournament());
  const setMatchWinner = useTournamentStore((s) => s.setMatchWinner);

  if (!tournament || tournament.matches.length === 0) return null;

  const groups = groupMatchesByPair(tournament.matches);
  const playerMap = new Map(tournament.players.map((p) => [p.id, p]));

  return (
    <div>
      {groups.map((group) => {
        const p1 = playerMap.get(group.player1Id);
        const p2 = playerMap.get(group.player2Id);
        if (!p1 || !p2) return null;

        const gPlayed = group.matches.filter((m) => m.winnerId).length;
        const gTotal = group.matches.length;

        return (
          <div
            key={`${group.player1Id}-${group.player2Id}`}
            className="match-group"
          >
            <div className="match-group-header">
              <span className="match-group-names">
                {p1.name} <span className="vs">vs</span> {p2.name}
              </span>
              <span className="match-group-count">
                {gPlayed}/{gTotal}
              </span>
            </div>
            <div className="match-grid">
              {group.matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  player1={p1}
                  player2={p2}
                  swapSides={false}
                  onSetWinner={setMatchWinner}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
