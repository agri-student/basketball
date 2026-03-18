const express = require('express');
const router = express.Router();
const db = require('../db');

const VALID_ZONES = ['paint', 'mid_left', 'mid_right', 'mid_top', 'three_left', 'three_right', 'three_top'];

// POST /api/shots - シュート記録追加
router.post('/', (req, res) => {
  try {
    const { game_id, shot_type, made, zone, player_id, quarter } = req.body;

    if (!['2pt', '3pt', 'ft'].includes(shot_type)) {
      return res.status(400).json({ error: 'Invalid shot_type. Must be 2pt, 3pt, or ft' });
    }
    if (made !== 0 && made !== 1) {
      return res.status(400).json({ error: 'made must be 0 or 1' });
    }
    if (zone && !VALID_ZONES.includes(zone)) {
      return res.status(400).json({ error: `Invalid zone. Must be one of: ${VALID_ZONES.join(', ')}` });
    }
    if (quarter != null && (quarter < 1 || quarter > 4)) {
      return res.status(400).json({ error: 'quarter must be between 1 and 4' });
    }

    const result = db.prepare(
      'INSERT INTO shots (game_id, shot_type, made, zone, player_id, quarter) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(game_id || null, shot_type, made, zone || null, player_id || null, quarter || null);

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('POST /api/shots error:', err);
    res.status(500).json({ error: 'Failed to record shot' });
  }
});

// POST /api/shots/bulk - シュート一括記録
router.post('/bulk', (req, res) => {
  try {
    const { shots } = req.body;
    if (!Array.isArray(shots)) {
      return res.status(400).json({ error: 'shots must be an array' });
    }
    if (shots.length > 500) {
      return res.status(400).json({ error: 'Maximum 500 shots per bulk request' });
    }

    const insert = db.prepare(
      'INSERT INTO shots (game_id, shot_type, made, zone, player_id, quarter) VALUES (?, ?, ?, ?, ?, ?)'
    );

    const transaction = db.transaction(() => {
      const ids = [];
      for (const shot of shots) {
        const result = insert.run(shot.game_id || null, shot.shot_type, shot.made, shot.zone || null, shot.player_id || null, shot.quarter || null);
        ids.push(result.lastInsertRowid);
      }
      return ids;
    });

    const ids = transaction();
    res.status(201).json({ ids });
  } catch (err) {
    console.error('POST /api/shots/bulk error:', err);
    res.status(500).json({ error: 'Failed to bulk record shots' });
  }
});

// GET /api/shots - シュート一覧（game_idでフィルタ可）
router.get('/', (req, res) => {
  try {
    const { game_id } = req.query;

    let shots;
    if (game_id) {
      shots = db.prepare('SELECT * FROM shots WHERE game_id = ? ORDER BY created_at DESC').all(game_id);
    } else {
      shots = db.prepare('SELECT * FROM shots ORDER BY created_at DESC').all();
    }

    res.json(shots);
  } catch (err) {
    console.error('GET /api/shots error:', err);
    res.status(500).json({ error: 'Failed to fetch shots' });
  }
});

// DELETE /api/shots/:id - シュート削除
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM shots WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Shot not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/shots/:id error:', err);
    res.status(500).json({ error: 'Failed to delete shot' });
  }
});

module.exports = router;
