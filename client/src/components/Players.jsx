import { useState, useEffect } from 'react';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', number: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    fetch('/api/players')
      .then(r => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
      .then(setPlayers)
      .catch(err => { console.error(err); setError('Failed to load players.'); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const startEdit = (p) => {
    setEditing(p ? p.id : 'new');
    setForm(p ? { name: p.name, number: p.number } : { name: '', number: '' });
  };

  const save = async () => {
    if (!form.name.trim()) { setError('Player name is required.'); return; }
    const num = Number(form.number) || 0;
    if (num < 0 || num > 99) { setError('Number must be between 0 and 99.'); return; }

    setSaving(true);
    setError(null);
    try {
      const body = { name: form.name.trim(), number: num };
      let res;
      if (editing === 'new') {
        res = await fetch('/api/players', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        res = await fetch(`/api/players/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save player');
      }
      setEditing(null);
      load();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this player?')) return;
    try {
      const res = await fetch(`/api/players/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      load();
    } catch (err) {
      console.error(err);
      setError('Failed to delete player.');
    }
  };

  if (loading) return <div className="spinner" role="status" aria-label="Loading players" />;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Players</h1>
        <button className="btn btn-primary" onClick={() => startEdit(null)}>+ Add Player</button>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {editing !== null && (
        <div className="card" role="form" aria-label={editing === 'new' ? 'Add player' : 'Edit player'}>
          <h2>{editing === 'new' ? 'Add Player' : 'Edit Player'}</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="player-number">Number</label>
              <input id="player-number" type="number" min="0" max="99" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="player-name">Name</label>
              <input id="player-name" type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      {players.length > 0 ? (
        <div className="card">
          {players.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ background: 'var(--primary)', color: '#fff', width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }} aria-label={`Number ${p.number}`}>
                {p.number}
              </span>
              <span style={{ fontWeight: 600, flex: 1 }}>{p.name}</span>
              <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => startEdit(p)} aria-label={`Edit ${p.name}`}>Edit</button>
              <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => remove(p.id)} aria-label={`Delete ${p.name}`}>Delete</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">No players registered yet.</div>
      )}
    </>
  );
}
