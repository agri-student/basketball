const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper: build date filter conditions
function dateFilter(query, from, to) {
  const conditions = [];
  const params = [];
  if (from) { conditions.push('g.date >= ?'); params.push(from); }
  if (to) { conditions.push('g.date <= ?'); params.push(to); }
  return { conditions, params };
}

// GET /api/stats/shooting - シュート成功率サマリー
router.get('/shooting', (req, res) => {
  try {
    const { from, to } = req.query;
    let shotFilter = '';
    const params = [];
    if (from || to) {
      const parts = [];
      if (from) { parts.push('g.date >= ?'); params.push(from); }
      if (to) { parts.push('g.date <= ?'); params.push(to); }
      shotFilter = `JOIN games g ON g.id = shots.game_id WHERE ${parts.join(' AND ')}`;
    }

    const wherePrefix = shotFilter ? ' AND' : ' WHERE';
    const fromClause = shotFilter ? `shots ${shotFilter}` : 'shots';

    const stats = db.prepare(`
      SELECT
        shot_type,
        COUNT(*) as total,
        SUM(made) as made,
        ROUND(CAST(SUM(made) AS REAL) / COUNT(*) * 100, 1) as percentage
      FROM ${fromClause}
      GROUP BY shot_type
    `).all(...params);

    const fg = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(made) as made,
        ROUND(CAST(SUM(made) AS REAL) / NULLIF(COUNT(*), 0) * 100, 1) as percentage
      FROM ${fromClause}
      ${shotFilter ? ' AND' : ' WHERE'} shot_type IN ('2pt', '3pt')
    `).all(...params);

    res.json({ by_type: stats, field_goal: fg[0] || { total: 0, made: 0, percentage: null } });
  } catch (err) {
    console.error('GET /api/stats/shooting error:', err);
    res.status(500).json({ error: 'Failed to fetch shooting stats' });
  }
});

// GET /api/stats/averages - 基本スタッツの平均値
router.get('/averages', (req, res) => {
  try {
    const { from, to } = req.query;
    let query = `
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
    `;
    const params = [];
    if (from || to) {
      query += ' JOIN games g ON g.id = player_stats.game_id WHERE';
      const parts = [];
      if (from) { parts.push('g.date >= ?'); params.push(from); }
      if (to) { parts.push('g.date <= ?'); params.push(to); }
      query += ' ' + parts.join(' AND ');
    }

    const averages = db.prepare(query).get(...params);
    res.json(averages);
  } catch (err) {
    console.error('GET /api/stats/averages error:', err);
    res.status(500).json({ error: 'Failed to fetch averages' });
  }
});

// GET /api/stats/advanced - 高度な統計 (TS%, eFG%, quarter performance)
router.get('/advanced', (req, res) => {
  try {
    const { from, to } = req.query;
    let dateCondition = '';
    const params = [];
    if (from || to) {
      const parts = [];
      if (from) { parts.push('g.date >= ?'); params.push(from); }
      if (to) { parts.push('g.date <= ?'); params.push(to); }
      dateCondition = ' AND ' + parts.join(' AND ');
    }

    // TS% = Points / (2 * (FGA + 0.44 * FTA))
    // eFG% = (FGM + 0.5 * 3PM) / FGA
    const shotStats = db.prepare(`
      SELECT
        SUM(CASE WHEN shot_type IN ('2pt', '3pt') THEN 1 ELSE 0 END) as fga,
        SUM(CASE WHEN shot_type IN ('2pt', '3pt') AND made = 1 THEN 1 ELSE 0 END) as fgm,
        SUM(CASE WHEN shot_type = '3pt' AND made = 1 THEN 1 ELSE 0 END) as three_pm,
        SUM(CASE WHEN shot_type = 'ft' THEN 1 ELSE 0 END) as fta,
        SUM(CASE WHEN shot_type = 'ft' AND made = 1 THEN 1 ELSE 0 END) as ftm,
        SUM(CASE WHEN shot_type = '2pt' AND made = 1 THEN 2
            WHEN shot_type = '3pt' AND made = 1 THEN 3
            WHEN shot_type = 'ft' AND made = 1 THEN 1
            ELSE 0 END) as total_points
      FROM shots
      ${from || to ? 'JOIN games g ON g.id = shots.game_id WHERE 1=1' + dateCondition : ''}
    `).get(...params);

    let ts_pct = null;
    let efg_pct = null;
    if (shotStats && shotStats.fga > 0) {
      const tsa = shotStats.fga + 0.44 * shotStats.fta;
      if (tsa > 0) ts_pct = ((shotStats.total_points / (2 * tsa)) * 100).toFixed(1);
      efg_pct = (((shotStats.fgm + 0.5 * shotStats.three_pm) / shotStats.fga) * 100).toFixed(1);
    }

    // Quarter performance
    const quarterStats = db.prepare(`
      SELECT
        quarter,
        COUNT(*) as total_shots,
        SUM(made) as made_shots,
        ROUND(CAST(SUM(made) AS REAL) / NULLIF(COUNT(*), 0) * 100, 1) as fg_pct,
        SUM(CASE WHEN shot_type = '2pt' AND made = 1 THEN 2
            WHEN shot_type = '3pt' AND made = 1 THEN 3
            WHEN shot_type = 'ft' AND made = 1 THEN 1
            ELSE 0 END) as points
      FROM shots
      WHERE quarter IS NOT NULL
      ${from || to ? 'AND game_id IN (SELECT id FROM games g WHERE 1=1' + dateCondition + ')' : ''}
      GROUP BY quarter
      ORDER BY quarter
    `).all(...params);

    res.json({
      ts_pct: ts_pct ? Number(ts_pct) : null,
      efg_pct: efg_pct ? Number(efg_pct) : null,
      fga: shotStats?.fga || 0,
      fgm: shotStats?.fgm || 0,
      three_pm: shotStats?.three_pm || 0,
      fta: shotStats?.fta || 0,
      ftm: shotStats?.ftm || 0,
      total_points: shotStats?.total_points || 0,
      quarter_performance: quarterStats,
    });
  } catch (err) {
    console.error('GET /api/stats/advanced error:', err);
    res.status(500).json({ error: 'Failed to fetch advanced stats' });
  }
});

// GET /api/stats/trends - 時系列推移データ
router.get('/trends', (req, res) => {
  try {
    const { from, to } = req.query;
    let dateCondition = '';
    const params = [];
    if (from || to) {
      const parts = [];
      if (from) { parts.push('g.date >= ?'); params.push(from); }
      if (to) { parts.push('g.date <= ?'); params.push(to); }
      dateCondition = ' WHERE ' + parts.join(' AND ');
    }

    const gameTrends = db.prepare(`
      SELECT g.date, g.opponent, ps.points, ps.rebounds, ps.assists,
             ps.steals, ps.blocks, ps.turnovers
      FROM games g
      JOIN player_stats ps ON ps.game_id = g.id
      ${dateCondition}
      ORDER BY g.date ASC
    `).all(...params);

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
      ${dateCondition}
      GROUP BY g.id
      ORDER BY g.date ASC
    `).all(...params);

    res.json({ game_trends: gameTrends, shooting_trends: shootingTrends });
  } catch (err) {
    console.error('GET /api/stats/trends error:', err);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// GET /api/stats/zones - ゾーン別シュート成功率
router.get('/zones', (req, res) => {
  try {
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
  } catch (err) {
    console.error('GET /api/stats/zones error:', err);
    res.status(500).json({ error: 'Failed to fetch zone stats' });
  }
});

// GET /api/stats/players - 選手別スタッツ集計
router.get('/players', (req, res) => {
  try {
    const playerStats = db.prepare(`
      SELECT
        p.id, p.name, p.number,
        COUNT(DISTINCT s.game_id) as games_played,
        COUNT(*) as total_shots,
        SUM(s.made) as made_shots,
        SUM(CASE WHEN s.shot_type IN ('2pt', '3pt') THEN 1 ELSE 0 END) as fga,
        SUM(CASE WHEN s.shot_type IN ('2pt', '3pt') AND s.made = 1 THEN 1 ELSE 0 END) as fgm,
        SUM(CASE WHEN s.shot_type = '3pt' THEN 1 ELSE 0 END) as three_pa,
        SUM(CASE WHEN s.shot_type = '3pt' AND s.made = 1 THEN 1 ELSE 0 END) as three_pm,
        SUM(CASE WHEN s.shot_type = 'ft' THEN 1 ELSE 0 END) as fta,
        SUM(CASE WHEN s.shot_type = 'ft' AND s.made = 1 THEN 1 ELSE 0 END) as ftm,
        SUM(CASE WHEN s.shot_type = '2pt' AND s.made = 1 THEN 2
            WHEN s.shot_type = '3pt' AND s.made = 1 THEN 3
            WHEN s.shot_type = 'ft' AND s.made = 1 THEN 1
            ELSE 0 END) as total_points
      FROM players p
      JOIN shots s ON s.player_id = p.id
      GROUP BY p.id
      ORDER BY total_points DESC
    `).all();

    // Calculate per-game averages and percentages
    const result = playerStats.map(p => ({
      ...p,
      ppg: p.games_played > 0 ? (p.total_points / p.games_played).toFixed(1) : '0.0',
      fg_pct: p.fga > 0 ? ((p.fgm / p.fga) * 100).toFixed(1) : null,
      three_pct: p.three_pa > 0 ? ((p.three_pm / p.three_pa) * 100).toFixed(1) : null,
      ft_pct: p.fta > 0 ? ((p.ftm / p.fta) * 100).toFixed(1) : null,
    }));

    res.json(result);
  } catch (err) {
    console.error('GET /api/stats/players error:', err);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

module.exports = router;
