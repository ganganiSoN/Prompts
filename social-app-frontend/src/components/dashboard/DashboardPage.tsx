import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Activity, CreditCard, ArrowUpRight, UserPlus, Tag } from 'lucide-react';
import { getUserSuggestions } from '../../api/users';

const DashboardPage = () => {
    const { user } = useAuth();
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const data = await getUserSuggestions();
                setSuggestions(data);
            } catch (error) {
                console.error("Failed to load suggestions:", error);
            } finally {
                setLoadingSuggestions(false);
            }
        };
        fetchSuggestions();
    }, []);

    const stats = [
        { title: 'Total Users', value: '1,234', change: '+12%', icon: <Users size={24} /> },
        { title: 'Active Sessions', value: '891', change: '+5%', icon: <Activity size={24} /> },
        { title: 'Server Load', value: '34%', change: '-2%', icon: <CreditCard size={24} /> },
    ];

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Welcome back, {user?.name}!</h1>
                    <p className="page-subtitle">Here's what's happening today.</p>
                </div>
                <button className="btn btn-primary create-btn">
                    <span>Create New</span>
                    <ArrowUpRight size={18} />
                </button>
            </header>

            <div className="stats-grid mt-6">
                {stats.map((stat, i) => (
                    <div key={i} className="stat-card glass-card">
                        <div className="stat-header">
                            <span className="stat-title">{stat.title}</span>
                            <div className="icon-wrapper">{stat.icon}</div>
                        </div>
                        <div className="stat-body mt-4">
                            <span className="stat-value">{stat.value}</span>
                            <span className={`stat-change ${stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="glass-card dashboard-main lg:col-span-2">
                    <h2>Recent Activity</h2>
                    <div className="divider"></div>
                    <div className="empty-state">
                        <Activity size={48} className="empty-icon" />
                        <p>No recent activity to display.</p>
                    </div>
                </div>

                {/* User Suggestions Section */}
                <div className="glass-card">
                    <h2 className="flex items-center gap-2 mb-4 text-lg font-semibold">
                        <UserPlus size={20} className="text-indigo-400" />
                        Suggested For You
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Based on your shared interests
                    </p>

                    {loadingSuggestions ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex space-x-4 items-center">
                                    <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10"></div>
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : suggestions.length > 0 ? (
                        <div className="suggestion-list">
                            {suggestions.map((suggestedUser) => (
                                <div key={suggestedUser._id} className="suggestion-card">
                                    <div className="suggestion-content">
                                        <div className="suggestion-avatar">
                                            {suggestedUser.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="suggestion-info">
                                            <h4 className="suggestion-name">{suggestedUser.name}</h4>

                                            {suggestedUser.sharedInterestsCount > 0 ? (
                                                <div className="suggestion-stats">
                                                    <Tag size={12} />
                                                    <span>{suggestedUser.sharedInterestsCount} shared interest{suggestedUser.sharedInterestsCount > 1 ? 's' : ''}</span>
                                                </div>
                                            ) : (
                                                <p className="suggestion-fallback">@{suggestedUser.email.split('@')[0]}</p>
                                            )}
                                        </div>
                                    </div>
                                    <button className="btn btn-primary btn-follow">
                                        Follow
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No suggestions right now.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
