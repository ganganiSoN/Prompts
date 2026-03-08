import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Bell, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUnreadCount } from '../../api/notifications';
import { io } from 'socket.io-client';
import './Header.css';

const Header = () => {
    const { user, logout } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        // Fetch initial count
        getUnreadCount()
            .then(res => setUnreadCount(res.count))
            .catch(console.error);

        // Setup socket
        const socket = io('http://localhost:5000');
        
        socket.on('connect', () => {
             // Assuming user object has id or _id depending on the user model shape
             socket.emit('join_user_room', (user as any)._id || (user as any).id);
        });

        socket.on('new_notification', () => {
             // Let's increment unread count immediately within 1s
             setUnreadCount(prev => prev + 1);
        });

        const handleNotificationRead = () => {
            setUnreadCount(prev => Math.max(0, prev - 1));
        };

        const handleAllRead = () => {
            setUnreadCount(0);
        };

        window.addEventListener('notification_read', handleNotificationRead as EventListener);
        window.addEventListener('notifications_all_read', handleAllRead as EventListener);

        return () => {
            socket.disconnect();
            window.removeEventListener('notification_read', handleNotificationRead as EventListener);
            window.removeEventListener('notifications_all_read', handleAllRead as EventListener);
        };
    }, [user]);

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
                <Link to="/notifications" className="icon-btn relative bg-transparent" aria-label="Notifications">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute flex items-center justify-center -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full border border-[var(--surface-color)] p-0 m-0 leading-none">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Link>

                <div className="user-profile">
                    <div className="avatar">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{user?.name || 'User'}</span>
                        {(user?.role === 'admin' || user?.role === 'moderator') && (
                            <span className="user-role" style={{ textTransform: 'capitalize' }}>
                                {user.role}
                            </span>
                        )}
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
