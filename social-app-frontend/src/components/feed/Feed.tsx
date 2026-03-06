import React, { useState, useEffect } from 'react';
import { getFeed } from '../../api/posts';
import { CreatePost } from '../post/CreatePost';
import { PostCard } from '../post/PostCard';
import { Loader2 } from 'lucide-react';

export const Feed: React.FC = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const data = await getFeed();
            setPosts(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Error fetching feed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handlePostCreated = (newPost: any) => {
        setPosts(prev => [newPost, ...prev]);
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 dark:bg-red-900/20 rounded-xl mt-6">
                <p className="text-red-500 font-medium">{error}</p>
                <button
                    onClick={fetchPosts}
                    className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-lg font-medium hover:bg-red-200"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-6 px-4 sm:px-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Home Feed</h1>

            <CreatePost onPostCreated={handlePostCreated} />

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No posts yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Be the first to share something!</p>
                    </div>
                ) : (
                    posts.map(post => <PostCard key={post._id} post={post} />)
                )}
            </div>
        </div>
    );
};
