import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ExportData() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const exportJSON = async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await fetch('/api/export/json');
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `basketball-stats-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Failed to export JSON data.');
    } finally {
      setExporting(false);
    }
  };

  const exportCSV = async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await fetch('/api/export/csv');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `basketball-stats-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Failed to export CSV data.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Export Data</h1>
        <Link to="/" className="btn btn-outline">Back</Link>
      </div>

      {error && (
        <div className="error-banner" role="alert"><span>{error}</span></div>
      )}

      <div className="card">
        <h2>Export Format</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Download all your basketball stats data for backup or analysis in external tools.
        </p>
        <div className="actions">
          <button className="btn btn-primary" onClick={exportJSON} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Download JSON'}
          </button>
          <button className="btn btn-success" onClick={exportCSV} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Download CSV'}
          </button>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <p><strong>JSON</strong> — Full data export including games, players, and shots. Suitable for backup and re-import.</p>
          <p><strong>CSV</strong> — Game data in spreadsheet format. Open in Excel, Google Sheets, etc.</p>
        </div>
      </div>
    </>
  );
}
