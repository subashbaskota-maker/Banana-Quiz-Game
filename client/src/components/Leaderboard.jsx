import { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../api/puzzleApi.js';

function Leaderboard({ onClose }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchLeaderboard()
      .then(({ entries: leaderboardEntries }) => {
        if (active) {
          setEntries(leaderboardEntries);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Could not load the leaderboard.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [retry]);

  return (
    <div className="leaderboard-view">
      <header className="leaderboard-heading">
        <div>
          <p className="eyebrow">ALL-TIME</p>
          <h2>Leaderboard</h2>
        </div>
        <button className="text-button" type="button" onClick={onClose}>
          ← Back to game
        </button>
      </header>

      {loading && <p className="status-message">Loading leaderboard…</p>}
      {error && (
        <div className="error-box" role="alert">
          <p>{error}</p>
          <button className="primary-button" type="button" onClick={() => setRetry((attempt) => attempt + 1)}>
            Try again
          </button>
        </div>
      )}
      {!loading && !error && entries.length === 0 && (
        <p className="leaderboard-empty">No scores yet. Solve a puzzle to claim the first spot.</p>
      )}
      {!loading && !error && entries.length > 0 && (
        <ol className="leaderboard-list" aria-label="Top players by puzzles solved">
          {entries.map((entry) => (
            <li className="leaderboard-entry" key={entry.rank}>
              <span className={`leaderboard-rank${entry.rank === 1 ? ' leaderboard-rank-first' : ''}`}>
                {String(entry.rank).padStart(2, '0')}
              </span>
              <strong className="leaderboard-player">{entry.player}</strong>
              <span className="leaderboard-score">
                <strong>{entry.score}</strong>
                <small>{entry.score === 1 ? 'puzzle' : 'puzzles'}</small>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default Leaderboard;