const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/players
router.get('/', (req, res) => {
  try {
    const players = db.prepare('SELECT * FROM players ORDER BY number ASC').all();
    res.json(players);
  } catch (err) {
    console.error('GET /api/players error:', err);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// GET /api/players/:id
router.get('/:id', (req, res) => {
  try {
    const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (err) {
    console.error('GET /api/players/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// POST /api/players
router.post('/', (req, res) => {
  try {
    const { name, number } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    const num = Number(number) || 0;
    if (num < 0 || num > 99) return res.status(400).json({ error: 'Number must be between 0 and 99' });

    const result = db.prepare('INSERT INTO players (name, number) VALUES (?, ?)').run(name.trim(), num);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('POST /api/players error:', err);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

// PUT /api/players/:id
router.put('/:id', (req, res) => {
  try {
    const { name, number } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    const num = Number(number) || 0;
    if (num < 0 || num > 99) return res.status(400).json({ error: 'Number must be between 0 and 99' });

    const result = db.prepare('UPDATE players SET name = ?, number = ? WHERE id = ?').run(name.trim(), num, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Player not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/players/:id error:', err);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// DELETE /api/players/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM players WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Player not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/players/:id error:', err);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

module.exports = router;
