import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

export default function Dashboard() {
  const [averages, setAverages] = useState(null);
  const [shooting, setShooting] = useState(null);
  const [trends, setTrends] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadData = (from, to) => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const q = qs.toString() ? `?${qs}` : '';

    Promise.all([
      fetchJson(`/api/stats/averages${q}`),
      fetchJson(`/api/stats/shooting${q}`),
      fetchJson(`/api/stats/trends${q}`),
      fetchJson(`/api/games${q}`),
    ]).then(([avg, shoot, trend, games]) => {
      setAverages(avg);
      setShooting(shoot);
      setTrends(trend);
      setRecentGames(games.slice(0, 5));
    }).catch(err => {
      console.error('Dashboard load error:', err);
      setError('Failed to load dashboard data. Please try again.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(dateFrom, dateTo); }, []);

  const applyFilter = () => loadData(dateFrom, dateTo);
  const clearFilter = () => { setDateFrom(''); setDateTo(''); loadData('', ''); };

  const getShootingPct = (type) => {
    if (!shooting) return '-';
    const s = shooting.by_type.find(t => t.shot_type === type);
    return s ? `${s.percentage}%` : '-';
  };

  const trendChart = trends?.game_trends?.length > 1 ? {
    labels: trends.game_trends.map(g => g.date),
    datasets: [
      {
        label: 'Points',
        data: trends.game_trends.map(g => g.points),
        borderColor: '#e65100',
        backgroundColor: 'rgba(230,81,0,.1)',
        tension: 0.3,
      },
    ],
  } : null;

  if (loading) return <div className="spinner" role="status" aria-label="Loading dashboard" />;

  return (
    <>
      <h1>Dashboard</h1>

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button onClick={() => loadData(dateFrom, dateTo)}>Retry</button>
        </div>
      )}

      <div className="filter-bar" role="search" aria-label="Date range filter">
        <div className="form-group">
          <label htmlFor="dash-from">From</label>
          <input id="dash-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="dash-to">To</label>
          <input id="dash-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={applyFilter}>Filter</button>
        {(dateFrom || dateTo) && <button className="btn btn-outline" onClick={clearFilter}>Clear</button>}
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="stat-label">Games Played</div>
          <div className="stat-value">{averages?.games_played ?? 0}</div>
        </div>
        <div className="card">
          <div className="stat-label">Avg Points</div>
          <div className="stat-value">{averages?.avg_points ?? '-'}</div>
        </div>
        <div className="card">
          <div className="stat-label">FG%</div>
          <div className="stat-value">{shooting?.field_goal?.percentage != null ? `${shooting.field_goal.percentage}%` : '-'}</div>
        </div>
        <div className="card">
          <div className="stat-label">3P%</div>
          <div className="stat-value">{getShootingPct('3pt')}</div>
        </div>
      </div>

      {trendChart && (
        <div className="card">
          <h2>Points Trend</h2>
          <div className="chart-container">
            <Line data={trendChart} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0 }}>Recent Games</h2>
          <Link to="/games/new" className="btn btn-primary">+ New Game</Link>
        </div>
        {recentGames.length === 0 ? (
          <div className="empty-state">
            <p>No games recorded yet.</p>
            <Link to="/games/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>Record your first game</Link>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Date</th><th>Opponent</th><th>Score</th><th>PTS</th><th>Result</th></tr>
              </thead>
              <tbody>
                {recentGames.map(g => {
                  const isWin = g.my_score > g.opponent_score;
                  const isLoss = g.my_score < g.opponent_score;
                  return (
                    <tr key={g.id}>
                      <td><Link to={`/games/${g.id}`}>{g.date}</Link></td>
                      <td>{g.opponent}</td>
                      <td>{g.my_score}-{g.opponent_score}</td>
                      <td>{g.points ?? '-'}</td>
                      <td className={isWin ? 'win' : isLoss ? 'lose' : ''}>
                        {isWin ? 'WIN' : isLoss ? 'LOSS' : 'DRAW'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Link to="/opponents" className="btn btn-outline">Opponent History</Link>
        <Link to="/player-stats" className="btn btn-outline">Player Stats</Link>
        <Link to="/export" className="btn btn-outline">Export Data</Link>
      </div>
    </>
  );
}
