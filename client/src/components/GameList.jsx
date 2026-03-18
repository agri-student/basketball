import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function GameList() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch('/api/games')
      .then(r => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
      .then(setGames)
      .catch(err => { console.error(err); setError('Failed to load games.'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="spinner" role="status" aria-label="Loading games" />;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Games</h1>
        <Link to="/games/new" className="btn btn-primary">+ New Game</Link>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button onClick={load}>Retry</button>
        </div>
      )}

      {games.length === 0 ? (
        <div className="empty-state">
          <p>No games recorded yet.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Opponent</th><th>Score</th>
                  <th>PTS</th><th>REB</th><th>AST</th><th>Result</th><th></th>
                </tr>
              </thead>
              <tbody>
                {games.map(g => {
                  const isWin = g.my_score > g.opponent_score;
                  const isLoss = g.my_score < g.opponent_score;
                  return (
                    <tr key={g.id}>
                      <td><Link to={`/games/${g.id}`}>{g.date}</Link></td>
                      <td>{g.opponent}</td>
                      <td>{g.my_score}-{g.opponent_score}</td>
                      <td>{g.points ?? '-'}</td>
                      <td>{g.rebounds ?? '-'}</td>
                      <td>{g.assists ?? '-'}</td>
                      <td className={isWin ? 'win' : isLoss ? 'lose' : ''}>
                        {isWin ? 'WIN' : isLoss ? 'LOSS' : 'DRAW'}
                      </td>
                      <td>
                        <Link to={`/games/${g.id}/live`} className="btn btn-info" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minHeight: 'auto' }}>
                          Live
                        </Link>
                      </td>
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
