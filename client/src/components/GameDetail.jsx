import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ZoneStats from './ZoneStats';

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [zoneStats, setZoneStats] = useState([]);

  useEffect(() => {
    fetch(`/api/games/${id}`).then(r => r.json()).then(setGame);
    fetch(`/api/stats/zones?game_id=${id}`).then(r => r.json()).then(setZoneStats);
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this game?')) return;
    await fetch(`/api/games/${id}`, { method: 'DELETE' });
    navigate('/games');
  };

  if (!game) return <p>Loading...</p>;

  const result = game.my_score > game.opponent_score ? 'W' : game.my_score < game.opponent_score ? 'L' : '-';

  const shotSummary = (type) => {
    const shots = (game.shots || []).filter(s => s.shot_type === type);
    if (shots.length === 0) return '-';
    const made = shots.filter(s => s.made).length;
    return `${made}/${shots.length} (${(made / shots.length * 100).toFixed(1)}%)`;
  };

  const hasQuarters = game.quarter1 || game.quarter2 || game.quarter3 || game.quarter4;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{game.date} vs {game.opponent}</h1>
        <span className={result === 'W' ? 'win' : result === 'L' ? 'lose' : ''} style={{ fontSize: '1.5rem' }}>
          {result} {game.my_score}-{game.opponent_score}
        </span>
      </div>

      {hasQuarters && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h2>Quarter Scores</h2>
          <table>
            <thead>
              <tr><th></th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th style={{ background: '#fff3e0', fontWeight: 700 }}>Total</th></tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>{game.opponent || 'My Team'}</td>
                <td>{game.quarter1}</td><td>{game.quarter2}</td><td>{game.quarter3}</td><td>{game.quarter4}</td>
                <td style={{ background: '#fff3e0', fontWeight: 700 }}>{game.quarter1 + game.quarter2 + game.quarter3 + game.quarter4}</td>
              </tr>
            </tbody>
          </table>
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
        <Link to={`/games/${id}/live`} className="btn btn-primary" style={{ background: '#1565c0' }}>Live Record</Link>
        <Link to={`/games/${id}/edit`} className="btn btn-primary">Edit</Link>
        <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
        <Link to="/games" className="btn btn-outline">Back</Link>
      </div>
    </>
  );
}
