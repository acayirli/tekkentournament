import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppData,
  ViewTab,
  Season,
  Tournament,
  Player,
  PlayerPreset,
} from "../types";
import { generateMatches } from "../utils/matchMatrix";
import { syncToBackend, loadFromBackend } from "../utils/sync";

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

interface TournamentStore extends AppData {
  // Season actions
  createSeason: () => void;
  setActiveSeason: (id: string) => void;
  deleteSeason: (id: string) => void;

  // Tournament actions
  createTournament: () => void;
  setActiveTournament: (id: string) => void;
  deleteTournament: (id: string) => void;

  // View
  setActiveView: (view: ViewTab) => void;

  // Player actions
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  renamePlayer: (id: string, name: string) => void;
  toggleCharacter: (playerId: string, characterId: string) => void;
  setPlayerCharacters: (playerId: string, characterIds: string[]) => void;
  loadPreset: (playerId: string, preset: PlayerPreset) => void;

  // Tournament flow
  startTournament: () => void;
  setMatchWinner: (matchId: string, winnerId: string | null) => void;
  finalizeTournament: () => void;
  swapCharacter: (playerId: string, oldCharacterId: string, newCharacterId: string) => void;

  // Crown overrides
  setCrownOverride: (playerId: string, crowns: number) => void;
  setGlobalCrownOverride: (playerId: string, crowns: number) => void;

  // Helpers
  getActiveSeason: () => Season | undefined;
  getActiveTournament: () => Tournament | undefined;

  // Backend sync
  loadFromServer: () => Promise<void>;
}

const initialState: AppData = {
  seasons: [],
  activeSeasonId: null,
  activeTournamentId: null,
  activeView: "setup",
  globalCrownOverrides: {},
  playerHistory: [],
};

