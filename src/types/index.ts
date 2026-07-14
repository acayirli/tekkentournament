export interface Character {
  id: string;
  name: string;
  imageUrl: string;
}

export interface Player {
  id: string;
  name: string;
  selectedCharacterIds: string[];
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  character1Id: string;
  character2Id: string;
  winnerId: string | null; // null = not yet played
}

export interface Tournament {
  id: string;
  name: string;
  createdAt: string;
  isFinalized: boolean;
  players: Player[];
  matches: Match[];
  crownOverrides: Record<string, number>;
}

export interface Season {
  id: string;
  name: string;
  createdAt: string;
  tournaments: Tournament[];
}

export interface PlayerPreset {
  name: string;
  characterIds: string[];
}

export type ViewTab = "setup" | "matches" | "seasons" | "statistics";

export interface AppData {
  seasons: Season[];
  activeSeasonId: string | null;
  activeTournamentId: string | null;
  activeView: ViewTab;
  globalCrownOverrides: Record<string, number>;
  playerHistory: PlayerPreset[];
  // Epoch ms of the last mutation. Used to reconcile localStorage vs. backend
  // on load so the freshest copy always wins (never blindly overwritten).
  updatedAt?: number;
}

export interface SequentialMatchInfo {
  matchId: string;
  order: number;
  swapSides: boolean;
  stayingPlayerId: string;
  isLastInTurn: boolean;
}

export interface PlayerScore {
  playerId: string;
  playerName: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
  crowns: number;
  tiebroken: boolean;
}
