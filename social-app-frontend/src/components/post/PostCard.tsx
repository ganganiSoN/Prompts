import React, { useState } from 'react';
import {
    Heart,
    MessageSquare,
    Repeat2,
    Bookmark,
    Share,
    MoreHorizontal,
    BarChart2,
    CalendarClock,
    Trash2,
    Edit2,
    AlertTriangle
} from 'lucide-react';
import { engageWithPost, repostPost, deletePost, updatePost } from '../../api/posts';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { CommentSection } from './CommentSection';
import { RichTextEditor } from './RichTextEditor';
import type { PostPayload } from './RichTextEditor';

interface PostProps {
    post: any;
}

export const PostCard: React.FC<PostProps> = ({ post }) => {
    const [counts, setCounts] = useState(post.engagementCount || { likes: 0, comments: 0, reposts: 0, bookmarks: 0, shares: 0 });
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editPayload, setEditPayload] = useState<PostPayload>({ content: post.content || '' });
    const [isDeleted, setIsDeleted] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { error: showError, success } = useToast();
    const { user } = useAuth();

    // Check if the current user is the author of the post
    // The post.author could be populated (object with _id) or just a string ID
    const authorId = post.author?._id || post.author;
    const isAuthor = user?.id === authorId;

    // Quick parse for simple media URLs in content (fallback)
    const renderContent = () => {
        if (post.type === 'repost') {
            const original = post.originalPost;

            if (!original) {
                return (
                    <div className="mb-4 mt-2">
                        <div className="border border-red-100 dark:border-red-900/30 rounded-xl p-4 bg-red-50/50 dark:bg-red-900/10 text-red-500 italic text-sm text-center">
                            The original post has been deleted.
                        </div>
                    </div>
                );
            }

            return (
                <div className="mb-4 mt-2">
                    {post.content && <div className="post-content-area rich-text-content mb-3" dangerouslySetInnerHTML={{ __html: post.content }} />}
                    <div className="border border-indigo-100 dark:border-gray-700 rounded-xl p-4 bg-white/50 dark:bg-gray-800/40 shadow-sm cursor-pointer hover:border-indigo-300 dark:hover:border-gray-600 transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="post-avatar w-6 h-6 text-[10px]">
                                {original.author?.email ? original.author.email.charAt(0).toUpperCase() : '?'}
                            </div>
                            <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{original.author?.email?.split('@')[0]}</span>
                            <span className="text-xs text-gray-500">· {new Date(original.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-sm text-gray-800 dark:text-gray-300 line-clamp-5">
                            {original.content ? (
                                <div dangerouslySetInnerHTML={{ __html: original.content }} className="rich-text-content" />
                            ) : (
                                <span className="italic text-gray-500">[{original.type?.toUpperCase() || 'UNKNOWN'} CONTENT]</span>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
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
                    <div className="poll-container">
                        <h4 className="poll-question-header">
                            <BarChart2 size={18} className="text-indigo-400" /> {post.poll.question}
                        </h4>
                        <div className="poll-options-wrapper">
                            {post.poll.options.map((opt: any, idx: number) => {
                                const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                                return (
                                    <button
                                        key={idx}
                                        className="poll-option-btn group"
                                    >
                                        <div
                                            className="poll-option-progress"
                                            style={{ width: `${percent}%` }}
                                        />
                                        <div className="poll-option-content">
                                            <span className="poll-option-text">
                                                {opt.text}
                                            </span>
                                            <span className="poll-option-percent">
                                                {percent}%
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="poll-footer">{totalVotes} votes total</p>
                    </div>
                </div>
            )
        }

        return (
            <div className="mb-4 mt-2">
                {baseContent}
            </div>
        );
    };

    const handleEngage = async (type: string) => {
        try {
            // Intercept 'share' to trigger the native share dialog or clipboard first
            if (type === 'share') {
                const shareUrl = `${window.location.origin}/post/${post._id}`;
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: `Post by @${post.author?.email?.split('@')[0] || 'User'}`,
                            text: 'Check out this post on Social App',
                            url: shareUrl,
                        });
                    } catch (err: any) {
                        // Don't register the engagement if the user aborted the share sheet
                        if (err.name !== 'AbortError') {
                            showError('Failed to open share dialog');
                        }
                        return;
                    }
                } else {
                    await navigator.clipboard.writeText(shareUrl);
                    success('Link copied to clipboard!');
                }
            }

            if (type === 'repost') {
                await repostPost(post._id);
                success('Post reposted successfully!');
            } else {
                await engageWithPost(post._id, type);
                if (type === 'share' && 'share' in navigator) success('Post shared successfully!');
            }

            // Optimistic update
            setCounts((prev: any) => ({
                ...prev,
                [`${type}s`]: prev[`${type}s`] + (type === 'like' ? (isLiked ? -1 : 1) : type === 'bookmark' ? (isBookmarked ? -1 : 1) : 1)
            }));

            if (type === 'like') setIsLiked(!isLiked);
            if (type === 'bookmark') setIsBookmarked(!isBookmarked);

        } catch (error: any) {
            showError(error.message || `Failed to ${type} post`);
        }
    };

    const handleDelete = async () => {
        try {
            await deletePost(post._id);
            success('Post deleted successfully');
            setIsDeleted(true);
        } catch (error: any) {
            showError(error.message || 'Failed to delete post');
            setShowDeleteConfirm(false);
        }
    };

    const handleUpdate = async () => {
        const plainTextContext = editPayload.content.replace(/<[^>]*>?/gm, '').trim();

        if (!plainTextContext && !editPayload.mediaUrl && !editPayload.poll?.question.trim()) {
            showError("Post content cannot be empty.");
            return;
        }

        try {
            const stringifiedContent = editPayload.mediaUrl
                ? `${editPayload.content}\n${editPayload.mediaUrl}`
                : editPayload.content;

            await updatePost(post._id, stringifiedContent);
            success('Post updated successfully');
            post.content = stringifiedContent; // Optimistically update local post object
            setIsEditing(false);
            setShowOptions(false);
        } catch (error: any) {
            showError(error.message || 'Failed to update post');
        }
    };

    if (isDeleted) return null; // Remove from UI seamlessly

    // Format date nicely
    const date = new Date(post.createdAt);
    const timeAgo = Math.floor((new Date().getTime() - date.getTime()) / 60000);
    const displayTime = timeAgo < 60 ? `${timeAgo}m` : timeAgo < 1440 ? `${Math.floor(timeAgo / 60)}h` : `${Math.floor(timeAgo / 1440)}d`;

    return (
        <div className="post-card group relative overflow-hidden">
            {/* Custom Delete Confirmation Overlay */}
            {showDeleteConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-icon-container">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <h3 className="modal-title">Delete Post</h3>
                        <p className="modal-text">
                            Are you sure you want to delete this post? This action cannot be undone.
                        </p>
                        <div className="modal-actions">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="btn btn-outline"
                                style={{ padding: '0.625rem 1.25rem', width: 'auto' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="btn btn-danger"
                                style={{ padding: '0.625rem 1.25rem', width: 'auto' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {post.type === 'repost' && (
                <div className="absolute -top-3 left-4 flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm z-10">
                    <Repeat2 size={12} /> Reposted
                </div>
            )}

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
                    <div className="post-avatar">
                        {post.author?.email ? post.author.email.charAt(0) : '?'}
                    </div>
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
                            {post.createdAt !== post.updatedAt && <span className="ml-1 text-[10px] italic">(edited)</span>}
                        </p>
                    </div>
                </div>

                {isAuthor && (
                    <div className="relative">
                        <button
                            className="post-options-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowOptions(!showOptions);
                            }}
                        >
                            <MoreHorizontal size={20} />
                        </button>

                        {/* Dropdown Menu */}
                        {showOptions && (
                            <div className="post-options-dropdown">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditing(true);
                                        setShowOptions(false);
                                    }}
                                    className="post-options-dropdown-item"
                                >
                                    <Edit2 size={16} />
                                    Edit Post
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteConfirm(true);
                                        setShowOptions(false);
                                    }}
                                    className="post-options-dropdown-item danger"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isEditing ? (
                <div className="mb-4 mt-2 px-1">
                    <div className="border border-indigo-200 dark:border-indigo-500/30 rounded-xl overflow-hidden bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                        <RichTextEditor
                            value={editPayload}
                            onChange={setEditPayload}
                            placeholder="Update your post..."
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                        <button
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 1.25rem', width: 'auto', fontSize: '0.875rem' }}
                            onClick={() => {
                                setIsEditing(false);
                                setEditPayload({ content: post.content });
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 1.25rem', width: 'auto', fontSize: '0.875rem' }}
                            onClick={handleUpdate}
                        >
                            Save Update
                        </button>
                    </div>
                </div>
            ) : (
                renderContent()
            )}

            <div className="post-actions">
                <button title="Comment" onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }} className={`post-action-btn comment ${showComments ? 'text-indigo-500' : ''}`}>
                    <div className={`post-action-icon ${showComments ? 'bg-indigo-500/10' : ''}`}>
                        <MessageSquare size={18} />
                    </div>
                    <span>{counts.comments || 0}</span>
                </button>

                <button title="Repost" onClick={(e) => { e.stopPropagation(); handleEngage('repost'); }} className="post-action-btn repost">
                    <div className="post-action-icon">
                        <Repeat2 size={18} />
                    </div>
                    <span>{counts.reposts || 0}</span>
                </button>

                <button title={isLiked ? "Unlike" : "Like"} onClick={(e) => { e.stopPropagation(); handleEngage('like'); }} className={`post-action-btn like ${isLiked ? 'active' : ''}`}>
                    <div className="post-action-icon">
                        <Heart size={18} className={isLiked ? "fill-current" : ""} />
                    </div>
                    <span>{counts.likes || 0}</span>
                </button>

                <button title={isBookmarked ? "Remove Bookmark" : "Bookmark"} onClick={(e) => { e.stopPropagation(); handleEngage('bookmark'); }} className={`post-action-btn bookmark ${isBookmarked ? 'active' : ''}`}>
                    <div className="post-action-icon">
                        <Bookmark size={18} className={isBookmarked ? "fill-current" : ""} />
                    </div>
                </button>

                <button title="Share Post" onClick={(e) => { e.stopPropagation(); handleEngage('share'); }} className="post-action-btn share">
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
