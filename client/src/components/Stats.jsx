import { useState, useEffect } from 'react';
import ZoneStats from './ZoneStats';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function Stats() {
  const [averages, setAverages] = useState(null);
  const [shooting, setShooting] = useState(null);
  const [trends, setTrends] = useState(null);
  const [zoneStats, setZoneStats] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats/averages').then(r => r.json()),
      fetch('/api/stats/shooting').then(r => r.json()),
      fetch('/api/stats/trends').then(r => r.json()),
      fetch('/api/stats/zones').then(r => r.json()),
    ]).then(([avg, shoot, trend, zones]) => {
      setAverages(avg);
      setShooting(shoot);
      setTrends(trend);
      setZoneStats(zones);
    });
  }, []);

  const shootingBar = shooting?.by_type?.length ? {
    labels: shooting.by_type.map(s => s.shot_type.toUpperCase()),
    datasets: [{
      label: 'Made',
      data: shooting.by_type.map(s => s.made),
      backgroundColor: '#2e7d32',
    }, {
      label: 'Missed',
      data: shooting.by_type.map(s => s.total - s.made),
      backgroundColor: '#c62828',
    }],
  } : null;

  const pointsTrend = trends?.game_trends?.length > 1 ? {
    labels: trends.game_trends.map(g => g.date),
    datasets: [
      { label: 'Points', data: trends.game_trends.map(g => g.points), borderColor: '#e65100', tension: 0.3 },
      { label: 'Rebounds', data: trends.game_trends.map(g => g.rebounds), borderColor: '#1565c0', tension: 0.3 },
      { label: 'Assists', data: trends.game_trends.map(g => g.assists), borderColor: '#2e7d32', tension: 0.3 },
    ],
  } : null;

  const shootingTrend = trends?.shooting_trends?.length > 1 ? {
    labels: trends.shooting_trends.map(g => g.date),
    datasets: [
      {
        label: 'FG%',
        data: trends.shooting_trends.map(g => g.fg_pct),
        borderColor: '#e65100',
        tension: 0.3,
      },
      {
        label: '3P%',
        data: trends.shooting_trends.map(g => g.three_pct),
        borderColor: '#1565c0',
        tension: 0.3,
      },
    ],
  } : null;

  return (
    <>
      <h1>Statistics</h1>

      {averages && (
        <div className="card">
          <h2>Season Averages ({averages.games_played} games)</h2>
          <div className="card-grid">
            {[
              ['PPG', averages.avg_points],
              ['RPG', averages.avg_rebounds],
              ['APG', averages.avg_assists],
              ['SPG', averages.avg_steals],
              ['BPG', averages.avg_blocks],
              ['TOPG', averages.avg_turnovers],
            ].map(([label, val]) => (
              <div key={label}>
                <div className="stat-label">{label}</div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{val ?? '-'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {shooting && (
        <div className="card">
          <h2>Shooting Summary</h2>
          <div className="card-grid">
            <div>
              <div className="stat-label">FG%</div>
              <div className="stat-value">{shooting.field_goal?.percentage ?? '-'}%</div>
              <div className="stat-label">{shooting.field_goal?.made ?? 0}/{shooting.field_goal?.total ?? 0}</div>
            </div>
            {shooting.by_type.map(s => (
              <div key={s.shot_type}>
                <div className="stat-label">{s.shot_type.toUpperCase()}</div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{s.percentage}%</div>
                <div className="stat-label">{s.made}/{s.total}</div>
              </div>
            ))}
          </div>
          {shootingBar && (
            <div className="chart-container" style={{ height: '200px' }}>
              <Bar data={shootingBar} options={{
                responsive: true, maintainAspectRatio: false,
                scales: { x: { stacked: true }, y: { stacked: true } },
              }} />
            </div>
          )}
        </div>
      )}

      <ZoneStats zones={zoneStats} />

      {pointsTrend && (
        <div className="card">
          <h2>Stats Trend</h2>
          <div className="chart-container">
            <Line data={pointsTrend} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      )}

      {shootingTrend && (
        <div className="card">
          <h2>Shooting % Trend</h2>
          <div className="chart-container">
            <Line data={shootingTrend} options={{
              responsive: true, maintainAspectRatio: false,
              scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' } } },
            }} />
          </div>
        </div>
      )}

      {!averages?.games_played && (
        <div className="empty-state">
          <p>No data yet. Start by recording some games!</p>
        </div>
      )}
    </>
  );
}
