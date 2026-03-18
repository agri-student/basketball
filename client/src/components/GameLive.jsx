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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [undoing, setUndoing] = useState(false);

  const load = useCallback(() => {
    setError(null);
    Promise.all([
      fetch(`/api/games/${id}`).then(r => { if (!r.ok) throw new Error('Game not found'); return r.json(); }),
      fetch('/api/players').then(r => { if (!r.ok) throw new Error('Failed to load players'); return r.json(); }),
    ]).then(([data, playerData]) => {
      setGame(data);
      setShots(data.shots || []);
      setPlayers(playerData);
      if (playerData.length > 0 && !playerId) setPlayerId(String(playerData[0].id));
    }).catch(err => {
      console.error(err);
      setError('Failed to load game data.');
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="spinner" role="status" aria-label="Loading live recorder" />;

  if (error && !game) {
    return (
      <div className="error-banner" role="alert">
        <span>{error}</span>
        <button onClick={load}>Retry</button>
      </div>
    );
  }

  if (!game) return null;

  const recordShot = async (made) => {
    if (recording) return;
    setRecording(true);
    setError(null);
    try {
      const body = {
        game_id: Number(id), shot_type: shotType, made,
        zone: shotType === 'ft' ? null : zone,
        player_id: playerId ? Number(playerId) : null,
        quarter: Number(quarter),
      };
      const res = await fetch('/api/shots', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to record shot');
      }
      const data = await res.json();
      const player = players.find(p => p.id === Number(playerId));
      setLog(prev => [{ id: data.id, ...body, playerName: player?.name, time: new Date().toLocaleTimeString() }, ...prev]);
      load();
      setZone(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setRecording(false);
    }
  };

  const undoLast = async () => {
    if (!log.length || undoing) return;
    setUndoing(true);
    try {
      const res = await fetch(`/api/shots/${log[0].id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to undo');
      setLog(prev => prev.slice(1));
      load();
    } catch (err) {
      console.error(err);
      setError('Failed to undo last shot.');
    } finally {
      setUndoing(false);
    }
  };

  // Build score sheet
  const quarters = [1, 2, 3, 4];
  const playerStats = {};
  for (const p of players) {
    playerStats[p.id] = { name: p.name, number: p.number, quarters: {}, total: { pts: 0, fg: '0/0', t3: '0/0', ft: '0/0' } };
    for (const q of quarters) {
      const qs = shots.filter(s => s.player_id === p.id && s.quarter === q);
      const fg2 = qs.filter(s => s.shot_type === '2pt');
      const t3 = qs.filter(s => s.shot_type === '3pt');
      const ft = qs.filter(s => s.shot_type === 'ft');
      playerStats[p.id].quarters[q] = fg2.filter(s => s.made).length * 2 + t3.filter(s => s.made).length * 3 + ft.filter(s => s.made).length;
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
      <Link to={`/games/${id}`} style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>Back to Game</Link>
      <h1>{game.date} vs {game.opponent} - Live</h1>

      {error && (
        <div className="error-banner" role="alert"><span>{error}</span></div>
      )}

      <div className="card">
        <h2>Score Sheet</h2>
        <div className="table-scroll">
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
              <label htmlFor="live-player">Player</label>
              <select id="live-player" value={playerId} onChange={e => setPlayerId(e.target.value)}>
                {players.map(p => <option key={p.id} value={p.id}>#{p.number} {p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="live-quarter">Quarter</label>
              <select id="live-quarter" value={quarter} onChange={e => setQuarter(e.target.value)}>
                {quarters.map(q => <option key={q} value={q}>Q{q}</option>)}
              </select>
            </div>
          </div>

          <div className="shot-type-tabs" role="tablist" aria-label="Shot type">
            {['2pt', '3pt', 'ft'].map(t => (
              <button key={t} role="tab" aria-selected={shotType === t} className={`shot-type-tab ${shotType === t ? 'active' : ''}`} onClick={() => setShotType(t)}>
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {shotType !== 'ft' && <CourtZones selected={zone} onSelect={setZone} />}

          <div className="shot-buttons">
            <button className="shot-btn made" onClick={() => recordShot(1)} disabled={recording} aria-label="Shot made">
              {recording ? '...' : 'MADE'}
            </button>
            <button className="shot-btn missed" onClick={() => recordShot(0)} disabled={recording} aria-label="Shot missed">
              {recording ? '...' : 'MISSED'}
            </button>
          </div>

          {log.length > 0 && (
            <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
              <button className="btn btn-outline" onClick={undoLast} disabled={undoing}>
                {undoing ? 'Undoing...' : 'Undo Last'}
              </button>
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
