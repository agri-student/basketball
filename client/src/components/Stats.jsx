import { useState, useEffect } from 'react';
import ZoneStats from './ZoneStats';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

export default function Stats() {
  const [averages, setAverages] = useState(null);
  const [shooting, setShooting] = useState(null);
  const [trends, setTrends] = useState(null);
  const [zoneStats, setZoneStats] = useState([]);
  const [advanced, setAdvanced] = useState(null);
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
      fetchJson('/api/stats/zones'),
      fetchJson(`/api/stats/advanced${q}`),
    ]).then(([avg, shoot, trend, zones, adv]) => {
      setAverages(avg);
      setShooting(shoot);
      setTrends(trend);
      setZoneStats(zones);
      setAdvanced(adv);
    }).catch(err => {
      console.error('Stats load error:', err);
      setError('Failed to load statistics.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(dateFrom, dateTo); }, []);

  const applyFilter = () => loadData(dateFrom, dateTo);
  const clearFilter = () => { setDateFrom(''); setDateTo(''); loadData('', ''); };

  if (loading) return <div className="spinner" role="status" aria-label="Loading statistics" />;

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
      { label: 'FG%', data: trends.shooting_trends.map(g => g.fg_pct), borderColor: '#e65100', tension: 0.3 },
      { label: '3P%', data: trends.shooting_trends.map(g => g.three_pct), borderColor: '#1565c0', tension: 0.3 },
    ],
  } : null;

  return (
    <>
      <h1>Statistics</h1>

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button onClick={() => loadData(dateFrom, dateTo)}>Retry</button>
        </div>
      )}

      <div className="filter-bar" role="search" aria-label="Date range filter">
        <div className="form-group">
          <label htmlFor="stats-from">From</label>
          <input id="stats-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="stats-to">To</label>
          <input id="stats-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={applyFilter}>Filter</button>
        {(dateFrom || dateTo) && <button className="btn btn-outline" onClick={clearFilter}>Clear</button>}
      </div>

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

      {advanced && (advanced.ts_pct || advanced.efg_pct) && (
        <div className="card">
          <h2>Advanced Stats</h2>
          <div className="card-grid">
            <div>
              <div className="stat-label">TS% (True Shooting)</div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{advanced.ts_pct != null ? `${advanced.ts_pct}%` : '-'}</div>
            </div>
            <div>
              <div className="stat-label">eFG% (Effective FG)</div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{advanced.efg_pct != null ? `${advanced.efg_pct}%` : '-'}</div>
            </div>
            <div>
              <div className="stat-label">FG</div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{advanced.fgm}/{advanced.fga}</div>
            </div>
            <div>
              <div className="stat-label">3PM</div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{advanced.three_pm}</div>
            </div>
            <div>
              <div className="stat-label">FT</div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{advanced.ftm}/{advanced.fta}</div>
            </div>
            <div>
              <div className="stat-label">Total Points</div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{advanced.total_points}</div>
            </div>
          </div>
        </div>
      )}

      {advanced?.quarter_performance?.length > 0 && (
        <div className="card">
          <h2>Quarter Performance</h2>
          <div className="card-grid">
            {advanced.quarter_performance.map(q => (
              <div key={q.quarter}>
                <div className="stat-label">Q{q.quarter}</div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{q.points} pts</div>
                <div className="stat-label">
                  {q.fg_pct != null ? `${q.fg_pct}% FG` : '-'} ({q.made_shots}/{q.total_shots})
                </div>
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
