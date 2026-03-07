import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getFeed } from '../../api/posts';
import { PostCard } from '../post/PostCard';
import { Loader2, ArrowUpRight, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserSuggestions, followUser } from '../../api/users';
import { useAuth } from '../../context/AuthContext';

interface FeedProps {
    community?: string;
    followingOnly?: boolean;
}

export const Feed: React.FC<FeedProps> = ({ community, followingOnly = false }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Feed State
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Suggestions State
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [hasMoreSug, setHasMoreSug] = useState(true);
    const [loadingMoreSug, setLoadingMoreSug] = useState(false);

    // Random index to insert suggestions between the 1st and 3rd post
    const [sugInsertIndex] = useState(() => Math.floor(Math.random() * 3));

    // Feed Observer
    const observer = useRef<IntersectionObserver | null>(null);
    const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    const fetchPosts = async (pageNum: number) => {
        try {
            if (pageNum === 1) setLoading(true);
            else setLoadingMore(true);

            // Fetch exactly 10 posts per the requirements
            const data = await getFeed(pageNum, 10, community, followingOnly);

            setPosts(prev => {
                if (pageNum === 1) return data;
                // Prevent duplicate posts from appearing if new ones were added while scrolling
                const existingIds = new Set(prev.map(p => p._id));
                const newPosts = data.filter((p: any) => !existingIds.has(p._id));
                return [...prev, ...newPosts];
            });

            if (data.length < 10) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Error fetching feed');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchPosts(page);
    }, [page]);

    // Load Initial Suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (community || followingOnly) return; // Only show on general Home Feed
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
    }, [community, followingOnly]);

    const fetchMoreSuggestions = async () => {
        try {
            setLoadingMoreSug(true);
            const data = await getUserSuggestions();
            setSuggestions((prev: any[]) => {
                const existingIds = new Set(prev.map(u => u._id));
                const newUsers = data.filter((u: any) => !existingIds.has(u._id) && u._id !== user?.id);
                if (newUsers.length === 0) {
                    setHasMoreSug(false);
                }
                return [...prev, ...newUsers];
            });
        } catch (error) {
            console.error("Failed to load more suggestions:", error);
        } finally {
            setLoadingMoreSug(false);
        }
    };

    const handleFollow = async (userId: string) => {
        try {
            const result = await followUser(userId);
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

    const sugObserver = useRef<IntersectionObserver | null>(null);
    const lastSugElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loadingSuggestions || loadingMoreSug || community || followingOnly) return;
        if (sugObserver.current) sugObserver.current.disconnect();

        sugObserver.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMoreSug) {
                fetchMoreSuggestions();
            }
        });

        if (node) sugObserver.current.observe(node);
    }, [loadingSuggestions, loadingMoreSug, hasMoreSug, community, followingOnly]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 dark:bg-red-900/20 rounded-xl mt-6">
                <p className="text-red-500 font-medium">{error}</p>
                <button
                    onClick={() => fetchPosts(page)}
                    className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-lg font-medium hover:bg-red-200"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="w-full relative pb-20">
            {/* Floating positioning for Create New Button */}
            {!community && (
                <button
                    onClick={() => navigate('/create-post')}
                    style={{ maxWidth: '200px', position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, padding: '1rem 1.5rem', borderRadius: '2rem', boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)' }}
                    className="btn btn-primary"
                >
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>Create New</span>
                    <ArrowUpRight size={22} style={{ marginLeft: '0.5rem' }} />
                </button>
            )}

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {community ? community : (followingOnly ? 'Following' : 'Home Feed')}
            </h1>

            <div className="space-y-4">
                {loading && page === 1 ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No posts yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Be the first to share something!</p>
                    </div>
                ) : (
                    <>
                        {posts.map((post, index) => {
                            const postElement = (
                                <div key={`post-${post._id}`} ref={posts.length === index + 1 ? lastPostElementRef : null}>
                                    <PostCard post={post} />
                                </div>
                            );

                            const sugElement = (!community && !followingOnly && !loadingSuggestions && suggestions.length > 0 && index === sugInsertIndex) ? (
                                <div key="suggestions-block" style={{ marginBottom: '1rem' }} className="my-8 p-6 glass-card rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30">
                                    <h2 className="flex items-center gap-2 mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                                        <UserPlus size={24} className="text-indigo-500" />
                                        Suggested Connections
                                    </h2>
                                    <div className="flex gap-4 pb-4" style={{ overflowX: 'auto', scrollbarWidth: 'thin', scrollSnapType: 'x mandatory' }}>
                                        {suggestions.map((suggestion, sIndex) => (
                                            <div
                                                ref={suggestions.length === sIndex + 1 ? lastSugElementRef : null}
                                                key={suggestion._id}
                                                className="suggestion-card bg-white dark:bg-gray-800 border-none shadow-sm"
                                                style={{ marginTop: '0.5rem', marginRight: '1rem', marginBottom: '1rem', minWidth: '300px', flexShrink: 0, scrollSnapAlign: 'start' }}
                                            >
                                                <div className="suggestion-content">
                                                    <div className="suggestion-avatar">
                                                        {suggestion.name.charAt(0)}
                                                    </div>
                                                    <div className="suggestion-info">
                                                        <span className="suggestion-name">{suggestion.name}</span>
                                                        <span className="suggestion-fallback">@{suggestion.username || suggestion.name.toLowerCase().replace(/[^a-z0-9]/g, '')}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleFollow(suggestion._id)}
                                                    className={`btn btn-follow px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${suggestion.isFollowing
                                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400'
                                                        : 'bg-indigo-500 text-white hover:bg-indigo-600'
                                                        }`}
                                                >
                                                    {suggestion.isFollowing ? 'Following' : 'Follow'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null;

                            return (
                                <React.Fragment key={`fragment-${post._id}`}>
                                    {postElement}
                                    {sugElement}
                                </React.Fragment>
                            );
                        })}
                        {loadingMore && (
                            <div className="flex justify-center py-6">
                                <Loader2 className="animate-spin text-blue-500" size={24} />
                            </div>
                        )}
                        {!hasMore && posts.length > 0 && (
                            <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                                You've reached the end of the feed.
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
