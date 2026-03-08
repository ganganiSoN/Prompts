import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Bell, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getUnreadCount } from '../../api/notifications';
import { searchUsers } from '../../api/users';
import { io } from 'socket.io-client';
import './Header.css';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

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

    // Handle Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                try {
                    setIsSearching(true);
                    const results = await searchUsers(searchQuery);
                    setSearchResults(results);
                } catch (err) {
                    console.error('Failed to search users:', err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    return (
        <header className="header glass-card">
            <div className="header-search relative">
                {/* <div className="input-group m-0 search-group">
                    <Search className="input-icon search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="input-field search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowResults(true)}
                        onBlur={() => setTimeout(() => setShowResults(false), 200)}
                    />
                </div> */}

                {showResults && searchQuery.trim().length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface-color)]/95 backdrop-blur-xl border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                        {isSearching ? (
                            <div className="p-4 text-center text-[var(--text-muted)] text-sm border-b border-[var(--border-color)]">
                                <div className="w-5 h-5 mx-auto border-2 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                {searchResults.map((result: any) => (
                                    <div
                                        key={result._id}
                                        className="p-3 transition-colors hover:bg-white/5 cursor-pointer border-b border-[var(--border-color)] last:border-0 flex items-center gap-3"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            navigate(`/users/${result._id}`);
                                            setShowResults(false);
                                            setSearchQuery('');
                                        }}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-[var(--primary-color)] text-white flex items-center justify-center font-bold shrink-0">
                                            {result.name ? result.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="text-sm font-semibold truncate text-[var(--text-color)] flex items-center gap-2">
                                                {result.name}
                                                {result.role === 'admin' && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 rounded-full">Admin</span>}
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] truncate">{result.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-[var(--text-muted)] text-sm">
                                <Search className="mx-auto mb-2 opacity-50" size={20} />
                                No users found for "{searchQuery}"
                            </div>
                        )}
                    </div>
                )}
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
