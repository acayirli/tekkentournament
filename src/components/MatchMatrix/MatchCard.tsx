import type { Match, Player } from "../../types";
import { CHARACTER_MAP } from "../../data/characters";
import { CharacterPortrait } from "../shared/CharacterPortrait";

interface MatchCardProps {
  match: Match;
  player1: Player;
  player2: Player;
  swapSides: boolean;
  onSetWinner: (matchId: string, winnerId: string | null) => void;
}

export function MatchCard({
  match,
  player1,
  player2,
  swapSides,
  onSetWinner,
}: MatchCardProps) {
  const leftPlayer = swapSides ? player2 : player1;
  const rightPlayer = swapSides ? player1 : player2;
  const leftCharId = swapSides ? match.character2Id : match.character1Id;
  const rightCharId = swapSides ? match.character1Id : match.character2Id;

  const leftChar = CHARACTER_MAP.get(leftCharId);
  const rightChar = CHARACTER_MAP.get(rightCharId);
  const w = match.winnerId;

  const pickLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSetWinner(match.id, w === leftPlayer.id ? null : leftPlayer.id);
  };
  const pickRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSetWinner(match.id, w === rightPlayer.id ? null : rightPlayer.id);
  };

  return (
    <div className="match-card">
      <div
        className={`match-side left ${w === leftPlayer.id ? "winner" : w === rightPlayer.id ? "loser" : ""}`}
        onClick={pickLeft}
      >
        {leftChar && <CharacterPortrait character={leftChar} />}
        <div className="match-side-info">
          <span className="match-player-name">{leftPlayer.name}</span>
          <span className="match-char-name">{leftChar?.name}</span>
          {w && (
            <span
              className={`match-result ${w === leftPlayer.id ? "win" : "loss"}`}
            >
              {w === leftPlayer.id ? "SIEG" : "NIEDERLAGE"}
            </span>
          )}
        </div>
      </div>
      <div className="match-vs">vs</div>
      <div
        className={`match-side right ${w === rightPlayer.id ? "winner" : w === leftPlayer.id ? "loser" : ""}`}
        onClick={pickRight}
      >
        {rightChar && <CharacterPortrait character={rightChar} />}
        <div className="match-side-info">
          <span className="match-player-name">{rightPlayer.name}</span>
          <span className="match-char-name">{rightChar?.name}</span>
          {w && (
            <span
              className={`match-result ${w === rightPlayer.id ? "win" : "loss"}`}
            >
              {w === rightPlayer.id ? "SIEG" : "NIEDERLAGE"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
