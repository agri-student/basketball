import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <nav role="navigation" aria-label="Main navigation">
        <span className="logo">Basketball Stats</span>
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/players">Players</NavLink>
        <NavLink to="/games">Games</NavLink>
        <NavLink to="/shooting">Shooting</NavLink>
        <NavLink to="/stats">Stats</NavLink>
      </nav>
      <main id="main-content" role="main">
        <Outlet />
      </main>
    </div>
  );
}
