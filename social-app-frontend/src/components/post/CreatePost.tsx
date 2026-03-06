import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { createPost } from '../../api/posts';
import { useToast } from '../../context/ToastContext';
import { RichTextEditor } from './RichTextEditor';
import type { PostPayload } from './RichTextEditor';

interface CreatePostProps {
    onPostCreated: (post: any) => void;
    defaultCommunity?: string;
}

export const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated, defaultCommunity }) => {
    const [payload, setPayload] = useState<PostPayload>({ content: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [community, setCommunity] = useState(defaultCommunity || '');
    const { success, error: showError } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const plainTextContext = payload.content.replace(/<[^>]*>?/gm, '').trim();

        // Validation: must have at least text, media, or a poll question
        if (!plainTextContext && !payload.mediaUrl && !payload.poll?.question.trim()) {
            return;
        }

        if (payload.poll) {
            if (!payload.poll.question.trim()) {
                showError('Poll question cannot be empty.');
                return;
            }
            const validOptions = payload.poll.options.filter(opt => opt.text.trim().length > 0);
            if (validOptions.length < 2) {
                showError('A poll must have at least two valid options.');
                return;
            }
            // Assign validated options back to the payload before submitting
            payload.poll.options = validOptions;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Transform rich payload to backend format
            // If they added a poll block, type is poll. If media, type is media format etc.
            let resolvedType = 'text';
            if (payload.poll && payload.poll.question) resolvedType = 'poll';
            else if (payload.mediaUrl) resolvedType = payload.mediaType || 'image';

            const stringifiedContent = payload.mediaUrl
                ? `${payload.content}\n${payload.mediaUrl}` // appending just to match previous backend logic for this iteration
                : payload.content;

            const backendPostData = {
                type: resolvedType.toLowerCase(),
                content: stringifiedContent,
                poll: payload.poll?.question ? payload.poll : undefined,
                community: defaultCommunity || community || 'General',
                isScheduled: !!payload.scheduledFor,
                scheduledFor: payload.scheduledFor
            };

            const newPost = await createPost(backendPostData);

            // Reset
            setPayload({ content: '' });
            setCommunity(defaultCommunity || '');
            success(backendPostData.isScheduled ? 'Post scheduled successfully!' : 'Post published successfully!');
            onPostCreated(newPost);
        } catch (err: any) {
            setError(err.message);
            showError(err.message || 'Failed to publish post');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mb-12">
            <form onSubmit={handleSubmit} className="relative pb-4">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex-shrink-0 shadow-lg shadow-purple-500/20" />
                    <div className="flex-1 w-full min-w-0">
                        {/* The Beautiful Rich Text Editor */}
                        <RichTextEditor
                            value={payload}
                            onChange={setPayload}
                            placeholder="What's sparking your mind today?"
                        />

                        {error && (
                            <div className="mt-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800/30">
                                {error}
                            </div>
                        )}

                        {/* Submission Row */}
                        <div className="flex justify-between items-center mt-6 pl-1 mb-2">

                            {!defaultCommunity ? (
                                <select
                                    className="post-action-select"
                                    value={community}
                                    onChange={(e) => setCommunity(e.target.value)}
                                >
                                    <option value="">🌐 General Feed</option>
                                    <option value="Finance">📈 Finance</option>
                                    <option value="Tech">💻 Tech</option>
                                    <option value="Gaming">🎮 Gaming</option>
                                </select>
                            ) : (
                                <div>{/* Spacer */}</div>
                            )}


                            <button
                                type="submit"
                                disabled={isSubmitting || (!payload.content.replace(/<[^>]*>?/gm, '').trim() && !payload.mediaUrl && !payload.poll?.question)}
                                className="post-publish-btn"
                            >
                                {isSubmitting ? 'Publishing...' : 'Publish'}
                                <Send size={16} className={isSubmitting ? "animate-pulse" : ""} />
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};
