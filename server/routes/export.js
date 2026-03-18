const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/export/json - 全データJSON出力
router.get('/json', (req, res) => {
  try {
    const games = db.prepare(`
      SELECT g.*, ps.points, ps.rebounds, ps.assists, ps.steals, ps.blocks, ps.turnovers, ps.fouls
      FROM games g
      LEFT JOIN player_stats ps ON ps.game_id = g.id
      ORDER BY g.date DESC
    `).all();
    const players = db.prepare('SELECT * FROM players ORDER BY number ASC').all();
    const shots = db.prepare('SELECT * FROM shots ORDER BY created_at DESC').all();

    res.json({ games, players, shots, exported_at: new Date().toISOString() });
  } catch (err) {
    console.error('GET /api/export/json error:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// GET /api/export/csv - 試合データCSV出力
router.get('/csv', (req, res) => {
  try {
    const games = db.prepare(`
      SELECT g.date, g.opponent, g.my_score, g.opponent_score, g.minutes_played,
             g.quarter1, g.quarter2, g.quarter3, g.quarter4,
             ps.points, ps.rebounds, ps.assists, ps.steals, ps.blocks, ps.turnovers, ps.fouls,
             g.notes
      FROM games g
      LEFT JOIN player_stats ps ON ps.game_id = g.id
      ORDER BY g.date DESC
    `).all();

    const headers = ['Date', 'Opponent', 'MyScore', 'OppScore', 'Minutes', 'Q1', 'Q2', 'Q3', 'Q4', 'Points', 'Rebounds', 'Assists', 'Steals', 'Blocks', 'Turnovers', 'Fouls', 'Notes'];
    const rows = games.map(g => [
      g.date, `"${(g.opponent || '').replace(/"/g, '""')}"`, g.my_score, g.opponent_score, g.minutes_played,
      g.quarter1, g.quarter2, g.quarter3, g.quarter4,
      g.points ?? '', g.rebounds ?? '', g.assists ?? '', g.steals ?? '', g.blocks ?? '', g.turnovers ?? '', g.fouls ?? '',
      `"${(g.notes || '').replace(/"/g, '""')}"`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=basketball-stats.csv');
    res.send(csv);
  } catch (err) {
    console.error('GET /api/export/csv error:', err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

module.exports = router;
