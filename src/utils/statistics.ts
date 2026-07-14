import type { Tournament } from "../types";

// A single win/loss aggregate. `winRate` is a 0..1 decimal (0 when games === 0).
export interface CharStat {
  games: number;
  wins: number;
  losses: number;
  winRate: number;
}

// One player's own character X vs. an opponent's character (`charId`).
export interface MatchupStat extends CharStat {
  charId: string;
}

// One player's head-to-head record against another person (`name`).
export interface OpponentStat extends CharStat {
  name: string;
}

export interface PlayerStatistics {
  name: string;
  overall: CharStat;
  // charId -> aggregate across all matchups the player used that character in.
  perCharacter: Record<string, CharStat>;
  // ownCharId -> list of matchups vs. opponent characters (games >= 1), sorted by games desc.
  charMatchups: Record<string, MatchupStat[]>;
  // head-to-head vs. every other person faced (games >= 1), sorted by games desc.
  vsPlayers: OpponentStat[];
}

// Character aggregate across ALL players (for the global tier list / pick counts).
export interface GlobalCharStat extends CharStat {
  charId: string;
  players: number; // number of distinct people who played this character
}

function emptyStat(): CharStat {
  return { games: 0, wins: 0, losses: 0, winRate: 0 };
}

function record(stat: CharStat, won: boolean): void {
  stat.games++;
  if (won) stat.wins++;
  else stat.losses++;
}

function finalizeRate(stat: CharStat): void {
  stat.winRate = stat.games > 0 ? stat.wins / stat.games : 0;
}

/**
 * Only finalized tournaments contribute (consistent with the crown logic), and
 * within them only matches that actually have a winner. Personen werden über den
 * Namen identifiziert (player.id ist pro Turnier neu vergeben).
 */
function relevantTournaments(tournaments: Tournament[]): Tournament[] {
  return tournaments.filter((t) => t.isFinalized);
}

/**
 * Aggregate per-person statistics across the given tournaments in one pass.
 * Returns a map keyed by player name.
 */
export function computeStatistics(
  tournaments: Tournament[]
): Record<string, PlayerStatistics> {
  const players: Record<string, PlayerStatistics> = {};

  const getPlayer = (name: string): PlayerStatistics => {
    let p = players[name];
    if (!p) {
      p = {
        name,
        overall: emptyStat(),
        perCharacter: {},
        charMatchups: {},
        vsPlayers: [],
      };
      players[name] = p;
    }
    return p;
  };

  const getCharStat = (map: Record<string, CharStat>, key: string): CharStat => {
    let s = map[key];
    if (!s) {
      s = emptyStat();
      map[key] = s;
    }
    return s;
  };

  // Keyed matchup/opponent accumulators live in nested maps during aggregation,
  // then get flattened into arrays at the end.
  // player name -> ownCharId -> oppCharId -> CharStat
  const matchupAcc: Record<string, Record<string, Record<string, CharStat>>> = {};
  // player name -> opponent name -> CharStat
  const vsAcc: Record<string, Record<string, CharStat>> = {};

  const getMatchup = (
    name: string,
    ownChar: string,
    oppChar: string
  ): CharStat => {
    const byChar = (matchupAcc[name] ??= {});
    const byOpp = (byChar[ownChar] ??= {});
    return getCharStat(byOpp, oppChar);
  };

  const getVs = (name: string, oppName: string): CharStat => {
    const byOpp = (vsAcc[name] ??= {});
    return getCharStat(byOpp, oppName);
  };

  for (const t of relevantTournaments(tournaments)) {
    const nameById = new Map(t.players.map((p) => [p.id, p.name]));

    for (const m of t.matches) {
      if (!m.winnerId) continue;

      const name1 = nameById.get(m.player1Id);
      const name2 = nameById.get(m.player2Id);
      if (!name1 || !name2) continue; // orphaned match (player removed)

      const p1Won = m.winnerId === m.player1Id;
      const c1 = m.character1Id;
      const c2 = m.character2Id;

      const p1 = getPlayer(name1);
      const p2 = getPlayer(name2);

      record(p1.overall, p1Won);
      record(p2.overall, !p1Won);
      record(getCharStat(p1.perCharacter, c1), p1Won);
      record(getCharStat(p2.perCharacter, c2), !p1Won);
      record(getMatchup(name1, c1, c2), p1Won);
      record(getMatchup(name2, c2, c1), !p1Won);
      record(getVs(name1, name2), p1Won);
      record(getVs(name2, name1), !p1Won);
    }
  }

  // Finalize rates + flatten the nested accumulators onto each player.
  for (const p of Object.values(players)) {
    finalizeRate(p.overall);
    for (const s of Object.values(p.perCharacter)) finalizeRate(s);

    const byChar = matchupAcc[p.name] ?? {};
    for (const [ownChar, byOpp] of Object.entries(byChar)) {
      const list: MatchupStat[] = Object.entries(byOpp).map(([charId, s]) => {
        finalizeRate(s);
        return { charId, ...s };
      });
      list.sort((a, b) => b.games - a.games);
      p.charMatchups[ownChar] = list;
    }

    const byOpp = vsAcc[p.name] ?? {};
    p.vsPlayers = Object.entries(byOpp).map(([name, s]) => {
      finalizeRate(s);
      return { name, ...s };
    });
    p.vsPlayers.sort((a, b) => b.games - a.games);
  }

  return players;
}

/**
 * Aggregate each character's win rate across ALL players, for the global tier
 * list. Sorted by win rate desc. Callers can apply a min-games threshold.
 */
export function computeGlobalCharStats(
  tournaments: Tournament[]
): GlobalCharStat[] {
  const stats: Record<string, CharStat> = {};
  const playersByChar: Record<string, Set<string>> = {};

  for (const t of relevantTournaments(tournaments)) {
    const nameById = new Map(t.players.map((p) => [p.id, p.name]));

    for (const m of t.matches) {
      if (!m.winnerId) continue;
      const name1 = nameById.get(m.player1Id);
      const name2 = nameById.get(m.player2Id);
      if (!name1 || !name2) continue;

      const p1Won = m.winnerId === m.player1Id;

      let c1 = stats[m.character1Id];
      if (!c1) c1 = stats[m.character1Id] = emptyStat();
      let c2 = stats[m.character2Id];
      if (!c2) c2 = stats[m.character2Id] = emptyStat();
      record(c1, p1Won);
      record(c2, !p1Won);

      (playersByChar[m.character1Id] ??= new Set()).add(name1);
      (playersByChar[m.character2Id] ??= new Set()).add(name2);
    }
  }

  const result: GlobalCharStat[] = Object.entries(stats).map(([charId, s]) => {
    finalizeRate(s);
    return { charId, players: playersByChar[charId]?.size ?? 0, ...s };
  });
  result.sort((a, b) => b.winRate - a.winRate || b.games - a.games);
  return result;
}
