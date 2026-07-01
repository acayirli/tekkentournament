import { useMemo } from "react";
import { useTournamentStore } from "../../store/useTournamentStore";
import { computeSequentialOrder } from "../../utils/matchMatrix";
import { MatchCard } from "./MatchCard";

export function SequentialView() {
  const tournament = useTournamentStore((s) => s.getActiveTournament());
  const setMatchWinner = useTournamentStore((s) => s.setMatchWinner);

  const sequentialOrder = useMemo(() => {
    if (!tournament || tournament.matches.length === 0) return [];
    return computeSequentialOrder(tournament.players, tournament.matches);
  }, [tournament]);

  if (!tournament || sequentialOrder.length === 0) return null;

  const matchMap = new Map(tournament.matches.map((m) => [m.id, m]));
  const playerMap = new Map(tournament.players.map((p) => [p.id, p]));

  return (
    <div className="sequential-list">
      {sequentialOrder.map((info) => {
        const match = matchMap.get(info.matchId);
        if (!match) return null;
        const p1 = playerMap.get(match.player1Id);
        const p2 = playerMap.get(match.player2Id);
        if (!p1 || !p2) return null;

        return (
          <div key={match.id} className="sequential-match-item">
            <div className="sequential-match-number">{info.order + 1}</div>
            <div className="sequential-match-card-wrapper">
              <MatchCard
                match={match}
                player1={p1}
                player2={p2}
                swapSides={info.swapSides}
                onSetWinner={setMatchWinner}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
