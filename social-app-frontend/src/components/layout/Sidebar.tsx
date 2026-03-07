import { NavLink } from 'react-router-dom';
import { LayoutDashboard, User, Settings, Activity, Users, Shield, Bookmark, Compass, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Feed', path: '/feed', icon: <Activity size={20} /> },
    { name: 'Explore', path: '/explore', icon: <Compass size={20} /> },
    { name: 'Profile', path: '/profile', icon: <User size={20} /> },
    { name: 'Drafts', path: '/drafts', icon: <Bookmark size={20} /> },
    { name: 'Community', path: '/community', icon: <Users size={20} /> },
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

        {user?.role === 'admin' && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon"><Shield size={20} /></span>
            <span className="nav-text">Users</span>
          </NavLink>
        )}

        {(user?.role === 'admin' || user?.role === 'moderator') && (
          <NavLink
            to="/moderation"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon"><ShieldAlert size={20} /></span>
            <span className="nav-text flex-1">Moderation</span>
            <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
          </NavLink>
        )}

        {/* Settings link, assuming it's always visible or has its own logic */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `nav-link ${isActive ? 'active' : ''}`
          }
        >
          <span className="nav-icon"><Settings size={20} /></span>
          <span className="nav-text">Settings</span>
        </NavLink>
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
