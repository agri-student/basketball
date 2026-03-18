import { useState, useEffect } from 'react';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', number: '' });

  const load = () => fetch('/api/players').then(r => r.json()).then(setPlayers);
  useEffect(() => { load(); }, []);

  const startEdit = (p) => {
    setEditing(p ? p.id : 'new');
    setForm(p ? { name: p.name, number: p.number } : { name: '', number: '' });
  };

  const save = async () => {
    if (!form.name.trim()) return;
    const body = { name: form.name.trim(), number: Number(form.number) || 0 };
    if (editing === 'new') {
      await fetch('/api/players', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch(`/api/players/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setEditing(null);
    load();
  };

  const remove = async (id) => {
    if (!confirm('この選手を削除しますか？')) return;
    await fetch(`/api/players/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Players</h1>
        <button className="btn btn-primary" onClick={() => startEdit(null)}>+ Add Player</button>
      </div>

      {editing !== null && (
        <div className="card">
          <h2>{editing === 'new' ? 'Add Player' : 'Edit Player'}</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Number</label>
              <input type="number" min="0" max="99" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={save}>Save</button>
            <button className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      {players.length > 0 ? (
        <div className="card">
          {players.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ background: 'var(--primary)', color: '#fff', width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                {p.number}
              </span>
              <span style={{ fontWeight: 600, flex: 1 }}>{p.name}</span>
              <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => startEdit(p)}>Edit</button>
              <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => remove(p.id)}>Delete</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">No players registered yet.</div>
      )}
    </>
  );
}
