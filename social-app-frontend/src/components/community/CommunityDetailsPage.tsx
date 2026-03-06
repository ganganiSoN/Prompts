import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Shield, MessageSquare } from 'lucide-react';
import { getCommunityById, toggleJoinCommunity } from '../../api/community';
import { useAuth } from '../../context/AuthContext';

// Mock feed for community
const mockCommunityFeed = [
    { id: 1, author: 'Alice Smith', content: 'Just joined this community! Excited to learn from everyone here.', time: '2h ago', likes: 14, comments: 3 },
    { id: 2, author: 'Bob Jones', content: 'Does anyone have good resources on state management best practices?', time: '5h ago', likes: 8, comments: 12 },
    { id: 3, author: 'Charlie Brown', content: 'We are hosting a community meetup next week. Check the pinned post for details!', time: '1d ago', likes: 45, comments: 7 }
];

const CommunityDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'feed' | 'policies'>('feed');
    const [community, setCommunity] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCommunity = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await getCommunityById(id);
                setCommunity(data);
            } catch (err) {
                console.error("Failed to fetch community:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCommunity();
    }, [id]);

    const handleToggleJoin = async () => {
        if (!community || !community._id) return;
        try {
            await toggleJoinCommunity(community._id);
            // Re-fetch community to update state
            const data = await getCommunityById(id as string);
            setCommunity(data);
        } catch (error) {
            console.error('Failed to toggle join status:', error);
        }
    };

    if (loading) {
        return <div className="page-container flex justify-center items-center h-full">Loading...</div>;
    }

    if (!community) {
        return (
            <div className="page-container flex flex-col items-center justify-center h-full">
                <h2 className="text-2xl font-bold mb-4">Community not found</h2>
                <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => navigate('/community')}>
                    <ArrowLeft size={18} /> Back to Communities
                </button>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            {/* Header section */}
            <header className="mb-6 flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/community')} className="icon-btn" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className="avatar large" style={{ background: 'var(--surface-highlight)', color: 'var(--primary)', fontWeight: 'bold', width: '60px', height: '60px', fontSize: '1.5rem' }}>
                        {community.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="page-title m-0" style={{ fontSize: '1.75rem' }}>{community.name}</h1>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                        <Users size={18} />
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{community.memberCount || 0}</span> members
                    </div>
                    {user && (
                        community.members?.some((member: any) =>
                            (typeof member === 'object' && member._id === user.id) ||
                            member === user.id
                        ) ? (
                            <button
                                className="btn btn-outline"
                                style={{ padding: '0.625rem 1.5rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                                onClick={handleToggleJoin}
                            >
                                Joined
                            </button>
                        ) : (
                            <button
                                className="btn btn-primary"
                                style={{ padding: '0.625rem 1.5rem' }}
                                onClick={handleToggleJoin}
                            >
                                Join Community
                            </button>
                        )
                    )}
                </div>
            </header>

            {/* Description card */}
            <div className="glass-card mb-6" style={{ padding: '1.5rem' }}>
                <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem' }}>{community.description}</p>
                <div className="flex gap-2 mt-4">
                    {community.tags?.map((tag: string) => (
                        <span key={tag} style={{ background: 'var(--input-bg)', color: 'var(--primary)', fontSize: '0.75rem', padding: '4px 12px', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <button
                    onClick={() => setActiveTab('feed')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: activeTab === 'feed' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: activeTab === 'feed' ? 600 : 500,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        position: 'relative',
                        padding: '0.5rem'
                    }}
                >
                    <MessageSquare size={18} />
                    Community Feed
                    {activeTab === 'feed' && (
                        <div style={{ position: 'absolute', bottom: '-17px', left: 0, right: 0, height: '2px', background: 'var(--primary)', borderRadius: '2px' }}></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('policies')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: activeTab === 'policies' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: activeTab === 'policies' ? 600 : 500,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        position: 'relative',
                        padding: '0.5rem'
                    }}
                >
                    <Shield size={18} />
                    Moderation Policies
                    {activeTab === 'policies' && (
                        <div style={{ position: 'absolute', bottom: '-17px', left: 0, right: 0, height: '2px', background: 'var(--primary)', borderRadius: '2px' }}></div>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'feed' ? (
                <div className="feed-content">
                    {/* Composer */}
                    <div className="glass-card mb-6" style={{ padding: '1.5rem' }}>
                        {user && community.members?.some((member: any) =>
                            (typeof member === 'object' && member._id === user.id) ||
                            member === user.id
                        ) ? (
                            <div className="flex gap-4">
                                <div className="avatar" style={{ flexShrink: 0 }}>
                                    {user.name ? user.name.substring(0, 2).toUpperCase() : 'ME'}
                                </div>
                                <div style={{ flexGrow: 1 }}>
                                    <textarea
                                        className="input-field mb-4"
                                        placeholder="Share something with the community..."
                                        rows={3}
                                        style={{ width: '100%', resize: 'none' }}
                                    ></textarea>
                                    <div className="flex justify-end">
                                        <button className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', width: 'auto' }}>Post</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-4">
                                <MessageSquare size={32} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
                                <p style={{ color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
                                    Join this community to start posting and interacting with others.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        {mockCommunityFeed.map(post => (
                            <div key={post.id} className="glass-card" style={{ padding: '1.5rem' }}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="avatar">{post.author.charAt(0)}</div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{post.author}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{post.time}</div>
                                    </div>
                                </div>
                                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>{post.content}</p>
                                <div className="divider" style={{ margin: '1rem 0' }}></div>
                                <div className="flex gap-4" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    <span style={{ cursor: 'pointer' }}>❤️ {post.likes} Likes</span>
                                    <span style={{ cursor: 'pointer' }}>💬 {post.comments} Comments</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="policies-content glass-card" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Shield style={{ color: 'var(--primary)' }} />
                        Community Rules
                    </h2>

                    <div className="flex flex-col gap-6">
                        <div>
                            <h3 style={{ fontSize: '1.125rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>1. Be Respectful</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Treat everyone with respect. Harassment, hate speech, and personal attacks will not be tolerated and may result in an immediate ban.</p>
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.125rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>2. Stay On Topic</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Ensure your posts and comments are relevant to the community's subject matter. Off-topic posts may be removed by moderators.</p>
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.125rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>3. No Spam or Self-Promotion</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Do not post unsolicited advertisements, links to your own content (unless relevant to a discussion), or repetitive messages.</p>
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.125rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>4. High-Quality Contributions</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Put effort into your posts. Low-effort content, memes (unless allowed on specific days), and vague questions should be avoided.</p>
                        </div>
                    </div>

                    <div className="divider" style={{ margin: '2rem 0' }}></div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '0.75rem', color: '#fca5a5', fontSize: '0.875rem' }}>
                        <strong>Note:</strong> Moderators reserve the right to remove any content or revoke membership for users who violate these guidelines.
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityDetailsPage;

