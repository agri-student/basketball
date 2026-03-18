import { ZONES } from './CourtZones';

function pctColor(v) {
  if (v >= 50) return 'var(--success)';
  if (v >= 35) return 'var(--primary)';
  return 'var(--danger)';
}

export default function ZoneStats({ zones }) {
  if (!zones || zones.length === 0) return null;

  return (
    <div className="card">
      <h2>Zone Shooting</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem' }}>
        {zones.map(z => (
          <div key={z.zone} style={{ textAlign: 'center', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ZONES[z.zone] || z.zone}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: pctColor(z.percentage) }}>{z.percentage}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{z.made}/{z.total}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
