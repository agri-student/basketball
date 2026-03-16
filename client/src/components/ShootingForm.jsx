import { useState, useEffect } from 'react';

export default function ShootingForm() {
  const [shotType, setShotType] = useState('2pt');
  const [log, setLog] = useState([]);
  const [games, setGames] = useState([]);
  const [gameId, setGameId] = useState('');

  useEffect(() => {
    fetch('/api/games').then(r => r.json()).then(setGames);
  }, []);

  const recordShot = async (made) => {
    const res = await fetch('/api/shots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_id: gameId || null, shot_type: shotType, made }),
    });
    if (res.ok) {
      const data = await res.json();
      setLog(prev => [{ id: data.id, shot_type: shotType, made, time: new Date().toLocaleTimeString() }, ...prev]);
    }
  };

  const undoLast = async () => {
    if (log.length === 0) return;
    const last = log[0];
    await fetch(`/api/shots/${last.id}`, { method: 'DELETE' });
    setLog(prev => prev.slice(1));
  };

  const summary = (type) => {
    const shots = log.filter(s => s.shot_type === type);
    if (shots.length === 0) return { made: 0, total: 0, pct: '-' };
    const made = shots.filter(s => s.made).length;
    return { made, total: shots.length, pct: `${(made / shots.length * 100).toFixed(1)}%` };
  };

  const s2 = summary('2pt');
  const s3 = summary('3pt');
  const sft = summary('ft');
  const allFg = log.filter(s => s.shot_type !== 'ft');
  const fgPct = allFg.length > 0
    ? `${(allFg.filter(s => s.made).length / allFg.length * 100).toFixed(1)}%`
    : '-';

  return (
    <>
      <h1>Shooting Record</h1>

      <div className="card">
        <div className="form-group">
          <label>Game (optional)</label>
          <select value={gameId} onChange={e => setGameId(e.target.value)}>
            <option value="">Practice (no game)</option>
            {games.map(g => (
              <option key={g.id} value={g.id}>{g.date} vs {g.opponent}</option>
            ))}
          </select>
        </div>

        <div className="shot-type-tabs">
          {['2pt', '3pt', 'ft'].map(type => (
            <button
              key={type}
              className={`shot-type-tab ${shotType === type ? 'active' : ''}`}
              onClick={() => setShotType(type)}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="shot-buttons">
          <button className="shot-btn made" onClick={() => recordShot(1)}>
            MADE
          </button>
          <button className="shot-btn missed" onClick={() => recordShot(0)}>
            MISSED
          </button>
        </div>

        {log.length > 0 && (
          <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
            <button className="btn btn-outline" onClick={undoLast}>Undo Last</button>
          </div>
        )}
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="stat-label">FG%</div>
          <div className="stat-value">{fgPct}</div>
        </div>
        <div className="card">
          <div className="stat-label">2PT</div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{s2.made}/{s2.total}</div>
          <div className="stat-label">{s2.pct}</div>
        </div>
        <div className="card">
          <div className="stat-label">3PT</div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{s3.made}/{s3.total}</div>
          <div className="stat-label">{s3.pct}</div>
        </div>
        <div className="card">
          <div className="stat-label">FT</div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{sft.made}/{sft.total}</div>
          <div className="stat-label">{sft.pct}</div>
        </div>
      </div>

      {log.length > 0 && (
        <div className="card">
          <h2>Shot Log ({log.length} shots)</h2>
          <div className="shot-log">
            {log.map(s => (
              <div key={s.id} className="shot-log-item">
                <span>{s.shot_type.toUpperCase()}</span>
                <span className={s.made ? 'win' : 'lose'}>{s.made ? 'MADE' : 'MISSED'}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{s.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
