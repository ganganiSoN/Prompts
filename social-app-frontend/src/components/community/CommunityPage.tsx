import { useState, useEffect } from 'react';
import { Users, Search, MessageSquare, TrendingUp, Filter, Plus } from 'lucide-react';

// Mock data
import { useNavigate } from 'react-router-dom';
import { getCommunities, toggleJoinCommunity } from '../../api/community';
import { useAuth } from '../../context/AuthContext';

const CommunityPage = () => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [communities, setCommunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'members'>('newest');
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    const getSplitCommunities = () => {
        let joined: any[] = [];
        let suggested: any[] = [];

        if (communities && communities.length > 0) {
            communities.forEach(community => {
                const userIdStr = user?.id?.toString();
                const isMember: boolean = user && community.members?.some((member: any) => {
                    if (!member) return false;
                    const memberStr = typeof member === 'object' ? (member._id?.toString() || member.id?.toString()) : member.toString();
                    return memberStr === userIdStr;
                });

                if (isMember) {
                    joined.push(community);
                } else {
                    suggested.push(community);
                }
            });
        }

        const sortArray = (arr: any[]) => {
            if (sortBy === 'newest') {
                return [...arr].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            } else if (sortBy === 'oldest') {
                return [...arr].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            } else if (sortBy === 'members') {
                return [...arr].sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
            }
            return arr;
        };

        return {
            joined: sortArray(joined),
            suggested: sortArray(suggested)
        };
    };

    const { joined, suggested } = getSplitCommunities();

    const navigate = useNavigate();

    const fetchCommunities = async () => {
        try {
            setLoading(true);
            const data = await getCommunities(searchQuery);
            setCommunities(data);
            setError('');
        } catch (err: any) {
            setError(err.message || 'Error loading communities');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleJoin = async (e: React.MouseEvent, communityId: string) => {
        e.stopPropagation();
        try {
            const result = await toggleJoinCommunity(communityId);
            if (result && result.community) {
                setCommunities(prev => prev.map(c =>
                    (c._id === communityId || c.id === communityId) ? result.community : c
                ));
            }
        } catch (error) {
            console.error('Failed to toggle join status:', error);
        }
    };

    useEffect(() => {

        // Adding a basic debounce for search if needed
        const timeoutId = setTimeout(() => {
            fetchCommunities();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title m-0 flex items-center gap-2">
                        <Users size={28} style={{ color: 'var(--primary)' }} />
                        Communities
                    </h1>
                    <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Join groups to discuss topics you care about.</p>
                </div>
                <button
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => navigate('/community/create')}
                >
                    <Plus size={18} />
                    Create Community
                </button>
            </header>

            <div className="glass-card mb-6" style={{ padding: '1rem' }}>
                <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
                    <div className="input-group" style={{ flex: 1, minWidth: '250px', marginBottom: 0 }}>
                        <Search size={18} className="input-icon" style={{ top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="Find communities..."
                            className="input-field"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <button
                            className="btn btn-outline"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem' }}
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                        >
                            <Filter size={18} />
                            {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : 'Most Members'}
                        </button>

                        {showFilterMenu && (
                            <div className="glass-card" style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '0.5rem',
                                padding: '0.5rem',
                                minWidth: '150px',
                                zIndex: 10,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                            }}>
                                <button
                                    style={{ background: sortBy === 'newest' ? 'var(--input-focus)' : 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.5rem 1rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer' }}
                                    onClick={() => { setSortBy('newest'); setShowFilterMenu(false); }}
                                >
                                    Newest First
                                </button>
                                <button
                                    style={{ background: sortBy === 'oldest' ? 'var(--input-focus)' : 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.5rem 1rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer' }}
                                    onClick={() => { setSortBy('oldest'); setShowFilterMenu(false); }}
                                >
                                    Oldest First
                                </button>
                                <button
                                    style={{ background: sortBy === 'members' ? 'var(--input-focus)' : 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.5rem 1rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer' }}
                                    onClick={() => { setSortBy('members'); setShowFilterMenu(false); }}
                                >
                                    Most Members
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading communities...</div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>{error}</div>
            ) : (
                <>
                    {/* Joined Communities Section */}
                    {joined.length > 0 && (
                        <div className="mb-8">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: 'var(--primary)' }}>•</span> Your Communities
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                {joined.map((community: any) => (
                                    <CommunityCard
                                        key={community.id || community._id}
                                        community={community}
                                        user={user}
                                        navigate={navigate}
                                        handleToggleJoin={handleToggleJoin}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Suggested Communities Section */}
                    {suggested.length > 0 && (
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: 'var(--primary)' }}>•</span> Discover Communities
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                {suggested.map((community: any) => (
                                    <CommunityCard
                                        key={community.id || community._id}
                                        community={community}
                                        user={user}
                                        navigate={navigate}
                                        handleToggleJoin={handleToggleJoin}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {!loading && communities.length === 0 && (
                        <div className="glass-card flex flex-col items-center justify-center p-8" style={{ textAlign: 'center' }}>
                            <MessageSquare size={48} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '1rem' }} />
                            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>No communities found</h3>
                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Create one to get started!</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// Extracted CommunityCard for cleaner code
const CommunityCard = ({ community, user, navigate, handleToggleJoin }: any) => {
    // Shared member check logic
    const userIdStr = user?._id?.toString() || user?.id?.toString();

    // Initialize local state for instant UI feedback
    const [isJoined, setIsJoined] = useState<boolean>(() => {
        return user && community.members?.some((member: any) => {
            if (!member) return false;
            const memberStr = typeof member === 'object' ? (member._id?.toString() || member.id?.toString()) : member.toString();
            return memberStr === userIdStr;
        });
    });

    const [memberCount, setMemberCount] = useState<number>(community.memberCount || 0);

    const onToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();

        // Optimistic Update
        setIsJoined(!isJoined);
        setMemberCount(prev => Math.max(0, isJoined ? prev - 1 : prev + 1));

        // Parent API call (CommunityPage level handler)
        await handleToggleJoin(e, community._id || community.id);
    };

    return (
        <div
            className="glass-card"
            style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', transition: 'transform 0.2s', cursor: 'pointer' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            onClick={() => navigate(`/community/${community._id}`)}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="avatar large" style={{ background: 'var(--surface-highlight)', color: 'var(--primary)', fontWeight: 'bold' }}>
                    {community.name.substring(0, 2).toUpperCase()}
                </div>
                {community.trending && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 8px', borderRadius: '12px', fontWeight: 600 }}>
                        <TrendingUp size={12} />
                        Hot
                    </div>
                )}
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                {community.name}
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5', margin: '0 0 1rem 0', flexGrow: 1 }}>
                {community.description}
            </p>

            <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
                {community.tags?.map((tag: string) => (
                    <span key={tag} style={{ background: 'var(--surface-active)', color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px' }}>
                        {tag}
                    </span>
                ))}
            </div>

            <div className="divider" style={{ margin: '1rem 0' }}></div>

            <div className="flex justify-between items-center" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <div className="flex items-center gap-2">
                    <Users size={16} />
                    {memberCount}
                </div>

                {user && (
                    <div className="flex gap-2">
                        <button
                            className={`btn ${isJoined ? 'btn-outline' : 'btn-primary'} w-full`}
                            style={{
                                padding: '0.5rem 1rem', fontSize: '0.875rem', height: 'auto',
                                ...(isJoined ? { color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' } : {})
                            }}
                            onClick={onToggle}
                        >
                            {isJoined ? 'Leave Community' : 'Join'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunityPage;

