import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const defaultForm = {
  date: new Date().toISOString().split('T')[0],
  opponent: '',
  my_score: '',
  opponent_score: '',
  minutes_played: '',
  notes: '',
  stats: { points: '', rebounds: '', assists: '', steals: '', blocks: '', turnovers: '', fouls: '' },
};

export default function GameForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      fetch(`/api/games/${id}`).then(r => r.json()).then(data => {
        setForm({
          date: data.date,
          opponent: data.opponent,
          my_score: data.my_score,
          opponent_score: data.opponent_score,
          minutes_played: data.minutes_played,
          notes: data.notes,
          stats: {
            points: data.points ?? '',
            rebounds: data.rebounds ?? '',
            assists: data.assists ?? '',
            steals: data.steals ?? '',
            blocks: data.blocks ?? '',
            turnovers: data.turnovers ?? '',
            fouls: data.fouls ?? '',
          },
        });
      });
    }
  }, [id, isEdit]);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const updateStat = (field, value) => setForm(f => ({ ...f, stats: { ...f.stats, [field]: value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = {
      ...form,
      my_score: Number(form.my_score) || 0,
      opponent_score: Number(form.opponent_score) || 0,
      minutes_played: Number(form.minutes_played) || 0,
      stats: Object.fromEntries(Object.entries(form.stats).map(([k, v]) => [k, Number(v) || 0])),
    };

    const url = isEdit ? `/api/games/${id}` : '/api/games';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      navigate(isEdit ? `/games/${id}` : `/games/${data.id}`);
    }
  };

  return (
    <>
      <h1>{isEdit ? 'Edit Game' : 'New Game'}</h1>
      <form className="card" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={form.date} onChange={e => update('date', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Opponent</label>
            <input type="text" value={form.opponent} onChange={e => update('opponent', e.target.value)} placeholder="Team name" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>My Score</label>
            <input type="number" min="0" value={form.my_score} onChange={e => update('my_score', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Opponent Score</label>
            <input type="number" min="0" value={form.opponent_score} onChange={e => update('opponent_score', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Minutes Played</label>
            <input type="number" min="0" value={form.minutes_played} onChange={e => update('minutes_played', e.target.value)} />
          </div>
        </div>

        <h2>Player Stats</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Points</label>
            <input type="number" min="0" value={form.stats.points} onChange={e => updateStat('points', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Rebounds</label>
            <input type="number" min="0" value={form.stats.rebounds} onChange={e => updateStat('rebounds', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Assists</label>
            <input type="number" min="0" value={form.stats.assists} onChange={e => updateStat('assists', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Steals</label>
            <input type="number" min="0" value={form.stats.steals} onChange={e => updateStat('steals', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Blocks</label>
            <input type="number" min="0" value={form.stats.blocks} onChange={e => updateStat('blocks', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Turnovers</label>
            <input type="number" min="0" value={form.stats.turnovers} onChange={e => updateStat('turnovers', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Fouls</label>
            <input type="number" min="0" value={form.stats.fouls} onChange={e => updateStat('fouls', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea rows="3" value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Game notes..." />
        </div>

        <div className="actions">
          <button type="submit" className="btn btn-primary">{isEdit ? 'Update' : 'Save'} Game</button>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </>
  );
}
