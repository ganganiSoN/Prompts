import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notifications';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { Bell, MessageSquare, Heart, Shield, Flag, CheckCheck } from 'lucide-react';
import './NotificationsPage.css';

export const NotificationsPage = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
        
        if (!user) return;

        const socket = io('http://localhost:5000');
        socket.on('connect', () => {
            socket.emit('join_user_room', (user as any)._id || (user as any).id);
        });

        socket.on('new_notification', (newNotif) => {
            setNotifications(prev => [newNotif, ...prev]);
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notif: any) => {
        if (!notif.isRead) {
            try {
                await markAsRead(notif._id);
                setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
                window.dispatchEvent(new CustomEvent('notification_read'));
            } catch (error) {
                console.error('Failed to mark read', error);
            }
        }

        // Navigation logic
        if (notif.type === 'FOLLOW' && notif.sender?._id) {
            console.log('Navigating to Profile:', notif.sender._id);
            navigate(`/profile/${notif.sender._id}`);
        } else if (notif.post?._id) {
            console.log('Navigating to Post:', notif.post._id);
            navigate(`/post/${notif.post._id}`);
        } else if (notif.post) {
            // fallback if post is just string ID
            const postId = typeof notif.post === 'string' ? notif.post : notif.post._id;
            console.log('Navigating to Post (fallback):', postId);
            navigate(`/post/${postId}`);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            window.dispatchEvent(new CustomEvent('notifications_all_read'));
        } catch (error) {
            console.error('Failed to mark all read', error);
        }
    };

    const getIconInfo = (type: string) => {
        switch (type) {
            case 'LIKE': return { icon: <Heart size={16} className="notif-icon-like" />, text: 'liked your post' };
            case 'COMMENT': return { icon: <MessageSquare size={16} className="notif-icon-comment" />, text: 'commented on your post' };
            case 'MODERATION': return { icon: <Shield size={16} className="notif-icon-mod" />, text: 'moderation alert' };
            case 'REPORT': return { icon: <Flag size={16} className="notif-icon-report" />, text: 'report update' };
            case 'FOLLOW': return { icon: <Bell size={16} className="text-blue-400" />, text: 'started following you' };
            case 'NEW_POST': return { icon: <Bell size={16} className="text-green-400" />, text: 'published a new post' };
            case 'MENTION': return { icon: <MessageSquare size={16} className="text-purple-400" />, text: 'mentioned you in a post' };
            default: return { icon: <Bell size={16} className="notif-icon-default" />, text: 'notification' };
        }
    };

    if (loading) return <div className="p-4 text-center">Loading notifications...</div>;

    return (
        <div className="notifications-container max-w-2xl mx-auto p-4 w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Bell className="text-primary" /> Notifications
                </h1>
                <button
                    onClick={handleMarkAllRead}
                    className="btn btn-outline flex items-center gap-2"
                    style={{ padding: '0.4rem 1rem', width: 'auto', fontSize: '0.875rem' }}
                >
                    <CheckCheck size={16} /> Mark all read
                </button>
            </div>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="text-center text-gray-400 py-10 glass-card">
                        No notifications yet.
                    </div>
                ) : (
                    notifications.map(notif => {
                        const { icon, text } = getIconInfo(notif.type);
                        return (
                            <div 
                                key={notif._id} 
                                className={`notification-item group relative glass-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 ${notif.isRead ? 'opacity-70 bg-surface/40' : 'border-l-4 border-l-primary bg-surface/80 shadow-md shadow-primary/10'}`}
                                onClick={() => handleNotificationClick(notif)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="notif-avatar-container">
                                        {notif.sender?.avatar ? (
                                            <img src={notif.sender.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-surface-light flex items-center justify-center text-primary font-bold">
                                                {notif.sender?.name?.charAt(0) || <Shield size={20} />}
                                            </div>
                                        )}
                                        <div className="notif-icon-badge">
                                            {icon}
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-gray-200 text-[15px] leading-snug">
                                                {notif.sender ? <span className="font-bold text-white hover:text-primary transition-colors">{notif.sender.name}</span> : <span className="font-bold text-primary">System</span>}
                                                <span className="text-gray-400"> {text}</span>
                                            </p>
                                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                                {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        
                                        {notif.post && notif.type !== 'FOLLOW' && (
                                            <div className="mt-2 text-sm text-gray-400 border-l-2 border-gray-600 pl-3 italic line-clamp-2">
                                                {notif.post.content?.replace(/<[^>]*>?/gm, '').trim() || 'Media Content'}
                                            </div>
                                        )}
                                        {notif.comment && (
                                            <div className="mt-2 text-sm text-gray-300 border-l-2 border-primary/50 bg-primary/5 pl-3 py-1.5 rounded-r line-clamp-2">
                                                {notif.comment.content?.replace(/<[^>]*>?/gm, '').trim() || 'Comment'}
                                            </div>
                                        )}
                                        {notif.message && (
                                            <div className="mt-3 text-sm text-red-300 bg-red-500/10 p-2.5 rounded-md border border-red-500/20 font-medium tracking-wide">
                                                {notif.message?.replace(/<[^>]*>?/gm, '').trim()}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Thumbnail Extraction (Strictly Sized) */}
                                    {notif.post?.content?.includes('<img') && (
                                        <div 
                                            className="ml-3 flex-shrink-0 flex items-center justify-center bg-gray-900 rounded-md border border-white/10 overflow-hidden shadow-lg"
                                            style={{ width: '48px', height: '48px', minWidth: '48px' }}
                                        >
                                            <img 
                                                src={notif.post.content.match(/<img[^>]+src="([^">]+)"/)?.[1] || ''} 
                                                alt="thumb" 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                            />
                                        </div>
                                    )}

                                    {!notif.isRead && (
                                        <div className="w-2.5 h-2.5 bg-primary rounded-full mt-2 shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.6)] flex-shrink-0 relative right-0 top-0"></div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
export default NotificationsPage;
