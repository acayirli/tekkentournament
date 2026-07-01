import { useState } from "react";
import { CHARACTERS } from "../../data/characters";
import { CharacterPortrait } from "../shared/CharacterPortrait";

interface Props {
  selectedIds: string[];
  excludeIds?: string[];
  onToggle: (charId: string) => void;
  onBack: () => void;
  playerName: string;
  swapMode?: boolean;
}

export function CharacterSelectGrid({ selectedIds, excludeIds, onToggle, onBack, playerName, swapMode }: Props) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? CHARACTERS.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : CHARACTERS;

  const excludeSet = new Set(excludeIds ?? []);

  return (
    <div className="char-select-page">
      <div className="char-select-header">
        <button className="tekken-btn small secondary" onClick={onBack}>
          Abbrechen
        </button>
        <span className="char-select-title">
          {swapMode ? "Neuen Charakter wählen" : "Charaktere"} — {playerName}
        </span>
        {!swapMode && (
          <>
            <span className="char-select-count">
              {selectedIds.length} gewählt
            </span>
            <button className="tekken-btn" onClick={onBack}>
              Bestätigen
            </button>
          </>
        )}
      </div>

      <input
        className="char-search"
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Charakter suchen..."
        autoFocus
      />

      <div className="char-grid-full">
        {filtered.map((char) => {
          const isExcluded = excludeSet.has(char.id);
          return (
            <div key={char.id} className={`char-grid-cell${isExcluded ? " excluded" : ""}`}>
              <CharacterPortrait
                character={char}
                selected={selectedIds.includes(char.id)}
                onClick={isExcluded ? undefined : () => onToggle(char.id)}
              />
              <div className="char-name">{char.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
