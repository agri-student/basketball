import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function OpponentHistory() {
  const [opponents, setOpponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/games/opponents')
      .then(r => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
      .then(setOpponents)
      .catch(err => { console.error(err); setError('Failed to load opponent history.'); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" role="status" aria-label="Loading opponent history" />;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Opponent History</h1>
        <Link to="/" className="btn btn-outline">Back</Link>
      </div>

      {error && (
        <div className="error-banner" role="alert"><span>{error}</span></div>
      )}

      {opponents.length === 0 ? (
        <div className="empty-state">
          <p>No opponent data yet. Record games with opponent names to see history.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Opponent</th>
                  <th>Games</th>
                  <th>Record</th>
                  <th>Win%</th>
                  <th>Avg Score</th>
                  <th>Last Played</th>
                </tr>
              </thead>
              <tbody>
                {opponents.map(o => {
                  const winPct = o.games_played > 0 ? ((o.wins / o.games_played) * 100).toFixed(0) : 0;
                  return (
                    <tr key={o.opponent}>
                      <td style={{ fontWeight: 600 }}>{o.opponent}</td>
                      <td>{o.games_played}</td>
                      <td>
                        <span className="win">{o.wins}W</span>
                        {' - '}
                        <span className="lose">{o.losses}L</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{winPct}%</td>
                      <td>{o.avg_my_score}-{o.avg_opponent_score}</td>
                      <td>{o.last_played}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
