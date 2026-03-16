import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [averages, setAverages] = useState(null);
  const [shooting, setShooting] = useState(null);
  const [trends, setTrends] = useState(null);
  const [recentGames, setRecentGames] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats/averages').then(r => r.json()),
      fetch('/api/stats/shooting').then(r => r.json()),
      fetch('/api/stats/trends').then(r => r.json()),
      fetch('/api/games').then(r => r.json()),
    ]).then(([avg, shoot, trend, games]) => {
      setAverages(avg);
      setShooting(shoot);
      setTrends(trend);
      setRecentGames(games.slice(0, 5));
    });
  }, []);

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

  return (
    <>
      <h1>Dashboard</h1>

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
          <div className="stat-value">{shooting?.field_goal?.percentage ?? '-'}%</div>
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
          <table>
            <thead>
              <tr><th>Date</th><th>Opponent</th><th>Score</th><th>PTS</th><th>Result</th></tr>
            </thead>
            <tbody>
              {recentGames.map(g => (
                <tr key={g.id}>
                  <td><Link to={`/games/${g.id}`}>{g.date}</Link></td>
                  <td>{g.opponent}</td>
                  <td>{g.my_score}-{g.opponent_score}</td>
                  <td>{g.points ?? '-'}</td>
                  <td className={g.my_score > g.opponent_score ? 'win' : g.my_score < g.opponent_score ? 'lose' : ''}>
                    {g.my_score > g.opponent_score ? 'W' : g.my_score < g.opponent_score ? 'L' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
