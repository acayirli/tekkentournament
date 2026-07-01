import { useTournamentStore } from "../../store/useTournamentStore";
import { CHARACTER_MAP } from "../../data/characters";
import { CharacterPortrait } from "../shared/CharacterPortrait";
import type { Player } from "../../types";

interface Props {
  player: Player;
  onSelectCharacters: (playerId: string) => void;
  onSwapCharacter?: (oldCharacterId: string) => void;
  isRunning?: boolean;
}

export function PlayerCard({ player, onSelectCharacters, onSwapCharacter, isRunning }: Props) {
  const renamePlayer = useTournamentStore((s) => s.renamePlayer);
  const removePlayer = useTournamentStore((s) => s.removePlayer);
  const loadPreset = useTournamentStore((s) => s.loadPreset);
  const playerHistory = useTournamentStore((s) => s.playerHistory);

  const presets = playerHistory.filter(
    (p) => p.name !== player.name || p.characterIds.join(",") !== player.selectedCharacterIds.join(",")
  );

  return (
    <div className="player-card">
      <div className="player-card-header">
        <input
          value={player.name}
          onChange={(e) => renamePlayer(player.id, e.target.value)}
          placeholder="Spielername..."
          readOnly={isRunning}
        />
        {!isRunning && (
          <>
            <button
              className="tekken-btn small"
              onClick={() => onSelectCharacters(player.id)}
            >
              Charaktere wählen
            </button>
            <button
              className="tekken-btn small secondary"
              onClick={() => removePlayer(player.id)}
            >
              Entfernen
            </button>
          </>
        )}
      </div>

      <div className="selected-chars">
        {player.selectedCharacterIds.length === 0 ? (
          <span className="placeholder">Keine Charaktere ausgewählt</span>
        ) : (
          player.selectedCharacterIds.map((cid) => {
            const char = CHARACTER_MAP.get(cid);
            return char ? (
              <div key={cid} className={`char-swap-wrapper${isRunning ? " swappable" : ""}`}>
                <CharacterPortrait
                  character={char}
                  selected
                  onClick={isRunning && onSwapCharacter ? () => onSwapCharacter(cid) : undefined}
                />
                {isRunning && (
                  <button
                    className="char-swap-btn"
                    onClick={() => onSwapCharacter?.(cid)}
                    title={`${char.name} tauschen`}
                  >
                    &#x21C4;
                  </button>
                )}
              </div>
            ) : null;
          })
        )}
      </div>

      {!isRunning && presets.length > 0 && (
        <div className="preset-list">
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Laden:</span>
          {presets.map((p) => (
            <button
              key={p.name}
              className="preset-chip"
              onClick={() => loadPreset(player.id, p)}
            >
              {p.name} ({p.characterIds.length})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
