import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const defaultForm = {
  date: new Date().toISOString().split('T')[0],
  opponent: '',
  my_score: '',
  opponent_score: '',
  minutes_played: '',
  notes: '',
  quarters: ['', '', '', ''],
  stats: { points: '', rebounds: '', assists: '', steals: '', blocks: '', turnovers: '', fouls: '' },
};

export default function GameForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      fetch(`/api/games/${id}`)
        .then(r => { if (!r.ok) throw new Error('Game not found'); return r.json(); })
        .then(data => {
          setForm({
            date: data.date,
            opponent: data.opponent,
            my_score: data.my_score,
            opponent_score: data.opponent_score,
            minutes_played: data.minutes_played,
            notes: data.notes,
            quarters: [data.quarter1 || '', data.quarter2 || '', data.quarter3 || '', data.quarter4 || ''],
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
        })
        .catch(err => { console.error(err); setError('Failed to load game.'); })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const updateStat = (field, value) => setForm(f => ({ ...f, stats: { ...f.stats, [field]: value } }));
  const updateQuarter = (i, value) => setForm(f => {
    const q = [...f.quarters]; q[i] = value; return { ...f, quarters: q };
  });

  const validate = () => {
    const errs = {};
    if (!form.date) errs.date = 'Date is required';
    if (form.my_score !== '' && Number(form.my_score) < 0) errs.my_score = 'Cannot be negative';
    if (form.opponent_score !== '' && Number(form.opponent_score) < 0) errs.opponent_score = 'Cannot be negative';
    if (form.minutes_played !== '' && Number(form.minutes_played) < 0) errs.minutes_played = 'Cannot be negative';
    form.quarters.forEach((q, i) => {
      if (q !== '' && Number(q) < 0) errs[`q${i}`] = 'Cannot be negative';
    });
    for (const [key, val] of Object.entries(form.stats)) {
      if (val !== '' && Number(val) < 0) errs[`stat_${key}`] = 'Cannot be negative';
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Quarter sum warning
  const quarterSum = form.quarters.reduce((a, q) => a + (Number(q) || 0), 0);
  const myScore = Number(form.my_score) || 0;
  const showQuarterWarning = form.quarters.some(q => q) && form.my_score !== '' && quarterSum > 0 && myScore > 0 && quarterSum !== myScore;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError(null);

    try {
      const body = {
        ...form,
        my_score: Number(form.my_score) || 0,
        opponent_score: Number(form.opponent_score) || 0,
        minutes_played: Number(form.minutes_played) || 0,
        quarters: form.quarters.map(q => Number(q) || 0),
        stats: Object.fromEntries(Object.entries(form.stats).map(([k, v]) => [k, Number(v) || 0])),
      };

      const url = isEdit ? `/api/games/${id}` : '/api/games';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save game');
      }

      const data = await res.json();
      navigate(isEdit ? `/games/${id}` : `/games/${data.id}`);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="spinner" role="status" aria-label="Loading game" />;

  return (
    <>
      <h1>{isEdit ? 'Edit Game' : 'New Game'}</h1>

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
        </div>
      )}

      <form className="card" onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="game-date">Date</label>
            <input id="game-date" type="date" value={form.date} onChange={e => update('date', e.target.value)} required aria-invalid={!!validationErrors.date} />
            {validationErrors.date && <div className="field-error">{validationErrors.date}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="game-opponent">Opponent</label>
            <input id="game-opponent" type="text" value={form.opponent} onChange={e => update('opponent', e.target.value)} placeholder="Team name" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="game-my-score">My Score</label>
            <input id="game-my-score" type="number" min="0" value={form.my_score} onChange={e => update('my_score', e.target.value)} aria-invalid={!!validationErrors.my_score} />
            {validationErrors.my_score && <div className="field-error">{validationErrors.my_score}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="game-opp-score">Opponent Score</label>
            <input id="game-opp-score" type="number" min="0" value={form.opponent_score} onChange={e => update('opponent_score', e.target.value)} aria-invalid={!!validationErrors.opponent_score} />
            {validationErrors.opponent_score && <div className="field-error">{validationErrors.opponent_score}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="game-minutes">Minutes Played</label>
            <input id="game-minutes" type="number" min="0" value={form.minutes_played} onChange={e => update('minutes_played', e.target.value)} />
          </div>
        </div>

        <h2>Quarter Scores (My Team)</h2>
        <div className="form-row">
          {[0, 1, 2, 3].map(i => (
            <div className="form-group" key={i}>
              <label htmlFor={`q-${i}`}>Q{i + 1}</label>
              <input id={`q-${i}`} type="number" min="0" value={form.quarters[i]} onChange={e => updateQuarter(i, e.target.value)} aria-invalid={!!validationErrors[`q${i}`]} />
              {validationErrors[`q${i}`] && <div className="field-error">{validationErrors[`q${i}`]}</div>}
            </div>
          ))}
        </div>
        {form.quarters.some(q => q) && (
          <div style={{ fontSize: '0.85rem', color: showQuarterWarning ? 'var(--danger)' : 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Quarter Total: {quarterSum}
            {showQuarterWarning && ` (doesn't match My Score: ${myScore})`}
          </div>
        )}

        <h2>Player Stats</h2>
        <div className="form-row">
          {['points', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers', 'fouls'].map(stat => (
            <div className="form-group" key={stat}>
              <label htmlFor={`stat-${stat}`}>{stat.charAt(0).toUpperCase() + stat.slice(1)}</label>
              <input id={`stat-${stat}`} type="number" min="0" value={form.stats[stat]} onChange={e => updateStat(stat, e.target.value)} aria-invalid={!!validationErrors[`stat_${stat}`]} />
              {validationErrors[`stat_${stat}`] && <div className="field-error">{validationErrors[`stat_${stat}`]}</div>}
            </div>
          ))}
        </div>

        <div className="form-group">
          <label htmlFor="game-notes">Notes</label>
          <textarea id="game-notes" rows="3" value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Game notes..." />
        </div>

        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : (isEdit ? 'Update' : 'Save')} Game
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </>
  );
}
