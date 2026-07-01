import { useState } from "react";
import { useTournamentStore } from "../../store/useTournamentStore";
import { PlayerCard } from "./PlayerCard";
import { CharacterSelectGrid } from "./CharacterSelectGrid";

interface SwapInfo {
  playerId: string;
  oldCharacterId: string;
}

export function PlayerSetup() {
  const tournament = useTournamentStore((s) => s.getActiveTournament());
  const addPlayer = useTournamentStore((s) => s.addPlayer);
  const startTournament = useTournamentStore((s) => s.startTournament);
  const toggleCharacter = useTournamentStore((s) => s.toggleCharacter);
  const swapCharacter = useTournamentStore((s) => s.swapCharacter);

  const [selectingPlayerId, setSelectingPlayerId] = useState<string | null>(null);
  const [swapInfo, setSwapInfo] = useState<SwapInfo | null>(null);

  const isRunning = !!tournament && tournament.matches.length > 0;

  if (!tournament) {
    return (
      <div className="empty-state">
        <h3>Kein Turnier ausgewählt</h3>
        <p>Erstelle zuerst eine Season und ein Turnier im Seasons-Tab.</p>
      </div>
    );
  }

  if (swapInfo) {
    const player = tournament.players.find((p) => p.id === swapInfo.playerId);
    if (player) {
      return (
        <CharacterSelectGrid
          selectedIds={[]}
          excludeIds={player.selectedCharacterIds}
          onToggle={(newCharId) => {
            swapCharacter(swapInfo.playerId, swapInfo.oldCharacterId, newCharId);
            setSwapInfo(null);
          }}
          onBack={() => setSwapInfo(null)}
          playerName={player.name || "Spieler"}
          swapMode
        />
      );
    }
  }

  const selectingPlayer = selectingPlayerId
    ? tournament.players.find((p) => p.id === selectingPlayerId)
    : null;

  if (selectingPlayer) {
    return (
      <CharacterSelectGrid
        selectedIds={selectingPlayer.selectedCharacterIds}
        onToggle={(cid) => toggleCharacter(selectingPlayer.id, cid)}
        onBack={() => setSelectingPlayerId(null)}
        playerName={selectingPlayer.name || "Spieler"}
      />
    );
  }

  if (isRunning) {
    return (
      <div>
        <div className="section-title">Aufstellung</div>
        <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
          Turnier läuft. Klicke auf einen Charakter um ihn zu tauschen.
        </p>
        <div>
          {tournament.players.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              onSelectCharacters={setSelectingPlayerId}
              onSwapCharacter={(oldCharId) => setSwapInfo({ playerId: p.id, oldCharacterId: oldCharId })}
              isRunning
            />
          ))}
        </div>
      </div>
    );
  }

  const canStart =
    tournament.players.length >= 2 &&
    tournament.players.every(
      (p) => p.name.trim() && p.selectedCharacterIds.length > 0
    );

  return (
    <div>
      <div className="section-title">Aufstellung</div>
      <div className="setup-toolbar">
        <button className="tekken-btn" onClick={() => addPlayer("")}>
          Spieler hinzufügen
        </button>
        <button
          className="tekken-btn gold"
          disabled={!canStart}
          onClick={startTournament}
        >
          Turnier starten
        </button>
        {!canStart && tournament.players.length > 0 && (
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Alle Spieler brauchen einen Namen und mindestens einen Charakter
          </span>
        )}
      </div>
      {tournament.players.map((p) => (
        <PlayerCard key={p.id} player={p} onSelectCharacters={setSelectingPlayerId} />
      ))}
    </div>
  );
}
