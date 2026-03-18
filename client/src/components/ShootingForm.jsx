import { useState, useEffect } from 'react';
import CourtZones from './CourtZones';
import { ZONES } from './CourtZones';

export default function ShootingForm() {
  const [shotType, setShotType] = useState('2pt');
  const [zone, setZone] = useState(null);
  const [log, setLog] = useState([]);
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [gameId, setGameId] = useState('');
  const [playerId, setPlayerId] = useState('');

  useEffect(() => {
    fetch('/api/games').then(r => r.json()).then(setGames);
    fetch('/api/players').then(r => r.json()).then(setPlayers);
  }, []);

  const recordShot = async (made) => {
    const body = {
      game_id: gameId || null,
      shot_type: shotType,
      made,
      zone: shotType === 'ft' ? null : zone,
      player_id: playerId || null,
    };
    const res = await fetch('/api/shots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      const player = playerId ? players.find(p => p.id === Number(playerId)) : null;
      setLog(prev => [{ id: data.id, shot_type: shotType, made, zone: body.zone, playerName: player?.name, time: new Date().toLocaleTimeString() }, ...prev]);
      setZone(null);
    }
  };

  const undoLast = async () => {
    if (log.length === 0) return;
    await fetch(`/api/shots/${log[0].id}`, { method: 'DELETE' });
    setLog(prev => prev.slice(1));
  };

  const summary = (type) => {
    const shots = log.filter(s => s.shot_type === type);
    if (shots.length === 0) return { made: 0, total: 0, pct: '-' };
    const made = shots.filter(s => s.made).length;
    return { made, total: shots.length, pct: `${(made / shots.length * 100).toFixed(1)}%` };
  };

  const s2 = summary('2pt'), s3 = summary('3pt'), sft = summary('ft');
  const allFg = log.filter(s => s.shot_type !== 'ft');
  const fgPct = allFg.length > 0 ? `${(allFg.filter(s => s.made).length / allFg.length * 100).toFixed(1)}%` : '-';

  // Zone stats from current session
  const zoneShots = log.filter(s => s.zone && s.shot_type !== 'ft');
  const zoneMap = {};
  for (const s of zoneShots) {
    if (!zoneMap[s.zone]) zoneMap[s.zone] = { total: 0, made: 0 };
    zoneMap[s.zone].total++;
    if (s.made) zoneMap[s.zone].made++;
  }

  return (
    <>
      <h1>Shooting Record</h1>

      <div className="card">
        <div className="form-row">
          <div className="form-group">
            <label>Game (optional)</label>
            <select value={gameId} onChange={e => setGameId(e.target.value)}>
              <option value="">Practice (no game)</option>
              {games.map(g => <option key={g.id} value={g.id}>{g.date} vs {g.opponent}</option>)}
            </select>
          </div>
          {players.length > 0 && (
            <div className="form-group">
              <label>Player (optional)</label>
              <select value={playerId} onChange={e => setPlayerId(e.target.value)}>
                <option value="">Not specified</option>
                {players.map(p => <option key={p.id} value={p.id}>#{p.number} {p.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="shot-type-tabs">
          {['2pt', '3pt', 'ft'].map(type => (
            <button key={type} className={`shot-type-tab ${shotType === type ? 'active' : ''}`} onClick={() => setShotType(type)}>
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        {shotType !== 'ft' && <CourtZones selected={zone} onSelect={setZone} />}

        <div className="shot-buttons">
          <button className="shot-btn made" onClick={() => recordShot(1)}>MADE</button>
          <button className="shot-btn missed" onClick={() => recordShot(0)}>MISSED</button>
        </div>

        {log.length > 0 && (
          <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
            <button className="btn btn-outline" onClick={undoLast}>Undo Last</button>
          </div>
        )}
      </div>

      <div className="card-grid">
        <div className="card"><div className="stat-label">FG%</div><div className="stat-value">{fgPct}</div></div>
        <div className="card"><div className="stat-label">2PT</div><div className="stat-value" style={{ fontSize: '1.5rem' }}>{s2.made}/{s2.total}</div><div className="stat-label">{s2.pct}</div></div>
        <div className="card"><div className="stat-label">3PT</div><div className="stat-value" style={{ fontSize: '1.5rem' }}>{s3.made}/{s3.total}</div><div className="stat-label">{s3.pct}</div></div>
        <div className="card"><div className="stat-label">FT</div><div className="stat-value" style={{ fontSize: '1.5rem' }}>{sft.made}/{sft.total}</div><div className="stat-label">{sft.pct}</div></div>
      </div>

      {Object.keys(zoneMap).length > 0 && (
        <div className="card">
          <h2>Zone Stats (This Session)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem' }}>
            {Object.entries(zoneMap).map(([z, v]) => {
              const p = (v.made / v.total * 100).toFixed(1);
              return (
                <div key={z} style={{ textAlign: 'center', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ZONES[z] || z}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: p >= 50 ? 'var(--success)' : p >= 35 ? 'var(--primary)' : 'var(--danger)' }}>{p}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v.made}/{v.total}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {log.length > 0 && (
        <div className="card">
          <h2>Shot Log ({log.length} shots)</h2>
          <div className="shot-log">
            {log.map(s => (
              <div key={s.id} className="shot-log-item">
                <span>{s.shot_type.toUpperCase()}{s.zone ? ` / ${ZONES[s.zone] || s.zone}` : ''}</span>
                {s.playerName && <span style={{ color: 'var(--text-secondary)' }}>{s.playerName}</span>}
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
