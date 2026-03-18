const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'basketball.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    number INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    opponent TEXT NOT NULL DEFAULT '',
    my_score INTEGER NOT NULL DEFAULT 0,
    opponent_score INTEGER NOT NULL DEFAULT 0,
    minutes_played INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    quarter1 INTEGER NOT NULL DEFAULT 0,
    quarter2 INTEGER NOT NULL DEFAULT 0,
    quarter3 INTEGER NOT NULL DEFAULT 0,
    quarter4 INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS player_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL UNIQUE,
    points INTEGER NOT NULL DEFAULT 0,
    rebounds INTEGER NOT NULL DEFAULT 0,
    assists INTEGER NOT NULL DEFAULT 0,
    steals INTEGER NOT NULL DEFAULT 0,
    blocks INTEGER NOT NULL DEFAULT 0,
    turnovers INTEGER NOT NULL DEFAULT 0,
    fouls INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS shots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER,
    shot_type TEXT NOT NULL CHECK (shot_type IN ('2pt', '3pt', 'ft')),
    made INTEGER NOT NULL CHECK (made IN (0, 1)),
    zone TEXT,
    player_id INTEGER,
    quarter INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL
  );
`);

// Migrate existing tables if columns are missing
try { db.exec('ALTER TABLE games ADD COLUMN quarter1 INTEGER NOT NULL DEFAULT 0'); } catch {}
try { db.exec('ALTER TABLE games ADD COLUMN quarter2 INTEGER NOT NULL DEFAULT 0'); } catch {}
try { db.exec('ALTER TABLE games ADD COLUMN quarter3 INTEGER NOT NULL DEFAULT 0'); } catch {}
try { db.exec('ALTER TABLE games ADD COLUMN quarter4 INTEGER NOT NULL DEFAULT 0'); } catch {}
try { db.exec('ALTER TABLE shots ADD COLUMN zone TEXT'); } catch {}
try { db.exec('ALTER TABLE shots ADD COLUMN player_id INTEGER REFERENCES players(id) ON DELETE SET NULL'); } catch {}
try { db.exec('ALTER TABLE shots ADD COLUMN quarter INTEGER'); } catch {}
try { db.exec(`CREATE TABLE IF NOT EXISTS players (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, number INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')))`); } catch {}

module.exports = db;
