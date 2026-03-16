import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function GameList() {
  const [games, setGames] = useState([]);

  useEffect(() => {
    fetch('/api/games').then(r => r.json()).then(setGames);
  }, []);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Games</h1>
        <Link to="/games/new" className="btn btn-primary">+ New Game</Link>
      </div>

      {games.length === 0 ? (
        <div className="empty-state">
          <p>No games recorded yet.</p>
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Opponent</th><th>Score</th>
                <th>PTS</th><th>REB</th><th>AST</th><th>Result</th>
              </tr>
            </thead>
            <tbody>
              {games.map(g => (
                <tr key={g.id}>
                  <td><Link to={`/games/${g.id}`}>{g.date}</Link></td>
                  <td>{g.opponent}</td>
                  <td>{g.my_score}-{g.opponent_score}</td>
                  <td>{g.points ?? '-'}</td>
                  <td>{g.rebounds ?? '-'}</td>
                  <td>{g.assists ?? '-'}</td>
                  <td className={g.my_score > g.opponent_score ? 'win' : g.my_score < g.opponent_score ? 'lose' : ''}>
                    {g.my_score > g.opponent_score ? 'W' : g.my_score < g.opponent_score ? 'L' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