export const useTournamentStore = create<TournamentStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      createSeason: () => {
        const state = get();
        const tournament: Tournament = {
          id: uid(),
          name: "Turnier 1",
          createdAt: new Date().toISOString(),
          isFinalized: false,
          players: [],
          matches: [],
          crownOverrides: {},
        };
        const season: Season = {
          id: uid(),
          name: `Season ${state.seasons.length + 1}`,
          createdAt: new Date().toISOString(),
          tournaments: [tournament],
        };
        set({
          seasons: [...state.seasons, season],
          activeSeasonId: season.id,
          activeTournamentId: tournament.id,
          activeView: "setup",
        });
      },

      setActiveSeason: (id) =>
        set({ activeSeasonId: id, activeTournamentId: null }),

      deleteSeason: (id) =>
        set((s) => ({
          seasons: s.seasons.filter((se) => se.id !== id),
          activeSeasonId: s.activeSeasonId === id ? null : s.activeSeasonId,
          activeTournamentId: s.activeSeasonId === id ? null : s.activeTournamentId,
        })),

      createTournament: () => {
        const state = get();
        const activeSeason = state.seasons.find((s) => s.id === state.activeSeasonId);
        const num = (activeSeason?.tournaments.length ?? 0) + 1;
        const tournament: Tournament = {
          id: uid(),
          name: `Turnier ${num}`,
          createdAt: new Date().toISOString(),
          isFinalized: false,
          players: [],
          matches: [],
          crownOverrides: {},
        };
        set({
          seasons: state.seasons.map((se) =>
            se.id === state.activeSeasonId
              ? { ...se, tournaments: [...se.tournaments, tournament] }
              : se
          ),
          activeTournamentId: tournament.id,
          activeView: "setup",
        });
      },

      setActiveTournament: (id) => set({ activeTournamentId: id }),

      deleteTournament: (id) =>
        set((s) => ({
          seasons: s.seasons.map((se) =>
            se.id === s.activeSeasonId
              ? { ...se, tournaments: se.tournaments.filter((t) => t.id !== id) }
              : se
          ),
          activeTournamentId: s.activeTournamentId === id ? null : s.activeTournamentId,
        })),

      setActiveView: (view) => set({ activeView: view }),

      addPlayer: (name) => {
        const player: Player = {
          id: uid(),
          name,
          selectedCharacterIds: [],
        };
        set((s) => updateTournament(s, (t) => ({
          ...t,
          players: [...t.players, player],
        })));
      },

      removePlayer: (id) =>
        set((s) => updateTournament(s, (t) => ({
          ...t,
          players: t.players.filter((p) => p.id !== id),
        }))),

      renamePlayer: (id, name) =>
        set((s) => updateTournament(s, (t) => ({
          ...t,
          players: t.players.map((p) =>
            p.id === id ? { ...p, name } : p
          ),
        }))),

      toggleCharacter: (playerId, characterId) =>
        set((s) => updateTournament(s, (t) => ({
          ...t,
          players: t.players.map((p) => {
            if (p.id !== playerId) return p;
            const has = p.selectedCharacterIds.includes(characterId);
            return {
              ...p,
              selectedCharacterIds: has
                ? p.selectedCharacterIds.filter((c) => c !== characterId)
                : [...p.selectedCharacterIds, characterId],
            };
          }),
        }))),

      setPlayerCharacters: (playerId, characterIds) =>
        set((s) => updateTournament(s, (t) => ({
          ...t,
          players: t.players.map((p) =>
            p.id === playerId ? { ...p, selectedCharacterIds: characterIds } : p
          ),
        }))),

      loadPreset: (playerId, preset) =>
        set((s) => updateTournament(s, (t) => ({
          ...t,
          players: t.players.map((p) =>
            p.id === playerId
              ? { ...p, name: preset.name, selectedCharacterIds: preset.characterIds }
              : p
          ),
        }))),

      startTournament: () => {
        const state = get();
        const tournament = getTournament(state);
        if (!tournament) return;

        // Save player presets
        const newPresets = [...state.playerHistory];
        for (const p of tournament.players) {
          if (p.name && p.selectedCharacterIds.length > 0) {
            const idx = newPresets.findIndex((pr) => pr.name === p.name);
            const preset: PlayerPreset = {
              name: p.name,
              characterIds: [...p.selectedCharacterIds],
            };
            if (idx >= 0) newPresets[idx] = preset;
            else newPresets.push(preset);
          }
        }

        const matches = generateMatches(tournament.players);
        set((s) => ({
          ...updateTournament(s, (t) => ({ ...t, matches })),
          playerHistory: newPresets,
          activeView: "matches",
        }));
      },

      setMatchWinner: (matchId, winnerId) =>
        set((s) => updateTournament(s, (t) => ({
          ...t,
          matches: t.matches.map((m) =>
            m.id === matchId ? { ...m, winnerId } : m
          ),
        }))),

      finalizeTournament: () =>
        set((s) => updateTournament(s, (t) => ({
          ...t,
          isFinalized: true,
        }))),

      swapCharacter: (playerId, oldCharacterId, newCharacterId) =>
        set((s) => updateTournament(s, (t) => ({
          ...t,
          players: t.players.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  selectedCharacterIds: p.selectedCharacterIds.map((c) =>
                    c === oldCharacterId ? newCharacterId : c
                  ),
                }
              : p
          ),
          matches: t.matches.map((m) => {
            let updated = { ...m };
            if (m.player1Id === playerId && m.character1Id === oldCharacterId) {
              updated = { ...updated, character1Id: newCharacterId };
            }
            if (m.player2Id === playerId && m.character2Id === oldCharacterId) {
              updated = { ...updated, character2Id: newCharacterId };
            }
            return updated;
          }),
        }))),

      setCrownOverride: (playerId, crowns) =>
        set((s) => updateTournament(s, (t) => ({
          ...t,
          crownOverrides: { ...t.crownOverrides, [playerId]: crowns },
        }))),

      setGlobalCrownOverride: (playerId, crowns) =>
        set((s) => ({
          globalCrownOverrides: { ...s.globalCrownOverrides, [playerId]: crowns },
        })),

      getActiveSeason: () => {
        const s = get();
        return s.seasons.find((se) => se.id === s.activeSeasonId);
      },

      getActiveTournament: () => getTournament(get()),

      loadFromServer: async () => {
        const data = await loadFromBackend();
        if (data) {
          set({
            seasons: data.seasons,
            activeSeasonId: data.activeSeasonId,
            activeTournamentId: data.activeTournamentId,
            activeView: data.activeView,
            globalCrownOverrides: data.globalCrownOverrides,
            playerHistory: data.playerHistory,
          });
        }
      },
    }),
    {
      name: "tekken-tournament-store",
    }
  )
);

// Auto-sync to backend on every state change
useTournamentStore.subscribe((state) => {
  const data: AppData = {
    seasons: state.seasons,
    activeSeasonId: state.activeSeasonId,
    activeTournamentId: state.activeTournamentId,
    activeView: state.activeView,
    globalCrownOverrides: state.globalCrownOverrides,
    playerHistory: state.playerHistory,
  };
  syncToBackend(data);
});

// --- Helpers ---

function getTournament(state: AppData): Tournament | undefined {
  const season = state.seasons.find((s) => s.id === state.activeSeasonId);
  return season?.tournaments.find((t) => t.id === state.activeTournamentId);
}

function updateTournament(
  state: AppData,
  updater: (t: Tournament) => Tournament
): Partial<AppData> {
  return {
    seasons: state.seasons.map((se) =>
      se.id === state.activeSeasonId
        ? {
            ...se,
            tournaments: se.tournaments.map((t) =>
              t.id === state.activeTournamentId ? updater(t) : t
            ),
          }
        : se
    ),
  };
}
