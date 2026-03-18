const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/stats/shooting - シュート成功率サマリー
router.get('/shooting', (req, res) => {
  const stats = db.prepare(`
    SELECT
      shot_type,
      COUNT(*) as total,
      SUM(made) as made,
      ROUND(CAST(SUM(made) AS REAL) / COUNT(*) * 100, 1) as percentage
    FROM shots
    GROUP BY shot_type
  `).all();

  // FG% (2pt + 3pt)
  const fg = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(made) as made,
      ROUND(CAST(SUM(made) AS REAL) / NULLIF(COUNT(*), 0) * 100, 1) as percentage
    FROM shots
    WHERE shot_type IN ('2pt', '3pt')
  `).get();

  res.json({ by_type: stats, field_goal: fg });
});

// GET /api/stats/averages - 基本スタッツの平均値
router.get('/averages', (req, res) => {
  const averages = db.prepare(`
    SELECT
      COUNT(*) as games_played,
      ROUND(AVG(points), 1) as avg_points,
      ROUND(AVG(rebounds), 1) as avg_rebounds,
      ROUND(AVG(assists), 1) as avg_assists,
      ROUND(AVG(steals), 1) as avg_steals,
      ROUND(AVG(blocks), 1) as avg_blocks,
      ROUND(AVG(turnovers), 1) as avg_turnovers,
      ROUND(AVG(fouls), 1) as avg_fouls
    FROM player_stats
  `).get();

  res.json(averages);
});

// GET /api/stats/trends - 時系列推移データ
router.get('/trends', (req, res) => {
  // 試合ごとのスタッツ推移
  const gameTrends = db.prepare(`
    SELECT g.date, g.opponent, ps.points, ps.rebounds, ps.assists,
           ps.steals, ps.blocks, ps.turnovers
    FROM games g
    JOIN player_stats ps ON ps.game_id = g.id
    ORDER BY g.date ASC
  `).all();

  // 試合ごとのシュート成功率推移
  const shootingTrends = db.prepare(`
    SELECT
      g.date,
      g.opponent,
      COUNT(*) as total_shots,
      SUM(s.made) as made_shots,
      ROUND(CAST(SUM(s.made) AS REAL) / NULLIF(COUNT(*), 0) * 100, 1) as fg_pct,
      ROUND(CAST(SUM(CASE WHEN s.shot_type = '3pt' AND s.made = 1 THEN 1 ELSE 0 END) AS REAL) /
        NULLIF(SUM(CASE WHEN s.shot_type = '3pt' THEN 1 ELSE 0 END), 0) * 100, 1) as three_pct
    FROM games g
    JOIN shots s ON s.game_id = g.id
    GROUP BY g.id
    ORDER BY g.date ASC
  `).all();

  res.json({ game_trends: gameTrends, shooting_trends: shootingTrends });
});

// GET /api/stats/zones - ゾーン別シュート成功率
router.get('/zones', (req, res) => {
  const { game_id } = req.query;
  let query = `
    SELECT zone, COUNT(*) as total, SUM(made) as made,
      ROUND(CAST(SUM(made) AS REAL) / NULLIF(COUNT(*), 0) * 100, 1) as percentage
    FROM shots
    WHERE zone IS NOT NULL AND shot_type IN ('2pt', '3pt')
  `;
  const params = [];
  if (game_id) {
    query += ' AND game_id = ?';
    params.push(game_id);
  }
  query += ' GROUP BY zone';
  const stats = db.prepare(query).all(...params);
  res.json(stats);
});

module.exports = router;
