import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, User, Settings, Activity } from 'lucide-react';

const Sidebar = () => {
  const navLinks = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Feed', path: '/feed', icon: <Activity size={20} /> },
    { name: 'Profile', path: '/profile', icon: <User size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="sidebar glass-card">
      <div className="sidebar-logo">
        <div className="logo-icon glass-icon">
          <span className="logo-text">S</span>
        </div>
        <h2 className="app-name">Nexus</h2>
      </div>

      <nav className="sidebar-nav">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{link.icon}</span>
            <span className="nav-text">{link.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="premium-badge">
          <span className="badge-dot"></span>
          <span className="badge-text">Pro Member</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
