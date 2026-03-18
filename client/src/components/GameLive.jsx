import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import CourtZones from './CourtZones';
import { ZONES } from './CourtZones';

export default function GameLive() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [shots, setShots] = useState([]);
  const [shotType, setShotType] = useState('2pt');
  const [zone, setZone] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [quarter, setQuarter] = useState('1');
  const [log, setLog] = useState([]);

  const load = useCallback(() => {
    fetch(`/api/games/${id}`).then(r => r.json()).then(data => {
      setGame(data);
      setShots(data.shots || []);
    });
    fetch('/api/players').then(r => r.json()).then(data => {
      setPlayers(data);
      if (data.length > 0 && !playerId) setPlayerId(String(data[0].id));
    });
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!game) return <div className="empty-state">Loading...</div>;

  const recordShot = async (made) => {
    const body = {
      game_id: Number(id), shot_type: shotType, made,
      zone: shotType === 'ft' ? null : zone,
      player_id: playerId ? Number(playerId) : null,
      quarter: Number(quarter),
    };
    const res = await fetch('/api/shots', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      const player = players.find(p => p.id === Number(playerId));
      setLog(prev => [{ id: data.id, ...body, playerName: player?.name, time: new Date().toLocaleTimeString() }, ...prev]);
      load();
      setZone(null);
    }
  };

  const undoLast = async () => {
    if (!log.length) return;
    await fetch(`/api/shots/${log[0].id}`, { method: 'DELETE' });
    setLog(prev => prev.slice(1));
    load();
  };

  // Build score sheet
  const quarters = [1, 2, 3, 4];
  const playerStats = {};
  for (const p of players) {
    playerStats[p.id] = { name: p.name, number: p.number, quarters: {}, total: { pts: 0, fg: [0, 0], t3: [0, 0], ft: [0, 0] } };
    for (const q of quarters) {
      const qs = shots.filter(s => s.player_id === p.id && s.quarter === q);
      const fg2 = qs.filter(s => s.shot_type === '2pt');
      const t3 = qs.filter(s => s.shot_type === '3pt');
      const ft = qs.filter(s => s.shot_type === 'ft');
      const pts = fg2.filter(s => s.made).length * 2 + t3.filter(s => s.made).length * 3 + ft.filter(s => s.made).length;
      playerStats[p.id].quarters[q] = pts;
    }
    const allPs = shots.filter(s => s.player_id === p.id);
    const fg = allPs.filter(s => s.shot_type !== 'ft');
    const t3 = allPs.filter(s => s.shot_type === '3pt');
    const ft = allPs.filter(s => s.shot_type === 'ft');
    playerStats[p.id].total = {
      pts: fg.filter(s => s.made && s.shot_type === '2pt').length * 2 + t3.filter(s => s.made).length * 3 + ft.filter(s => s.made).length,
      fg: `${fg.filter(s => s.made).length}/${fg.length}`,
      t3: `${t3.filter(s => s.made).length}/${t3.length}`,
      ft: `${ft.filter(s => s.made).length}/${ft.length}`,
    };
  }
  const teamQ = quarters.map(q => players.reduce((a, p) => a + (playerStats[p.id]?.quarters[q] || 0), 0));
  const teamTotal = teamQ.reduce((a, b) => a + b, 0);

  return (
    <>
      <Link to={`/games/${id}`} style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>← Back to Game</Link>
      <h1>{game.date} vs {game.opponent} - Live</h1>

      <div className="card">
        <h2>Score Sheet</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: 500 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Player</th>
                {quarters.map(q => <th key={q}>Q{q}</th>)}
                <th style={{ background: '#fff3e0', fontWeight: 700 }}>Total</th>
                <th>FG</th><th>3P</th><th>FT</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => {
                const ps = playerStats[p.id];
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>#{ps.number} {ps.name}</td>
                    {quarters.map(q => <td key={q} style={{ textAlign: 'center' }}>{ps.quarters[q] || 0}</td>)}
                    <td style={{ textAlign: 'center', background: '#fff3e0', fontWeight: 700 }}>{ps.total.pts}</td>
                    <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>{ps.total.fg}</td>
                    <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>{ps.total.t3}</td>
                    <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>{ps.total.ft}</td>
                  </tr>
                );
              })}
              <tr style={{ fontWeight: 700, background: '#f5f5f5' }}>
                <td>Team</td>
                {teamQ.map((t, i) => <td key={i} style={{ textAlign: 'center' }}>{t}</td>)}
                <td style={{ textAlign: 'center', background: '#fff3e0' }}>{teamTotal}</td>
                <td /><td /><td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {players.length > 0 ? (
        <div className="card">
          <h2>Record Shot</h2>
          <div className="form-row" style={{ marginBottom: '0.75rem' }}>
            <div className="form-group">
              <label>Player</label>
              <select value={playerId} onChange={e => setPlayerId(e.target.value)}>
                {players.map(p => <option key={p.id} value={p.id}>#{p.number} {p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Quarter</label>
              <select value={quarter} onChange={e => setQuarter(e.target.value)}>
                {quarters.map(q => <option key={q} value={q}>Q{q}</option>)}
              </select>
            </div>
          </div>

          <div className="shot-type-tabs">
            {['2pt', '3pt', 'ft'].map(t => (
              <button key={t} className={`shot-type-tab ${shotType === t ? 'active' : ''}`} onClick={() => setShotType(t)}>
                {t.toUpperCase()}
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
      ) : (
        <div className="card empty-state">
          No players registered. <Link to="/players">Add players first</Link>
        </div>
      )}

      {log.length > 0 && (
        <div className="card">
          <h2>Log ({log.length})</h2>
          <div className="shot-log">
            {log.map(s => (
              <div key={s.id} className="shot-log-item">
                <span>{s.shot_type.toUpperCase()}{s.zone ? ` / ${ZONES[s.zone] || s.zone}` : ''}</span>
                {s.playerName && <span style={{ color: 'var(--text-secondary)' }}>{s.playerName}</span>}
                <span>Q{s.quarter}</span>
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
