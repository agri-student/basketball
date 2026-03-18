const express = require('express');
const router = express.Router();
const db = require('../db');

// Validation helper
function validateGameInput(body) {
  const errors = [];
  const { date, my_score, opponent_score, minutes_played, quarters, stats } = body;

  if (!date) errors.push('Date is required');
  if (my_score != null && Number(my_score) < 0) errors.push('My score cannot be negative');
  if (opponent_score != null && Number(opponent_score) < 0) errors.push('Opponent score cannot be negative');
  if (minutes_played != null && Number(minutes_played) < 0) errors.push('Minutes played cannot be negative');

  if (quarters && Array.isArray(quarters)) {
    for (let i = 0; i < quarters.length; i++) {
      if (Number(quarters[i]) < 0) errors.push(`Quarter ${i + 1} score cannot be negative`);
    }
  }

  if (stats) {
    for (const [key, val] of Object.entries(stats)) {
      if (Number(val) < 0) errors.push(`${key} cannot be negative`);
    }
  }

  // Warn if quarter sum doesn't match my_score (only if both are provided)
  let warnings = [];
  if (quarters && Array.isArray(quarters) && my_score != null) {
    const qSum = quarters.reduce((a, q) => a + (Number(q) || 0), 0);
    const score = Number(my_score) || 0;
    if (qSum > 0 && score > 0 && qSum !== score) {
      warnings.push(`Quarter total (${qSum}) doesn't match my_score (${score})`);
    }
  }

  return { errors, warnings };
}

// GET /api/games - 試合一覧
router.get('/', (req, res) => {
  try {
    const { from, to, opponent } = req.query;
    let query = `
      SELECT g.*, ps.points, ps.rebounds, ps.assists, ps.steals, ps.blocks, ps.turnovers, ps.fouls
      FROM games g
      LEFT JOIN player_stats ps ON ps.game_id = g.id
    `;
    const conditions = [];
    const params = [];

    if (from) { conditions.push('g.date >= ?'); params.push(from); }
    if (to) { conditions.push('g.date <= ?'); params.push(to); }
    if (opponent) { conditions.push('g.opponent LIKE ?'); params.push(`%${opponent}%`); }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY g.date DESC';

    const games = db.prepare(query).all(...params);
    res.json(games);
  } catch (err) {
    console.error('GET /api/games error:', err);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// GET /api/games/opponents - 対戦相手一覧と成績
router.get('/opponents', (req, res) => {
  try {
    const opponents = db.prepare(`
      SELECT
        opponent,
        COUNT(*) as games_played,
        SUM(CASE WHEN my_score > opponent_score THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN my_score < opponent_score THEN 1 ELSE 0 END) as losses,
        ROUND(AVG(my_score), 1) as avg_my_score,
        ROUND(AVG(opponent_score), 1) as avg_opponent_score,
        MAX(date) as last_played
      FROM games
      WHERE opponent != ''
      GROUP BY opponent
      ORDER BY games_played DESC
    `).all();
    res.json(opponents);
  } catch (err) {
    console.error('GET /api/games/opponents error:', err);
    res.status(500).json({ error: 'Failed to fetch opponents' });
  }
});

// GET /api/games/:id - 試合詳細
router.get('/:id', (req, res) => {
  try {
    const game = db.prepare(`
      SELECT g.*, ps.points, ps.rebounds, ps.assists, ps.steals, ps.blocks, ps.turnovers, ps.fouls
      FROM games g
      LEFT JOIN player_stats ps ON ps.game_id = g.id
      WHERE g.id = ?
    `).get(req.params.id);

    if (!game) return res.status(404).json({ error: 'Game not found' });

    const shots = db.prepare('SELECT * FROM shots WHERE game_id = ?').all(req.params.id);
    res.json({ ...game, shots });
  } catch (err) {
    console.error('GET /api/games/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// POST /api/games - 試合登録
router.post('/', (req, res) => {
  try {
    const { date, opponent, my_score, opponent_score, minutes_played, notes, stats, quarters } = req.body;
    const { errors } = validateGameInput(req.body);
    if (errors.length) return res.status(400).json({ error: errors.join(', ') });

    const insertGame = db.prepare(`
      INSERT INTO games (date, opponent, my_score, opponent_score, minutes_played, notes, quarter1, quarter2, quarter3, quarter4)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertStats = db.prepare(`
      INSERT INTO player_stats (game_id, points, rebounds, assists, steals, blocks, turnovers, fouls)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      const q = quarters || [0, 0, 0, 0];
      const result = insertGame.run(date, opponent || '', my_score || 0, opponent_score || 0, minutes_played || 0, notes || '', q[0] || 0, q[1] || 0, q[2] || 0, q[3] || 0);
      const gameId = result.lastInsertRowid;

      if (stats) {
        insertStats.run(gameId, stats.points || 0, stats.rebounds || 0, stats.assists || 0,
          stats.steals || 0, stats.blocks || 0, stats.turnovers || 0, stats.fouls || 0);
      }

      return gameId;
    });

    const gameId = transaction();
    res.status(201).json({ id: gameId });
  } catch (err) {
    console.error('POST /api/games error:', err);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// PUT /api/games/:id - 試合更新
router.put('/:id', (req, res) => {
  try {
    const { date, opponent, my_score, opponent_score, minutes_played, notes, stats, quarters } = req.body;
    const { id } = req.params;
    const { errors } = validateGameInput(req.body);
    if (errors.length) return res.status(400).json({ error: errors.join(', ') });

    const existing = db.prepare('SELECT id FROM games WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Game not found' });

    const transaction = db.transaction(() => {
      const q = quarters || [0, 0, 0, 0];
      db.prepare(`
        UPDATE games SET date = ?, opponent = ?, my_score = ?, opponent_score = ?, minutes_played = ?, notes = ?, quarter1 = ?, quarter2 = ?, quarter3 = ?, quarter4 = ?
        WHERE id = ?
      `).run(date, opponent || '', my_score || 0, opponent_score || 0, minutes_played || 0, notes || '', q[0] || 0, q[1] || 0, q[2] || 0, q[3] || 0, id);

      if (stats) {
        db.prepare('DELETE FROM player_stats WHERE game_id = ?').run(id);
        db.prepare(`
          INSERT INTO player_stats (game_id, points, rebounds, assists, steals, blocks, turnovers, fouls)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, stats.points || 0, stats.rebounds || 0, stats.assists || 0,
          stats.steals || 0, stats.blocks || 0, stats.turnovers || 0, stats.fouls || 0);
      }
    });

    transaction();
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/games/:id error:', err);
    res.status(500).json({ error: 'Failed to update game' });
  }
});

// DELETE /api/games/:id - 試合削除
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM games WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Game not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/games/:id error:', err);
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

module.exports = router;
