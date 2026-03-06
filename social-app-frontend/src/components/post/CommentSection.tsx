import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { engageWithPost, getPostComments } from '../../api/posts';
import { CommentItem, type CommentType } from './CommentItem';
import { MessageSquare, Loader2 } from 'lucide-react';

interface CommentSectionProps {
    postId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<CommentType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchComments = async () => {
        try {
            const data = await getPostComments(postId);
            setComments(data);
        } catch (error) {
            console.error('Failed to load comments', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await engageWithPost(postId, 'comment', newComment);
            setNewComment('');
            fetchComments(); // Refresh board
        } catch (error) {
            console.error('Failed to post comment', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="comment-section">
            <h3 className="comment-section-header">
                <MessageSquare size={18} />
                Comments
            </h3>

            {/* Root Comment Input */}
            {user ? (
                <form onSubmit={handleSubmit} className="comment-input-area">
                    <div className="comment-avatar">
                        {user.email?.split('@')[0].charAt(0).toUpperCase() || 'U'}
                    </div>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="comment-textarea"
                    />
                    <div className="comment-submit-row">
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmitting}
                            className="comment-submit-btn"
                        >
                            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                            Comment
                        </button>
                    </div>
                </form>
            ) : (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500">Sign in to leave a comment.</p>
                </div>
            )}

            {/* Comment Thread List */}
            {isLoading ? (
                <div className="comment-loading">
                    <Loader2 size={24} className="comment-spinner" />
                </div>
            ) : comments.length > 0 ? (
                <div className="comment-list">
                    {comments.map(comment => (
                        <CommentItem
                            key={comment._id}
                            comment={comment}
                            postId={postId}
                            onReplySubmitted={fetchComments}
                        />
                    ))}
                </div>
            ) : (
                <div className="comment-empty">
                    No comments yet. Be the first to share your thoughts!
                </div>
            )}
        </div>
    );
};
