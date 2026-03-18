import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ZoneStats from './ZoneStats';

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [zoneStats, setZoneStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`/api/games/${id}`).then(r => { if (!r.ok) throw new Error('Game not found'); return r.json(); }),
      fetch(`/api/stats/zones?game_id=${id}`).then(r => r.ok ? r.json() : []),
    ]).then(([gameData, zones]) => {
      setGame(gameData);
      setZoneStats(zones);
    }).catch(err => {
      console.error(err);
      setError('Failed to load game details.');
    }).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this game?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/games/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      navigate('/games');
    } catch (err) {
      console.error(err);
      setError('Failed to delete game.');
      setDeleting(false);
    }
  };

  if (loading) return <div className="spinner" role="status" aria-label="Loading game details" />;

  if (error && !game) {
    return (
      <div className="error-banner" role="alert">
        <span>{error}</span>
        <button onClick={() => navigate('/games')}>Back to Games</button>
      </div>
    );
  }

  if (!game) return null;

  const result = game.my_score > game.opponent_score ? 'WIN' : game.my_score < game.opponent_score ? 'LOSS' : 'DRAW';
  const resultClass = game.my_score > game.opponent_score ? 'win' : game.my_score < game.opponent_score ? 'lose' : '';

  const shotSummary = (type) => {
    const shots = (game.shots || []).filter(s => s.shot_type === type);
    if (shots.length === 0) return '-';
    const made = shots.filter(s => s.made).length;
    return `${made}/${shots.length} (${(made / shots.length * 100).toFixed(1)}%)`;
  };

  const hasQuarters = game.quarter1 || game.quarter2 || game.quarter3 || game.quarter4;

  return (
    <>
      {error && (
        <div className="error-banner" role="alert"><span>{error}</span></div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>{game.date} vs {game.opponent}</h1>
        <span className={resultClass} style={{ fontSize: '1.5rem' }} role="status" aria-label={`Result: ${result}`}>
          {result} {game.my_score}-{game.opponent_score}
        </span>
      </div>

      {hasQuarters && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h2>Quarter Scores</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th></th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th style={{ background: '#fff3e0', fontWeight: 700 }}>Total</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>My Team</td>
                  <td>{game.quarter1}</td><td>{game.quarter2}</td><td>{game.quarter3}</td><td>{game.quarter4}</td>
                  <td style={{ background: '#fff3e0', fontWeight: 700 }}>{game.quarter1 + game.quarter2 + game.quarter3 + game.quarter4}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2>Player Stats</h2>
        <div className="card-grid">
          {[
            ['Points', game.points], ['Rebounds', game.rebounds], ['Assists', game.assists],
            ['Steals', game.steals], ['Blocks', game.blocks], ['Turnovers', game.turnovers],
            ['Fouls', game.fouls], ['Minutes', game.minutes_played],
          ].map(([label, val]) => (
            <div key={label}>
              <div className="stat-label">{label}</div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{val ?? '-'}</div>
            </div>
          ))}
        </div>
      </div>

      {game.shots && game.shots.length > 0 && (
        <div className="card">
          <h2>Shooting</h2>
          <div className="card-grid">
            <div><div className="stat-label">2PT</div><div style={{ fontWeight: 600 }}>{shotSummary('2pt')}</div></div>
            <div><div className="stat-label">3PT</div><div style={{ fontWeight: 600 }}>{shotSummary('3pt')}</div></div>
            <div><div className="stat-label">FT</div><div style={{ fontWeight: 600 }}>{shotSummary('ft')}</div></div>
          </div>
        </div>
      )}

      <ZoneStats zones={zoneStats} />

      {game.notes && (
        <div className="card"><h2>Notes</h2><p>{game.notes}</p></div>
      )}

      <div className="actions">
        <Link to={`/games/${id}/live`} className="btn btn-info">Live Record</Link>
        <Link to={`/games/${id}/edit`} className="btn btn-primary">Edit</Link>
        <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
        <Link to="/games" className="btn btn-outline">Back</Link>
      </div>
    </>
  );
}
