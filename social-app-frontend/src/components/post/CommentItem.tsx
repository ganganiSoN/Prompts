import React, { useState } from 'react';
import { MessageSquare, Heart, CornerDownRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { engageWithPost } from '../../api/posts';

export interface CommentType {
    _id: string;
    content: string;
    createdAt: string;
    user: {
        _id: string;
        email: string; // Or name based on backend population
    };
    likesCount: number;
    isLikedByMe: boolean;
    replies?: CommentType[];
}

interface CommentItemProps {
    comment: CommentType;
    postId: string;
    depth?: number;
    onReplySubmitted: () => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, postId, depth = 0, onReplySubmitted }) => {
    const { user } = useAuth();
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Optimistic UI states
    const [likesCount, setLikesCount] = useState(comment.likesCount || 0);
    const [isLiked, setIsLiked] = useState(comment.isLikedByMe || false);

    const isMaxDepth = depth >= 6; // Limit visual indentation to prevent squishing

    const handleLike = async () => {
        if (!user) return;

        // Optimistic update
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
            await engageWithPost(postId, 'comment_like', undefined, comment._id);
        } catch (error) {
            // Revert on error
            setIsLiked(isLiked);
            setLikesCount(comment.likesCount);
            console.error('Failed to like comment', error);
        }
    };

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim() || !user || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await engageWithPost(postId, 'comment', replyContent, comment._id);
            setIsReplying(false);
            setReplyContent('');
            onReplySubmitted(); // Trigger parent refresh
        } catch (error) {
            console.error('Failed to submit reply', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getEmailPrefix = (email: string) => email.split('@')[0];
    const timeAgo = new Date(comment.createdAt).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className={`comment-item ${depth > 0 ? 'comment-item-reply' : ''}`}>
            <div className="comment-item-layout">
                {/* Thread Line Connector */}
                {depth > 0 && !isMaxDepth && (
                    <div className="comment-thread-line" />
                )}

                {/* Avatar */}
                <div className="comment-avatar">
                    {getEmailPrefix(comment.user.email).charAt(0).toUpperCase()}
                </div>

                {/* Comment Body */}
                <div className="comment-item-content">
                    <div className="comment-item-body">
                        <div className="comment-item-header">
                            <span className="comment-item-name">
                                {getEmailPrefix(comment.user.email)}
                            </span>
                            <span className="comment-item-time">
                                {timeAgo}
                            </span>
                        </div>
                        <p className="comment-item-text">
                            {comment.content}
                        </p>
                    </div>

                    {/* Action Bar */}
                    <div className="comment-item-actions">
                        <button
                            onClick={handleLike}
                            className={`comment-action-btn ${isLiked ? 'liked' : ''}`}
                        >
                            <Heart size={14} className={isLiked ? 'fill-current' : ''} />
                            {likesCount > 0 && <span>{likesCount}</span>}
                        </button>

                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="comment-action-btn"
                        >
                            <MessageSquare size={14} />
                            Reply
                        </button>
                    </div>

                    {/* Reply Input Box */}
                    {isReplying && (
                        <form onSubmit={handleReplySubmit} className="comment-reply-form relative">
                            <CornerDownRight size={16} className="text-gray-500 mt-2 flex-shrink-0" />
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="comment-reply-input"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!replyContent.trim() || isSubmitting}
                                    className="comment-reply-submit"
                                >
                                    {isSubmitting ? '...' : 'Send'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Render Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className={`comment-replies-container ${isMaxDepth ? 'max-depth' : ''}`}>
                            {comment.replies?.map(reply => (
                                <CommentItem
                                    key={reply._id}
                                    comment={reply}
                                    postId={postId}
                                    depth={depth + 1}
                                    onReplySubmitted={onReplySubmitted}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
