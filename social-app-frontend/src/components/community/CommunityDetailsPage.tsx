import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Shield, MessageSquare, Loader2, X } from 'lucide-react';
import { getCommunityById, toggleJoinCommunity } from '../../api/community';
import { useAuth } from '../../context/AuthContext';
import { getFeed } from '../../api/posts';
import { CreatePost } from '../post/CreatePost';
import { PostCard } from '../post/PostCard';

const CommunityDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'feed' | 'policies'>('feed');
    const [community, setCommunity] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [posts, setPosts] = useState<any[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isJoined, setIsJoined] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);

    useEffect(() => {
        const fetchCommunity = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await getCommunityById(id);
                setCommunity(data);

                // Initialize joined state
                if (user && data.members) {
                    const userIdStr = (user as any)?._id?.toString() || user?.id?.toString();
                    const memberMatch = data.members.some((member: any) => {
                        if (!member) return false;
                        const memberStr = typeof member === 'object' ? (member._id?.toString() || member.id?.toString()) : member.toString();
                        return memberStr === userIdStr;
                    });
                    setIsJoined(memberMatch);
                }
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

        const willJoin = !isJoined;
        setIsJoined(willJoin);

        let newMembers = [...(community.members || [])];
        const userIdStr = (user as any)?._id?.toString() || user?.id?.toString();

        if (willJoin) {
            if (!newMembers.some(m => (m._id || m.id)?.toString() === userIdStr)) {
                newMembers.push({
                    _id: (user as any)?._id || user?.id,
                    name: user?.name,
                    username: (user as any)?.username,
                    avatar: (user as any)?.avatar
                });
            }
        } else {
            newMembers = newMembers.filter((m: any) => {
                if (!m) return false;
                const mId = typeof m === 'object' ? (m._id?.toString() || m.id?.toString()) : m.toString();
                return mId !== userIdStr;
            });
        }

        // Optimistic UI update
        setCommunity((prev: any) => ({
            ...prev,
            members: newMembers,
            memberCount: Math.max(0, willJoin ? (prev.memberCount + 1) : (prev.memberCount - 1))
        }));

        try {
            const result = await toggleJoinCommunity(community._id);
            if (result) {
                setIsJoined(result.isMember);
                if (result.community) {
                    setCommunity((prev: any) => ({ ...prev, memberCount: result.community.memberCount }));
                }
            }
        } catch (error) {
            console.error('Failed to toggle join status:', error);
            // Revert on error
            setIsJoined(!isJoined);
        }
    };

    const fetchPosts = async (pageNum: number, commName: string) => {
        try {
            setLoadingPosts(true);
            const data = await getFeed(pageNum, 10, commName);
            setPosts(prev => {
                if (pageNum === 1) return data;
                const existingIds = new Set(prev.map(p => p._id));
                const newPosts = data.filter((p: any) => !existingIds.has(p._id));
                return [...prev, ...newPosts];
            });
            setHasMore(data.length === 10);
        } catch (error) {
            console.error('Failed to fetch community posts:', error);
        } finally {
            setLoadingPosts(false);
        }
    };

    useEffect(() => {
        if (community?.name) {
            fetchPosts(page, community.name);
        }
    }, [page, community?.name]);

    const handlePostCreated = (newPost: any) => {
        setPosts(prev => [newPost, ...prev]);
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
                    <div className="avatar large" style={{ background: 'var(--surface-highlight)', color: 'var(--primary)', fontWeight: 'bold', width: '60px', height: '60px', fontSize: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                        {community.coverImage ? (
                            <img src={community.coverImage} alt={community.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            community.name.substring(0, 2).toUpperCase()
                        )}
                    </div>
                    <div>
                        <h1 className="page-title m-0" style={{ fontSize: '1.75rem' }}>{community.name}</h1>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <div
                        className="flex items-center gap-2"
                        style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', transition: 'background 0.2s' }}
                        onClick={() => setShowMembersModal(true)}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-active)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <Users size={18} />
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{community.memberCount || 0}</span> members
                    </div>
                    {user && (
                        isJoined ? (
                            <button
                                className="btn btn-outline"
                                style={{ padding: '0.625rem 1.5rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                onClick={handleToggleJoin}
                            >
                                Leave Community
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
                        {user && isJoined ? (
                            <CreatePost defaultCommunity={community.name} onPostCreated={handlePostCreated} />
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
                        {posts.length === 0 && !loadingPosts ? (
                            <div className="text-center p-8 glass-card">
                                <p style={{ color: 'var(--text-muted)' }}>No posts in this community yet.</p>
                            </div>
                        ) : (
                            posts.map(post => (
                                <PostCard key={post._id} post={post} />
                            ))
                        )}

                        {loadingPosts && (
                            <div className="flex justify-center p-4">
                                <Loader2 className="animate-spin text-blue-500" size={24} />
                            </div>
                        )}

                        {hasMore && posts.length > 0 && !loadingPosts && (
                            <div className="flex justify-center mt-4 mb-4">
                                <button className="btn btn-outline" onClick={() => setPage(p => p + 1)}>
                                    Load More
                                </button>
                            </div>
                        )}
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

            {showMembersModal && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setShowMembersModal(false)}
                >
                    <div
                        className="glass-card"
                        style={{ width: '90%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Community Members</h2>
                            <button className="icon-btn" onClick={() => setShowMembersModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                            {community.members && community.members.length > 0 ? (
                                community.members.map((m: any, idx: number) => {
                                    if (!m || typeof m !== 'object') return null;
                                    return (
                                        <div
                                            key={m._id || m.id || idx}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s ease', cursor: 'pointer' }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                                                e.currentTarget.style.transform = 'none';
                                            }}
                                        >
                                            <div className="avatar" style={{ width: '42px', height: '42px', background: 'var(--surface-highlight)', color: 'var(--primary)', fontWeight: 'bold', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {m.avatar ? (
                                                    <img src={m.avatar} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    (m.name || m.username || 'U').substring(0, 2).toUpperCase()
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                <span style={{ fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name || m.username || 'Unknown User'}</span>
                                                {m.username && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{m.username}</span>}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No members found.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityDetailsPage;


