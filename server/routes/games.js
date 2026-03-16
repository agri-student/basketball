const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/games - 試合一覧
router.get('/', (req, res) => {
  const games = db.prepare(`
    SELECT g.*, ps.points, ps.rebounds, ps.assists, ps.steals, ps.blocks, ps.turnovers, ps.fouls
    FROM games g
    LEFT JOIN player_stats ps ON ps.game_id = g.id
    ORDER BY g.date DESC
  `).all();
  res.json(games);
});

// GET /api/games/:id - 試合詳細
router.get('/:id', (req, res) => {
  const game = db.prepare(`
    SELECT g.*, ps.points, ps.rebounds, ps.assists, ps.steals, ps.blocks, ps.turnovers, ps.fouls
    FROM games g
    LEFT JOIN player_stats ps ON ps.game_id = g.id
    WHERE g.id = ?
  `).get(req.params.id);

  if (!game) return res.status(404).json({ error: 'Game not found' });

  const shots = db.prepare('SELECT * FROM shots WHERE game_id = ?').all(req.params.id);
  res.json({ ...game, shots });
});

// POST /api/games - 試合登録
router.post('/', (req, res) => {
  const { date, opponent, my_score, opponent_score, minutes_played, notes, stats } = req.body;

  const insertGame = db.prepare(`
    INSERT INTO games (date, opponent, my_score, opponent_score, minutes_played, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertStats = db.prepare(`
    INSERT INTO player_stats (game_id, points, rebounds, assists, steals, blocks, turnovers, fouls)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    const result = insertGame.run(date, opponent || '', my_score || 0, opponent_score || 0, minutes_played || 0, notes || '');
    const gameId = result.lastInsertRowid;

    if (stats) {
      insertStats.run(gameId, stats.points || 0, stats.rebounds || 0, stats.assists || 0,
        stats.steals || 0, stats.blocks || 0, stats.turnovers || 0, stats.fouls || 0);
    }

    return gameId;
  });

  const gameId = transaction();
  res.status(201).json({ id: gameId });
});

// PUT /api/games/:id - 試合更新
router.put('/:id', (req, res) => {
  const { date, opponent, my_score, opponent_score, minutes_played, notes, stats } = req.body;
  const { id } = req.params;

  const existing = db.prepare('SELECT id FROM games WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Game not found' });

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE games SET date = ?, opponent = ?, my_score = ?, opponent_score = ?, minutes_played = ?, notes = ?
      WHERE id = ?
    `).run(date, opponent || '', my_score || 0, opponent_score || 0, minutes_played || 0, notes || '', id);

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
});

// DELETE /api/games/:id - 試合削除
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM games WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Game not found' });
  res.json({ success: true });
});

module.exports = router;
