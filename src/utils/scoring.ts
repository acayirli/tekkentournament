import type { Match, PlayerScore, Player } from "../types";

export function calculateScores(
  players: Player[],
  matches: Match[],
  crownOverrides: Record<string, number>
): PlayerScore[] {
  const scores = new Map<string, PlayerScore>();

  for (const p of players) {
    scores.set(p.id, {
      playerId: p.id,
      playerName: p.name,
      wins: 0,
      losses: 0,
      total: 0,
      winRate: 0,
      crowns: 0,
      tiebroken: false,
    });
  }

  // Head-to-head record: h2h[a][b] = wins of a against b
  const h2h = new Map<string, Map<string, number>>();
  for (const p of players) {
    h2h.set(p.id, new Map());
  }

  for (const match of matches) {
    if (!match.winnerId) continue;

    const loserId =
      match.winnerId === match.player1Id
        ? match.player2Id
        : match.player1Id;

    const winner = scores.get(match.winnerId);
    const loser = scores.get(loserId);

    if (winner) {
      winner.wins++;
      winner.total++;
    }
    if (loser) {
      loser.losses++;
      loser.total++;
    }

    const winnerH2h = h2h.get(match.winnerId);
    if (winnerH2h) {
      winnerH2h.set(loserId, (winnerH2h.get(loserId) || 0) + 1);
    }
  }

  const result = Array.from(scores.values());
  for (const s of result) {
    s.winRate = s.total > 0 ? s.wins / s.total : 0;
  }

  result.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const aVsB = h2h.get(a.playerId)?.get(b.playerId) || 0;
    const bVsA = h2h.get(b.playerId)?.get(a.playerId) || 0;
    if (aVsB !== bVsA) {
      a.tiebroken = true;
      b.tiebroken = true;
      return bVsA - aVsB;
    }
    return 0;
  });

  const n = players.length;
  for (let rank = 0; rank < result.length; rank++) {
    const playerId = result[rank].playerId;
    if (playerId in crownOverrides) {
      result[rank].crowns = crownOverrides[playerId];
    } else {
      result[rank].crowns = Math.max(0, n - 1 - rank);
    }
  }

  return result;
}

export function calculateAllTimeCrowns(
  seasonCrowns: Record<string, number>[],
  globalOverrides: Record<string, number>
): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const crowns of seasonCrowns) {
    for (const [pid, count] of Object.entries(crowns)) {
      totals[pid] = (totals[pid] || 0) + count;
    }
  }

  for (const [pid, override] of Object.entries(globalOverrides)) {
    totals[pid] = override;
  }

  return totals;
}
