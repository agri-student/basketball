const ZONES = {
  paint: 'Paint', mid_left: 'Mid L', mid_right: 'Mid R',
  mid_top: 'Mid Top', three_left: '3PT L', three_right: '3PT R', three_top: '3PT Top'
};

export { ZONES };

export default function CourtZones({ selected, onSelect }) {
  const zoneStyle = (id) => ({
    fill: selected === id ? 'rgba(230,81,0,.3)' : 'rgba(200,200,200,.15)',
    stroke: selected === id ? '#e65100' : '#999',
    strokeWidth: selected === id ? 2.5 : 1.5,
    cursor: 'pointer',
    transition: 'all .15s',
  });

  const click = (id) => onSelect(selected === id ? null : id);

  return (
    <div style={{ maxWidth: 360, margin: '0 auto 0.75rem' }}>
      <svg viewBox="0 0 300 280" style={{ width: '100%', height: 'auto' }}>
        <rect x="10" y="10" width="280" height="260" fill="none" stroke="#666" strokeWidth="2" rx="3" />
        <circle cx="150" cy="35" r="5" fill="none" stroke="#333" strokeWidth="2" />
        <line x1="140" y1="28" x2="160" y2="28" stroke="#333" strokeWidth="2" />

        <rect style={zoneStyle('paint')} x="100" y="28" width="100" height="80" rx="2" onClick={() => click('paint')} />
        <text x="150" y="72" textAnchor="middle" fontSize="11" fill="#555" fontWeight="600" pointerEvents="none">Paint</text>

        <polygon style={zoneStyle('mid_left')} points="10,28 100,28 100,148 10,148" onClick={() => click('mid_left')} />
        <text x="55" y="92" textAnchor="middle" fontSize="11" fill="#555" fontWeight="600" pointerEvents="none">Mid L</text>

        <polygon style={zoneStyle('mid_right')} points="200,28 290,28 290,148 200,148" onClick={() => click('mid_right')} />
        <text x="245" y="92" textAnchor="middle" fontSize="11" fill="#555" fontWeight="600" pointerEvents="none">Mid R</text>

        <polygon style={zoneStyle('mid_top')} points="100,108 200,108 200,148 100,148" onClick={() => click('mid_top')} />
        <text x="150" y="133" textAnchor="middle" fontSize="11" fill="#555" fontWeight="600" pointerEvents="none">Mid Top</text>

        <polygon style={zoneStyle('three_left')} points="10,148 100,148 100,230 10,230" onClick={() => click('three_left')} />
        <text x="55" y="193" textAnchor="middle" fontSize="11" fill="#555" fontWeight="600" pointerEvents="none">3PT L</text>

        <polygon style={zoneStyle('three_right')} points="200,148 290,148 290,230 200,230" onClick={() => click('three_right')} />
        <text x="245" y="193" textAnchor="middle" fontSize="11" fill="#555" fontWeight="600" pointerEvents="none">3PT R</text>

        <polygon style={zoneStyle('three_top')} points="100,148 200,148 200,230 100,230" onClick={() => click('three_top')} />
        <text x="150" y="193" textAnchor="middle" fontSize="11" fill="#555" fontWeight="600" pointerEvents="none">3PT Top</text>

        <path d="M 40,28 L 40,160 Q 150,270 260,160 L 260,28" fill="none" stroke="#999" strokeWidth="1" strokeDasharray="4,3" />
        <line x1="100" y1="108" x2="200" y2="108" stroke="#999" strokeWidth="1" />
        <circle cx="150" cy="108" r="30" fill="none" stroke="#999" strokeWidth="1" strokeDasharray="4,3" />
      </svg>
    </div>
  );
}
