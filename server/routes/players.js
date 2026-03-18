const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/players
router.get('/', (req, res) => {
  const players = db.prepare('SELECT * FROM players ORDER BY number ASC').all();
  res.json(players);
});

// GET /api/players/:id
router.get('/:id', (req, res) => {
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  res.json(player);
});

// POST /api/players
router.post('/', (req, res) => {
  const { name, number } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const result = db.prepare('INSERT INTO players (name, number) VALUES (?, ?)').run(name, number || 0);
  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/players/:id
router.put('/:id', (req, res) => {
  const { name, number } = req.body;
  const result = db.prepare('UPDATE players SET name = ?, number = ? WHERE id = ?').run(name, number || 0, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Player not found' });
  res.json({ success: true });
});

// DELETE /api/players/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM players WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Player not found' });
  res.json({ success: true });
});

module.exports = router;
