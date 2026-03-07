import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowUpRight, UserPlus, Tag, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getUserSuggestions, followUser } from '../../api/users';
import { useNavigate } from 'react-router-dom';
import { Feed } from '../feed/Feed';

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

    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const observer = useRef<IntersectionObserver | null>(null);

    const fetchMoreSuggestions = async () => {
        try {
            setLoadingMore(true);
            const data = await getUserSuggestions();
            setSuggestions((prev: any[]) => {
                const existingIds = new Set(prev.map(u => u._id));
                const newUsers = data.filter((u: any) => !existingIds.has(u._id) && u._id !== user?.id);
                if (newUsers.length === 0) {
                    setHasMore(false);
                }
                return [...prev, ...newUsers];
            });
        } catch (error) {
            console.error("Failed to load more suggestions:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleFollow = async (userId: string) => {
        try {
            const result = await followUser(userId);
            // Update the suggestion specific to this user ID
            setSuggestions((prev: any[]) =>
                prev.map(u => {
                    if (u._id === userId) {
                        return { ...u, isFollowing: result.isFollowing };
                    }
                    return u;
                })
            );
        } catch (error) {
            console.error('Failed to follow suggestion', error);
        }
    };

    const lastUserElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loadingSuggestions || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchMoreSuggestions();
            }
        });

        if (node) observer.current.observe(node);
    }, [loadingSuggestions, loadingMore, hasMore, page]);
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

            <div className="mt-8">
                <h2 className="flex items-center gap-2 mb-4 text-xl font-semibold">
                    <UserPlus size={24} className="text-indigo-400" />
                    Suggested Connections
                </h2>

                {loadingSuggestions ? (
                    <div className="pb-4" style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="glass-card animate-pulse" style={{ minWidth: '280px', height: '8rem', borderRadius: '0.75rem' }}></div>
                        ))}
                    </div>
                ) : suggestions.length > 0 ? (
                    <div className="pb-6 pt-2" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', scrollbarWidth: 'thin', scrollSnapType: 'x mandatory' }}>
                        {suggestions.map((suggestedUser: any, index: number) => {
                            const isLast = index === suggestions.length - 1;
                            return (
                                <div
                                    key={suggestedUser._id + index}
                                    ref={isLast ? lastUserElementRef : null}
                                    className="glass-card transition-colors hover:bg-white/5"
                                    style={{
                                        flex: '0 0 auto',
                                        width: '280px',
                                        padding: '1.25rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        scrollSnapAlign: 'center',
                                        borderLeft: '4px solid var(--primary)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                                        <div
                                            style={{
                                                width: '3rem',
                                                height: '3rem',
                                                borderRadius: '50%',
                                                border: '2px solid rgba(99, 102, 241, 0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.125rem',
                                                fontWeight: 'bold',
                                                background: 'linear-gradient(135deg, var(--primary), #a855f7)'
                                            }}
                                        >
                                            {suggestedUser.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <h4 style={{ fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '1rem' }}>
                                                {suggestedUser.name}
                                            </h4>
                                            {suggestedUser.sharedInterestsCount > 0 ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#a5b4fc', marginTop: '0.375rem' }}>
                                                    <Tag size={10} />
                                                    <span>{suggestedUser.sharedInterestsCount} shared interests</span>
                                                </div>
                                            ) : (
                                                <p style={{ fontSize: '0.75rem', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.25rem' }}>
                                                    @{suggestedUser.email.split('@')[0]}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className={`btn ${suggestedUser.isFollowing ? 'btn-outline' : 'btn-primary'}`}
                                            style={{
                                                flex: 1,
                                                padding: '0.375rem 0',
                                                fontSize: '0.875rem',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                            }}
                                            onClick={() => handleFollow(suggestedUser._id)}
                                        >
                                            {suggestedUser.isFollowing ? (
                                                <>
                                                    <CheckCircle2 size={14} /> Following
                                                </>
                                            ) : (
                                                'Follow'
                                            )}
                                        </button>
                                        <button
                                            className="btn btn-outline"
                                            style={{ flex: 1, padding: '0.375rem 0', fontSize: '0.875rem', borderColor: 'rgba(255,255,255,0.1)', color: '#9ca3af' }}
                                            onClick={() => navigate(`/users/${suggestedUser._id}`)}
                                        >
                                            View Profile
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {loadingMore && (
                            <div style={{ flex: '0 0 auto', width: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Loader2 className="animate-spin text-indigo-500" size={32} />
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No suggestions right now.</p>
                )}
            </div>

            {/* Following Feed */}
            <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                    <RefreshCw size={24} className="text-indigo-400" />
                    <h2 className="text-xl font-semibold">Following Activity</h2>
                </div>
                <Feed followingOnly={true} />
            </div>
        </div>
    );
};

export default DashboardPage;
