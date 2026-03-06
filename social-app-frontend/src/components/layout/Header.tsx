import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Bell, Search } from 'lucide-react';

const Header = () => {
    const { user, logout } = useAuth();

    return (
        <header className="header glass-card">
            <div className="header-search">
                <div className="input-group m-0 search-group">
                    <Search className="input-icon search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search anything..."
                        className="input-field search-input"
                    />
                </div>
            </div>

            <div className="header-actions">
                <button className="icon-btn" aria-label="Notifications">
                    <Bell size={20} />
                    <span className="notification-dot"></span>
                </button>

                <div className="user-profile">
                    <div className="avatar">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{user?.name || 'User'}</span>
                        <span className="user-role">Admin</span>
                    </div>
                </div>

                <button onClick={logout} className="icon-btn logout-btn" title="Logout">
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
};

export default Header;
