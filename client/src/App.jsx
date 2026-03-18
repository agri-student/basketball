import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Players from './components/Players';
import GameList from './components/GameList';
import GameForm from './components/GameForm';
import GameDetail from './components/GameDetail';
import GameLive from './components/GameLive';
import ShootingForm from './components/ShootingForm';
import Stats from './components/Stats';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/players" element={<Players />} />
          <Route path="/games" element={<GameList />} />
          <Route path="/games/new" element={<GameForm />} />
          <Route path="/games/:id" element={<GameDetail />} />
          <Route path="/games/:id/edit" element={<GameForm />} />
          <Route path="/games/:id/live" element={<GameLive />} />
          <Route path="/shooting" element={<ShootingForm />} />
          <Route path="/stats" element={<Stats />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
