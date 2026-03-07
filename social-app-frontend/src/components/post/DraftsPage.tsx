import React, { useEffect, useState } from 'react';
import { getDrafts } from '../../api/posts';
import { PostCard } from './PostCard';
import { Loader2, Bookmark } from 'lucide-react';

const DraftsPage = () => {
    const [drafts, setDrafts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDrafts = async () => {
            try {
                const data = await getDrafts();
                setDrafts(data);
                setError(null);
            } catch (err: any) {
                setError(err.message || "Failed to load drafts");
            } finally {
                setLoading(false);
            }
        };

        fetchDrafts();
    }, []);

    // Filter out published drafts optimistically so they disappear instantly
    const visibleDrafts = drafts.filter(draft => draft.status === 'DRAFT');

    return (
        <div className="page-container animate-fade-in w-full max-w-3xl mx-auto">
            <header className="page-header mt-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                        <Bookmark size={24} className="text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Drafts</h1>
                        <p className="text-sm text-gray-500 mt-1">Posts you've saved to edit or publish later.</p>
                    </div>
                </div>
            </header>

            <div className="mt-8 space-y-6">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-500 p-4 rounded-xl text-center border border-red-100 dark:border-red-900/30">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-indigo-500" size={32} />
                    </div>
                ) : visibleDrafts.length === 0 ? (
                    <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-gray-800 flex items-center justify-center mb-4">
                            <Bookmark className="w-8 h-8 text-indigo-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">No pending drafts</h3>
                        <p className="text-gray-500 mt-2 max-w-sm">When you write a post and select "Save Draft", it will securely remain here until you're ready to share it.</p>
                    </div>
                ) : (
                    visibleDrafts.map((draft) => (
                        <div key={draft._id} className="relative">
                            <PostCard post={draft} />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DraftsPage;
