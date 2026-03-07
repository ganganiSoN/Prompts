import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getFeed } from '../../api/posts';
import { CreatePost } from '../post/CreatePost';
import { PostCard } from '../post/PostCard';
import { Loader2 } from 'lucide-react';

interface FeedProps {
    community?: string;
    followingOnly?: boolean;
}

export const Feed: React.FC<FeedProps> = ({ community, followingOnly = false }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

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

    const handlePostCreated = (newPost: any) => {
        setPosts(prev => [newPost, ...prev]);
    };

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
        <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Home Feed</h1>

            <CreatePost onPostCreated={handlePostCreated} />

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
                            if (posts.length === index + 1) {
                                return (
                                    <div ref={lastPostElementRef} key={post._id}>
                                        <PostCard post={post} />
                                    </div>
                                );
                            } else {
                                return <PostCard key={post._id} post={post} />;
                            }
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
