import type { Player, Match, SequentialMatchInfo } from "../types";

let matchCounter = 0;

export function generateMatches(players: Player[]): Match[] {
  const matches: Match[] = [];

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const p1 = players[i];
      const p2 = players[j];

      for (const c1 of p1.selectedCharacterIds) {
        for (const c2 of p2.selectedCharacterIds) {
          matches.push({
            id: `match-${Date.now()}-${matchCounter++}`,
            player1Id: p1.id,
            player2Id: p2.id,
            character1Id: c1,
            character2Id: c2,
            winnerId: null,
          });
        }
      }
    }
  }

  return matches;
}

export interface MatchGroup {
  player1Id: string;
  player2Id: string;
  matches: Match[];
}

export function groupMatchesByPair(matches: Match[]): MatchGroup[] {
  const groups = new Map<string, MatchGroup>();

  for (const match of matches) {
    const key = `${match.player1Id}-${match.player2Id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        matches: [],
      });
    }
    groups.get(key)!.matches.push(match);
  }

  return Array.from(groups.values());
}

export function computeSequentialOrder(
  players: Player[],
  matches: Match[]
): SequentialMatchInfo[] {
  const result: SequentialMatchInfo[] = [];
  const pool = new Set(matches.map((_, i) => i));

  // Per-pair side tracking: pairKey -> how many times first player (sorted) was on left
  const pairSideCount = new Map<string, { aLeft: number; bLeft: number }>();
  function getPairKey(id1: string, id2: string): string {
    return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
  }
  function getPairCount(id1: string, id2: string) {
    const key = getPairKey(id1, id2);
    if (!pairSideCount.has(key)) pairSideCount.set(key, { aLeft: 0, bLeft: 0 });
    return pairSideCount.get(key)!;
  }

  let playerIndex = 0;
  let skippedInRow = 0;

  while (pool.size > 0) {
    const stayingPlayer = players[playerIndex % players.length];
    playerIndex++;

    const available: number[] = [];
    for (const idx of pool) {
      const m = matches[idx];
      if (m.player1Id === stayingPlayer.id || m.player2Id === stayingPlayer.id) {
        available.push(idx);
      }
    }

    if (available.length === 0) {
      skippedInRow++;
      if (skippedInRow >= players.length) break;
      continue;
    }
    skippedInRow = 0;

    const picked: number[] = [];
    let prevOpponentId: string | null = null;

    for (let slot = 0; slot < 2 && available.length > 0; slot++) {
      const opponents = new Map<string, number[]>();
      for (const idx of available) {
        if (picked.includes(idx)) continue;
        const m = matches[idx];
        const oppId =
          m.player1Id === stayingPlayer.id ? m.player2Id : m.player1Id;
        if (!opponents.has(oppId)) opponents.set(oppId, []);
        opponents.get(oppId)!.push(idx);
      }

      if (opponents.size === 0) break;

      let bestOppId: string | null = null;
      let bestScore = -1;

      for (const [oppId, idxs] of opponents) {
        const preferDifferent =
          slot === 1 && prevOpponentId !== null && oppId !== prevOpponentId;
        let remainingForOpp = 0;
        for (const idx of pool) {
          const m = matches[idx];
          if (m.player1Id === oppId || m.player2Id === oppId) {
            remainingForOpp++;
          }
        }
        const score =
          remainingForOpp + (preferDifferent ? 10000 : 0) + idxs.length;
        if (score > bestScore) {
          bestScore = score;
          bestOppId = oppId;
        }
      }

      if (bestOppId === null) break;
      const matchIdx = opponents.get(bestOppId)![0];
      picked.push(matchIdx);
      prevOpponentId = bestOppId;
    }

    for (let i = 0; i < picked.length; i++) {
      const matchIdx = picked[i];
      const match = matches[matchIdx];
      const stayingId = stayingPlayer.id;
      const opponentId =
        match.player1Id === stayingId ? match.player2Id : match.player1Id;

      const pair = getPairCount(stayingId, opponentId);
      const stayingIsA = stayingId < opponentId;
      const stayingLeftCount = stayingIsA ? pair.aLeft : pair.bLeft;
      const stayingRightCount = stayingIsA ? pair.bLeft : pair.aLeft;
      const stayingOnLeft = stayingLeftCount <= stayingRightCount;

      const stayingIsP1 = match.player1Id === stayingId;
      const swapSides = stayingOnLeft ? !stayingIsP1 : stayingIsP1;

      if (stayingOnLeft) {
        if (stayingIsA) pair.aLeft++;
        else pair.bLeft++;
      } else {
        if (stayingIsA) pair.bLeft++;
        else pair.aLeft++;
      }

      result.push({
        matchId: match.id,
        order: result.length,
        swapSides,
        stayingPlayerId: stayingId,
        isLastInTurn: i === picked.length - 1,
      });

      pool.delete(matchIdx);
      const avIdx = available.indexOf(matchIdx);
      if (avIdx !== -1) available.splice(avIdx, 1);
    }
  }

  return result;
}
