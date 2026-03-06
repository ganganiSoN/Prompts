import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold, Italic, List, Link as LinkIcon, Heading2, Underline as UnderlineIcon,
    Image as ImageIcon, Video as VideoIcon, BarChart2, Calendar, X, Plus
} from 'lucide-react';

export interface PostPayload {
    content: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    poll?: {
        question: string;
        options: { text: string; votes: number }[];
    };
    scheduledFor?: string;
    isThread?: boolean;
}

interface RichTextEditorProps {
    value: PostPayload;
    onChange: (payload: PostPayload) => void;
    placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
    const [showMediaInput, setShowMediaInput] = useState(false);
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            LinkExtension.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-purple-500 underline underline-offset-2',
                },
            }),
            Placeholder.configure({
                placeholder: placeholder || "What's on your mind?",
                emptyEditorClass: 'is-editor-empty',
            }),
        ],
        content: value.content || '',
        onUpdate: ({ editor }) => {
            onChange({ ...value, content: editor.getHTML() });
        },
        editorProps: {
            attributes: {
                class: 'rich-editor',
            },
        },
    });

    useEffect(() => {
        if (editor && value.content !== editor.getHTML()) {
            // Avoid resetting cursor position when user types by checking focus
            if (!editor.isFocused) {
                editor.commands.setContent(value.content || '');
            }
        }
    }, [value.content, editor]);

    const addLink = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const handleMediaClick = (type: 'image' | 'video') => {
        setMediaType(type);
        setShowMediaInput(true);
    };

    const updatePollOption = (index: number, text: string) => {
        if (!value.poll) return;
        const newOptions = [...value.poll.options];
        newOptions[index] = { ...newOptions[index], text };
        onChange({ ...value, poll: { ...value.poll, options: newOptions } });
    };

    const addPollOption = () => {
        if (!value.poll || value.poll.options.length >= 4) return;
        onChange({
            ...value,
            poll: { ...value.poll, options: [...value.poll.options, { text: '', votes: 0 }] }
        });
    };

    const removePoll = () => {
        const { poll, ...rest } = value;
        onChange(rest);
    };

    const removeMedia = () => {
        const { mediaUrl, mediaType, ...rest } = value;
        setShowMediaInput(false);
        onChange(rest);
    };

    return (
        <div className="w-full relative group">
            {/* Editor Container with premium glassmorphism flair */}
            <div className="rich-editor-container group/editor shadow-sm hover:shadow-md">

                {/* Tiptap Editor Content Area */}
                <div className="flex-1 w-full px-2 pt-2 pb-0 cursor-text" onClick={() => editor?.commands.focus()}>
                    <EditorContent editor={editor} className="w-full" />
                </div>

                {/* --- Dynamic Blocks Area --- */}
                <div className="px-5 pb-2">
                    {/* Media Block Preview */}
                    {showMediaInput && (
                        <div className="relative mt-2 p-1 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 backdrop-blur-md animate-fade-in group/media">
                            <button
                                onClick={removeMedia}
                                className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors z-10 opacity-0 group-hover/media:opacity-100"
                            >
                                <X size={14} />
                            </button>

                            {!value.mediaUrl ? (
                                <div className="p-3">
                                    <input
                                        type="url"
                                        placeholder={`Paste ${mediaType} URL here...`}
                                        className="w-full bg-transparent border-none outline-none text-blue-500 dark:text-blue-400 placeholder-blue-300 dark:placeholder-blue-800/50 text-sm font-medium"
                                        autoFocus
                                        onChange={(e) => onChange({ ...value, mediaUrl: e.target.value, mediaType })}
                                    />
                                </div>
                            ) : (
                                <div className="relative rounded-lg overflow-hidden max-h-[300px] bg-gray-100 dark:bg-gray-900">
                                    {mediaType === 'image' ? (
                                        <img src={value.mediaUrl} alt="Preview" className="w-full object-cover" />
                                    ) : (
                                        <div className="w-full h-32 flex items-center justify-center text-gray-500">
                                            <VideoIcon size={32} />
                                            <span className="ml-2 font-medium">Video Link Attached</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Poll Block */}
                    {value.poll && (
                        <div className="poll-creator-container">
                            <button onClick={removePoll} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                                <X size={16} />
                            </button>
                            <h4 className="poll-creator-header">
                                <BarChart2 size={16} /> Create Poll
                            </h4>
                            <input
                                type="text"
                                placeholder="Ask a question..."
                                value={value.poll.question}
                                onChange={(e) => onChange({ ...value, poll: { ...value.poll!, question: e.target.value } })}
                                className="poll-creator-input"
                            />
                            <div className="space-y-2">
                                {value.poll.options.map((opt, i) => (
                                    <div key={i} className="poll-option-row">
                                        <div className="poll-option-letter">
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder={`Option ${i + 1}`}
                                            value={opt.text}
                                            onChange={(e) => updatePollOption(i, e.target.value)}
                                            className="poll-creator-input !mb-0"
                                        />
                                    </div>
                                ))}
                            </div>
                            {value.poll.options.length < 4 && (
                                <button
                                    onClick={addPollOption}
                                    className="poll-add-btn"
                                >
                                    <Plus size={14} /> Add Option
                                </button>
                            )}
                        </div>
                    )}

                    {/* Schedule Block Indicator */}
                    {value.scheduledFor && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium border border-blue-100 dark:border-blue-800/30 animate-fade-in">
                            <Calendar size={12} />
                            Scheduled for: {new Date(value.scheduledFor).toLocaleString()}
                            <button onClick={() => { const { scheduledFor, ...rest } = value; onChange(rest); }} className="ml-1 hover:text-blue-800 dark:hover:text-blue-200"><X size={12} /></button>
                        </div>
                    )}
                </div>

                {/* --- Bottom Toolbar --- */}
                <div className="rich-editor-toolbar">
                    {/* Text Formatting Tools using Tiptap Commands */}
                    <div className="rich-editor-toolbar-group">
                        <button
                            type="button"
                            onClick={() => editor?.chain().focus().toggleBold().run()}
                            disabled={!editor?.can().chain().focus().toggleBold().run()}
                            className={`rich-editor-btn ${editor?.isActive('bold') ? 'active' : ''}`}
                            title="Bold"
                        >
                            <Bold size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => editor?.chain().focus().toggleItalic().run()}
                            disabled={!editor?.can().chain().focus().toggleItalic().run()}
                            className={`rich-editor-btn ${editor?.isActive('italic') ? 'active' : ''}`}
                            title="Italic"
                        >
                            <Italic size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => editor?.chain().focus().toggleUnderline().run()}
                            disabled={!editor?.can().chain().focus().toggleUnderline().run()}
                            className={`rich-editor-btn ${editor?.isActive('underline') ? 'active' : ''}`}
                            title="Underline"
                        >
                            <UnderlineIcon size={16} />
                        </button>
                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1" />
                        <button
                            type="button"
                            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                            className={`rich-editor-btn ${editor?.isActive('heading', { level: 3 }) ? 'active' : ''}`}
                            title="Heading"
                        >
                            <Heading2 size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => editor?.chain().focus().toggleBulletList().run()}
                            className={`rich-editor-btn ${editor?.isActive('bulletList') ? 'active' : ''}`}
                            title="Bullet List"
                        >
                            <List size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={addLink}
                            className={`rich-editor-btn ${editor?.isActive('link') ? 'active' : ''}`}
                            title="Link"
                        >
                            <LinkIcon size={16} />
                        </button>
                    </div>

                    {/* Rich Media Block Tools */}
                    <div className="rich-editor-toolbar-group">
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mr-2 hidden sm:block">Add to Post</p>
                        <button
                            type="button"
                            onClick={() => handleMediaClick('image')}
                            className="rich-editor-btn premium hover:scale-105 active:scale-95"
                            title="Image"
                        >
                            <ImageIcon size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleMediaClick('video')}
                            className="rich-editor-btn premium hover:scale-105 active:scale-95"
                            title="Video URL"
                        >
                            <VideoIcon size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (!value.poll) {
                                    onChange({ ...value, poll: { question: '', options: [{ text: '', votes: 0 }, { text: '', votes: 0 }] } });
                                }
                            }}
                            className={`rich-editor-btn ${value.poll ? 'active' : 'premium'} hover:scale-105 active:scale-95`}
                            title="Poll"
                        >
                            <BarChart2 size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                // Simplified Mock Scheduler toggle
                                const fakeDate = new Date();
                                fakeDate.setHours(fakeDate.getHours() + 24);
                                onChange({ ...value, scheduledFor: fakeDate.toISOString() });
                            }}
                            className={`rich-editor-btn ${value.scheduledFor ? 'active' : 'premium'} hover:scale-105 active:scale-95`}
                            title="Schedule"
                        >
                            <Calendar size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Injected Styles specifically for the empty editor placeholder and cursor */}
            <style>{`
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: #94a3b8;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                .ProseMirror {
                     outline: none !important;
                     caret-color: #8b5cf6;
                     min-height: inherit;
                }
                .ProseMirror p {
                     margin-top: 0.5em;
                     margin-bottom: 0.5em;
                }
            `}</style>
        </div>
    );
};
