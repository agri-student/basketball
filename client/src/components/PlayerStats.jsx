import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function PlayerStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/stats/players')
      .then(r => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
      .then(setStats)
      .catch(err => { console.error(err); setError('Failed to load player stats.'); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" role="status" aria-label="Loading player stats" />;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Player Stats</h1>
        <Link to="/" className="btn btn-outline">Back</Link>
      </div>

      {error && (
        <div className="error-banner" role="alert"><span>{error}</span></div>
      )}

      {stats.length === 0 ? (
        <div className="empty-state">
          <p>No player shot data yet. Record shots with player assignments to see stats.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>GP</th>
                  <th>PTS</th>
                  <th>PPG</th>
                  <th>FG%</th>
                  <th>3P%</th>
                  <th>FT%</th>
                  <th>FGM/A</th>
                  <th>3PM/A</th>
                  <th>FTM/A</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>#{p.number} {p.name}</td>
                    <td>{p.games_played}</td>
                    <td style={{ fontWeight: 600 }}>{p.total_points}</td>
                    <td>{p.ppg}</td>
                    <td>{p.fg_pct != null ? `${p.fg_pct}%` : '-'}</td>
                    <td>{p.three_pct != null ? `${p.three_pct}%` : '-'}</td>
                    <td>{p.ft_pct != null ? `${p.ft_pct}%` : '-'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{p.fgm}/{p.fga}</td>
                    <td style={{ fontSize: '0.85rem' }}>{p.three_pm}/{p.three_pa}</td>
                    <td style={{ fontSize: '0.85rem' }}>{p.ftm}/{p.fta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
