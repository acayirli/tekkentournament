import { useMemo, useState } from "react";
import { useTournamentStore } from "../../store/useTournamentStore";
import { CHARACTER_MAP } from "../../data/characters";
import { CharacterPortrait } from "../shared/CharacterPortrait";
import {
  computeStatistics,
  computeGlobalCharStats,
  type CharStat,
  type OpponentStat,
  type PlayerStatistics,
} from "../../utils/statistics";

// Min. games before a rate is trustworthy enough to headline / rank.
const HIGHLIGHT_MIN = 2;
const TIER_MIN = 3;
const ALL = "all";

const pct = (r: number) => Math.round(r * 100);

function WinRateBar({ rate }: { rate: number }) {
  return (
    <div className="progress-bar stats-bar">
      <div className="fill" style={{ width: `${pct(rate)}%` }} />
    </div>
  );
}

function CharCell({ charId }: { charId: string }) {
  const char = CHARACTER_MAP.get(charId);
  if (!char) {
    return <span className="stats-char-name">{charId}</span>;
  }
  return (
    <div className="stats-char-cell">
      <CharacterPortrait character={char} className="stats-portrait" />
      <span className="stats-char-name">{char.name}</span>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="stat-card">
      <div className={`stat-card-value ${tone ?? ""}`}>{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

// Highlights derived from the aggregated player stats.
function bestBy<T>(items: T[], key: (t: T) => CharStat, cmp: (a: number, b: number) => number, min: number): T | null {
  let best: T | null = null;
  let bestRate = 0;
  for (const it of items) {
    const s = key(it);
    if (s.games < min) continue;
    if (best === null || cmp(s.winRate, bestRate) > 0) {
      best = it;
      bestRate = s.winRate;
    }
  }
  return best;
}

function PlayerPanel({ stats }: { stats: PlayerStatistics }) {
  const chars = useMemo(
    () =>
      Object.entries(stats.perCharacter).sort(
        (a, b) => b[1].games - a[1].games || b[1].winRate - a[1].winRate
      ),
    [stats]
  );

  const mostPlayed = chars[0];
  const bestChar = bestBy(chars, (c) => c[1], (a, b) => a - b, HIGHLIGHT_MIN);
  const nemesis = bestBy(stats.vsPlayers, (o) => o, (a, b) => b - a, HIGHLIGHT_MIN);
  const favVictim = bestBy(stats.vsPlayers, (o) => o, (a, b) => a - b, HIGHLIGHT_MIN);

  const ownChars = useMemo(
    () =>
      Object.keys(stats.charMatchups).sort(
        (a, b) => (stats.perCharacter[b]?.games ?? 0) - (stats.perCharacter[a]?.games ?? 0)
      ),
    [stats]
  );

  const charName = (id: string) => CHARACTER_MAP.get(id)?.name ?? id;

  return (
    <div>
      {/* Overview */}
      <div className="stat-card-grid">
        <StatCard label="Spiele" value={String(stats.overall.games)} />
        <StatCard label="Siege" value={String(stats.overall.wins)} tone="win" />
        <StatCard label="Niederlagen" value={String(stats.overall.losses)} tone="loss" />
        <StatCard label="Winrate" value={`${pct(stats.overall.winRate)}%`} tone="gold" />
      </div>

      {/* Highlights */}
      <div className="stat-badge-grid">
        {mostPlayed && (
          <div className="stat-badge">
            <span className="stat-badge-label">Meistgespielt</span>
            <span className="stat-badge-value">
              {charName(mostPlayed[0])} · {mostPlayed[1].games} Spiele
            </span>
          </div>
        )}
        {bestChar && (
          <div className="stat-badge">
            <span className="stat-badge-label">Bester Charakter</span>
            <span className="stat-badge-value win">
              {charName(bestChar[0])} · {pct(bestChar[1].winRate)}%
            </span>
          </div>
        )}
        {favVictim && favVictim.winRate >= 0.5 && (
          <div className="stat-badge">
            <span className="stat-badge-label">Lieblingsopfer</span>
            <span className="stat-badge-value win">
              {favVictim.name} · {favVictim.wins}–{favVictim.losses}
            </span>
          </div>
        )}
        {nemesis && nemesis.winRate < 0.5 && (
          <div className="stat-badge">
            <span className="stat-badge-label">Angstgegner</span>
            <span className="stat-badge-value loss">
              {nemesis.name} · {nemesis.wins}–{nemesis.losses}
            </span>
          </div>
        )}
      </div>

      {/* Section 1: per-character performance */}
      <h3 className="stats-section-title">Charakter-Performance</h3>
      <div className="stats-table-wrap">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Charakter</th>
              <th>Spiele</th>
              <th>S–N</th>
              <th className="stats-rate-col">Winrate</th>
            </tr>
          </thead>
          <tbody>
            {chars.map(([charId, s]) => (
              <tr key={charId}>
                <td><CharCell charId={charId} /></td>
                <td>{s.games}</td>
                <td>
                  <span className="win">{s.wins}</span>–<span className="loss">{s.losses}</span>
                </td>
                <td className="stats-rate-col">
                  <div className="stats-rate-cell">
                    <WinRateBar rate={s.winRate} />
                    <span className="stats-rate-num">{pct(s.winRate)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 2: character-vs-character matchups */}
      <h3 className="stats-section-title">Charakter-Matchups</h3>
      {ownChars.map((ownId) => (
        <div key={ownId} className="matchup-group">
          <div className="matchup-group-head">
            <CharCell charId={ownId} />
          </div>
          <div className="matchup-list">
            {stats.charMatchups[ownId].map((mu) => (
              <div
                key={mu.charId}
                className="matchup-chip"
                title={`${charName(ownId)} vs ${charName(mu.charId)}: ${mu.wins}–${mu.losses} (${pct(mu.winRate)}%)`}
              >
                <CharCell charId={mu.charId} />
                <span className="matchup-record">
                  <span className="win">{mu.wins}</span>–<span className="loss">{mu.losses}</span>
                </span>
                <span className={`matchup-rate ${mu.winRate >= 0.5 ? "win" : "loss"}`}>
                  {pct(mu.winRate)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Section 3: head-to-head vs. other players */}
      <h3 className="stats-section-title">Gegner-Bilanz</h3>
      <div className="stats-table-wrap">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Gegner</th>
              <th>Spiele</th>
              <th>S–N</th>
              <th className="stats-rate-col">Winrate</th>
            </tr>
          </thead>
          <tbody>
            {stats.vsPlayers.map((o: OpponentStat) => (
              <tr key={o.name}>
                <td className="stats-opp-name">{o.name}</td>
                <td>{o.games}</td>
                <td>
                  <span className="win">{o.wins}</span>–<span className="loss">{o.losses}</span>
                </td>
                <td className="stats-rate-col">
                  <div className="stats-rate-cell">
                    <WinRateBar rate={o.winRate} />
                    <span className="stats-rate-num">{pct(o.winRate)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatisticsView() {
  const seasons = useTournamentStore((s) => s.seasons);
  const [seasonFilter, setSeasonFilter] = useState<string>(ALL);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const scopedTournaments = useMemo(() => {
    const scoped =
      seasonFilter === ALL
        ? seasons
        : seasons.filter((s) => s.id === seasonFilter);
    return scoped.flatMap((s) => s.tournaments);
  }, [seasons, seasonFilter]);

  const playerStats = useMemo(
    () => computeStatistics(scopedTournaments),
    [scopedTournaments]
  );

  const globalChars = useMemo(
    () => computeGlobalCharStats(scopedTournaments),
    [scopedTournaments]
  );

  // Players sorted by total games desc; used for the selector and default pick.
  const playerNames = useMemo(
    () =>
      Object.values(playerStats)
        .sort((a, b) => b.overall.games - a.overall.games)
        .map((p) => p.name),
    [playerStats]
  );

  const activePlayer =
    selectedPlayer && playerStats[selectedPlayer]
      ? selectedPlayer
      : playerNames[0] ?? null;

  return (
    <div className="stats-view">
      <div className="section-title">Statistiken</div>

      <div className="view-toggle stats-toggle">
        <button
          className={`tekken-btn small ${seasonFilter === ALL ? "" : "secondary"}`}
          onClick={() => setSeasonFilter(ALL)}
        >
          Alle Seasons
        </button>
        {seasons.map((s) => (
          <button
            key={s.id}
            className={`tekken-btn small ${seasonFilter === s.id ? "" : "secondary"}`}
            onClick={() => setSeasonFilter(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      {playerNames.length === 0 ? (
        <div className="empty-state">
          <h3>Noch keine Statistiken</h3>
          <p>
            Sobald ein Turnier finalisiert wurde, erscheinen hier die
            Auswertungen.
          </p>
        </div>
      ) : (
        <>
          <div className="view-toggle stats-toggle stats-player-select">
            {playerNames.map((name) => (
              <button
                key={name}
                className={`tekken-btn small ${activePlayer === name ? "" : "secondary"}`}
                onClick={() => setSelectedPlayer(name)}
              >
                {name}
              </button>
            ))}
          </div>

          {activePlayer && playerStats[activePlayer] && (
            <PlayerPanel stats={playerStats[activePlayer]} />
          )}

          {/* Global, cross-player section */}
          <h3 className="stats-section-title">Charakter-Tierlist (alle Spieler)</h3>
          <p className="stats-note">
            Winrate über alle Spieler · min. {TIER_MIN} Spiele
          </p>
          <div className="stats-table-wrap">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Charakter</th>
                  <th>Spiele</th>
                  <th>Spieler</th>
                  <th className="stats-rate-col">Winrate</th>
                </tr>
              </thead>
              <tbody>
                {globalChars
                  .filter((c) => c.games >= TIER_MIN)
                  .map((c, i) => (
                    <tr key={c.charId}>
                      <td className={`rank ${i === 0 ? "gold" : ""}`}>{i + 1}</td>
                      <td><CharCell charId={c.charId} /></td>
                      <td>{c.games}</td>
                      <td>{c.players}</td>
                      <td className="stats-rate-col">
                        <div className="stats-rate-cell">
                          <WinRateBar rate={c.winRate} />
                          <span className="stats-rate-num">{pct(c.winRate)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
