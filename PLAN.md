# Basketball Stats Tracker - 設計プラン

## 技術スタック
- **フロントエンド**: React + Vite + Chart.js (グラフ表示)
- **バックエンド**: Node.js + Express
- **データベース**: SQLite (better-sqlite3) — 軽量でセットアップ不要
- **スタイリング**: CSS Modules

## ディレクトリ構成

```
basketball/
├── client/                    # React フロントエンド
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx           # 共通レイアウト・ナビ
│   │   │   ├── Dashboard.jsx        # ダッシュボード（概要）
│   │   │   ├── GameForm.jsx         # 試合記録の入力フォーム
│   │   │   ├── GameList.jsx         # 試合一覧
│   │   │   ├── GameDetail.jsx       # 試合詳細
│   │   │   ├── ShootingForm.jsx     # シュート記録の入力
│   │   │   ├── ShootingStats.jsx    # シュート成功率の表示・グラフ
│   │   │   └── PlayerStats.jsx      # 基本スタッツ一覧
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                    # Express バックエンド
│   ├── index.js               # サーバーエントリポイント
│   ├── db.js                  # SQLite 接続・初期化
│   └── routes/
│       ├── games.js           # 試合 CRUD API
│       ├── shots.js           # シュート記録 API
│       └── stats.js           # 集計・統計 API
├── package.json               # ルート（scripts用）
└── README.md
```

## データベース設計

### games テーブル（試合記録）
| カラム | 型 | 説明 |
|--------|------|------|
| id | INTEGER PK | ID |
| date | TEXT | 試合日 |
| opponent | TEXT | 対戦相手 |
| my_score | INTEGER | 自チームスコア |
| opponent_score | INTEGER | 相手スコア |
| minutes_played | INTEGER | 出場時間（分） |
| notes | TEXT | メモ |

### player_stats テーブル（基本スタッツ）
| カラム | 型 | 説明 |
|--------|------|------|
| id | INTEGER PK | ID |
| game_id | INTEGER FK | 試合ID |
| points | INTEGER | 得点 |
| rebounds | INTEGER | リバウンド |
| assists | INTEGER | アシスト |
| steals | INTEGER | スティール |
| blocks | INTEGER | ブロック |
| turnovers | INTEGER | ターンオーバー |
| fouls | INTEGER | ファウル |

### shots テーブル（シュート記録）
| カラム | 型 | 説明 |
|--------|------|------|
| id | INTEGER PK | ID |
| game_id | INTEGER FK | 試合ID (NULLなら練習) |
| shot_type | TEXT | "2pt" / "3pt" / "ft" |
| made | INTEGER | 成功=1, 失敗=0 |
| created_at | TEXT | 記録日時 |

## API エンドポイント

### 試合 (Games)
- `GET /api/games` — 試合一覧
- `POST /api/games` — 試合登録
- `GET /api/games/:id` — 試合詳細（スタッツ・シュート含む）
- `PUT /api/games/:id` — 試合更新
- `DELETE /api/games/:id` — 試合削除

### シュート (Shots)
- `POST /api/shots` — シュート記録追加
- `GET /api/shots?game_id=X` — 特定試合のシュート一覧

### 統計 (Stats)
- `GET /api/stats/shooting` — シュート成功率サマリー (FG%, 3P%, FT%)
- `GET /api/stats/averages` — 基本スタッツの平均値
- `GET /api/stats/trends` — 時系列推移データ（グラフ用）

## 画面構成

1. **ダッシュボード** — 直近の成績サマリー、シュート成功率、トレンドグラフ
2. **試合一覧** — 過去の試合リスト、勝敗表示
3. **試合登録/編集** — 試合情報・スタッツ・シュート記録を一括入力
4. **シュート記録** — 練習や試合中のシュートを素早く記録（タップUI）
5. **統計** — FG%/3P%/FT%の推移グラフ、平均スタッツ

## 実装順序

1. サーバー側セットアップ（Express + SQLite + テーブル作成）
2. API エンドポイント実装
3. React フロントエンド セットアップ（Vite）
4. 試合登録・一覧画面
5. シュート記録画面
6. ダッシュボード・統計グラフ
