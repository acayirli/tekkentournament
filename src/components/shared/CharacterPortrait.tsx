import { useState } from "react";
import type { Character } from "../../types";

interface Props {
  character: Character;
  size?: number;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CharacterPortrait({
  character,
  selected,
  onClick,
  className = "",
}: Props) {
  const [imgError, setImgError] = useState(false);

  const initials = character.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`char-portrait ${selected ? "selected" : ""} ${onClick ? "" : "static"} ${className}`}
      onClick={onClick}
      title={character.name}
    >
      {imgError ? (
        <div className="fallback">{initials}</div>
      ) : (
        <img
          src={character.imageUrl}
          alt={character.name}
          loading="lazy"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}
