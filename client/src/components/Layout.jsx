import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="app">
      <nav>
        <span className="logo">Basketball Stats</span>
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/players">Players</NavLink>
        <NavLink to="/games">Games</NavLink>
        <NavLink to="/shooting">Shooting</NavLink>
        <NavLink to="/stats">Stats</NavLink>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
