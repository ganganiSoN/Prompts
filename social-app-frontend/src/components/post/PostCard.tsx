import React, { useState } from 'react';
import {
    Heart,
    MessageSquare,
    Repeat2,
    Bookmark,
    Share,
    MoreHorizontal,
    BarChart2,
    CalendarClock
} from 'lucide-react';
import { engageWithPost } from '../../api/posts';
import { useToast } from '../../context/ToastContext';
import { CommentSection } from './CommentSection';

interface PostProps {
    post: any;
}

export const PostCard: React.FC<PostProps> = ({ post }) => {
    const [counts, setCounts] = useState(post.engagementCount || { likes: 0, comments: 0, reposts: 0, bookmarks: 0, shares: 0 });
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const { error: showError, success } = useToast();

    // Quick parse for simple media URLs in content (fallback)
    const renderContent = () => {
        if (post.type === 'image' || post.type === 'video') {
            const lines = post.content.split('\n');
            const mediaUrl = lines.pop(); // Assume last line is URL from our CreatePost
            const textContent = lines.join('\n');

            return (
                <div className="mt-3">
                    {textContent && <div className="text-gray-800 dark:text-gray-100 mb-3 whitespace-pre-wrap rich-text-content" dangerouslySetInnerHTML={{ __html: textContent }} />}
                    <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                        {post.type === 'image' ? (
                            <img src={mediaUrl} alt="Post content" className="w-full object-cover max-h-[500px]" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        ) : (
                            <video src={mediaUrl} controls className="w-full max-h-[500px]" />
                        )}
                    </div>
                </div>
            );
        }

        const baseContent = <div className="post-content-area rich-text-content" dangerouslySetInnerHTML={{ __html: post.content }} />;

        // Handle Poll UI Rendering
        if (post.type === 'poll' && post.poll) {
            const totalVotes = post.poll.options.reduce((acc: number, opt: any) => acc + (opt.votes || 0), 0);

            return (
                <div className="mt-3">
                    {baseContent}
                    <div className="mt-4 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 shadow-sm">
                        <h4 className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200 mb-4 text-[15px]">
                            <BarChart2 size={18} className="text-indigo-500" /> {post.poll.question}
                        </h4>
                        <div className="space-y-3">
                            {post.poll.options.map((opt: any, idx: number) => {
                                const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                                return (
                                    <button
                                        key={idx}
                                        className="w-full relative group overflow-hidden rounded-xl border border-indigo-200/50 dark:border-indigo-700/50 bg-white/60 dark:bg-gray-800/60 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all text-left p-3"
                                    >
                                        <div
                                            className="absolute top-0 left-0 h-full bg-indigo-100 dark:bg-indigo-900/40 rounded-xl transition-all duration-700 ease-out"
                                            style={{ width: `${percent}%` }}
                                        />
                                        <div className="relative z-10 flex justify-between items-center px-1">
                                            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                                                {opt.text}
                                            </span>
                                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                                                {percent}%
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="mt-3 text-xs text-gray-500 font-medium pl-1">{totalVotes} votes total</p>
                    </div>
                </div>
            )
        }

        return baseContent;
    };

    const handleEngage = async (type: string) => {
        try {
            await engageWithPost(post._id, type);
            // Optimistic update
            setCounts((prev: any) => ({
                ...prev,
                [`${type}s`]: prev[`${type}s`] + (type === 'like' ? (isLiked ? -1 : 1) : type === 'bookmark' ? (isBookmarked ? -1 : 1) : 1)
            }));

            if (type === 'like') setIsLiked(!isLiked);
            if (type === 'bookmark') setIsBookmarked(!isBookmarked);

            if (type === 'share') success('Post shared successfully!');

        } catch (error: any) {
            showError(error.message || `Failed to ${type} post`);
        }
    };

    // Format date nicely
    const date = new Date(post.createdAt);
    const timeAgo = Math.floor((new Date().getTime() - date.getTime()) / 60000);
    const displayTime = timeAgo < 60 ? `${timeAgo}m` : timeAgo < 1440 ? `${Math.floor(timeAgo / 60)}h` : `${Math.floor(timeAgo / 1440)}d`;

    return (
        <div className="post-card group">
            {post.status === 'UNDER_REVIEW' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 text-xs font-semibold px-2.5 py-1 rounded-md w-max mb-3 uppercase tracking-wider border border-yellow-200 dark:border-yellow-700/50 shadow-sm">
                    Pending Moderation
                </div>
            )}

            {post.isScheduled && (
                <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-semibold px-2.5 py-1 rounded-md w-max mb-3 tracking-wide border border-purple-200 dark:border-purple-700/50 shadow-sm">
                    <CalendarClock size={12} />
                    Scheduled: {new Date(post.scheduledFor).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
            )}

            <div className="post-header">
                <div className="post-author-info">
                    <div className="post-avatar" />
                    <div className="post-author-details">
                        <div className="post-author-name-row">
                            <h3 className="post-author-name">
                                {post.author?.email?.split('@')[0] || 'Unknown User'}
                            </h3>
                            {post.community !== 'General' && (
                                <>
                                    <span className="text-gray-400 text-sm">•</span>
                                    <span className="post-community-badge">
                                        c/{post.community}
                                    </span>
                                </>
                            )}
                        </div>
                        <p className="post-author-meta">
                            @{post.author?.email?.split('@')[0]}
                            <span>·</span>
                            {displayTime}
                        </p>
                    </div>
                </div>
                <button className="post-options-btn">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            {renderContent()}

            <div className="post-actions">
                <button onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }} className={`post-action-btn comment ${showComments ? 'text-indigo-500' : ''}`}>
                    <div className={`post-action-icon ${showComments ? 'bg-indigo-500/10' : ''}`}>
                        <MessageSquare size={18} />
                    </div>
                    <span>{counts.comments || 0}</span>
                </button>

                <button onClick={(e) => { e.stopPropagation(); handleEngage('repost'); }} className="post-action-btn repost">
                    <div className="post-action-icon">
                        <Repeat2 size={18} />
                    </div>
                    <span>{counts.reposts || 0}</span>
                </button>

                <button onClick={(e) => { e.stopPropagation(); handleEngage('like'); }} className={`post-action-btn like ${isLiked ? 'active' : ''}`}>
                    <div className="post-action-icon">
                        <Heart size={18} className={isLiked ? "fill-current" : ""} />
                    </div>
                    <span>{counts.likes || 0}</span>
                </button>

                <button onClick={(e) => { e.stopPropagation(); handleEngage('bookmark'); }} className={`post-action-btn bookmark ${isBookmarked ? 'active' : ''}`}>
                    <div className="post-action-icon">
                        <Bookmark size={18} className={isBookmarked ? "fill-current" : ""} />
                    </div>
                </button>

                <button onClick={(e) => { e.stopPropagation(); handleEngage('share'); }} className="post-action-btn share">
                    <div className="post-action-icon">
                        <Share size={18} />
                    </div>
                </button>
            </div>

            {/* Comment Section Expand/Collapse */}
            {showComments && (
                <CommentSection postId={post._id} />
            )}
        </div>
    );
};
