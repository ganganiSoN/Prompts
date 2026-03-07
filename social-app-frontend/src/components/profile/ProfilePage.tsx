import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Edit2, Users, UserCheck, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getProfile, getUserById, followUser, getUserPosts, getUserBookmarks } from '../../api/users';
import { FollowListModal } from './FollowListModal';
import { PostCard } from '../post/PostCard';

const ProfilePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const { success, error: showError } = useToast();

    // Determine if we are viewing our own profile
    const isOwnProfile = !id || id === authUser?.id;

    const [user, setUser] = useState<any>(isOwnProfile ? authUser : null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [followModalOpen, setFollowModalOpen] = useState(false);
    const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');
    const [isFollowing, setIsFollowing] = useState(false); // Can be populated if backend supports it

    const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks'>('posts');
    const [posts, setPosts] = useState<any[]>([]);
    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [postsPage, setPostsPage] = useState(1);
    const [bookmarksPage, setBookmarksPage] = useState(1);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [hasMoreBookmarks, setHasMoreBookmarks] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [loadingBookmarks, setLoadingBookmarks] = useState(false);

    const observer = useRef<IntersectionObserver | null>(null);

    const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loadingPosts) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMorePosts) {
                setPostsPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loadingPosts, hasMorePosts]);

    const lastBookmarkElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loadingBookmarks) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMoreBookmarks) {
                setBookmarksPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loadingBookmarks, hasMoreBookmarks]);

    useEffect(() => {
        if (!user?._id) return;
        const fetchPosts = async () => {
            try {
                setLoadingPosts(true);
                const data = await getUserPosts(user._id, postsPage, 10);
                setPosts(prev => {
                    const newPosts = [...prev];
                    data.forEach((p: any) => {
                        if (!newPosts.find(existing => existing._id === p._id)) {
                            newPosts.push(p);
                        }
                    });
                    return newPosts;
                });
                setHasMorePosts(data.length === 10);
            } catch (error) {
                console.error('Failed to fetch user posts', error);
            } finally {
                setLoadingPosts(false);
            }
        };
        fetchPosts();
    }, [user?._id, postsPage]);

    useEffect(() => {
        if (!user?._id) return;
        const fetchBookmarks = async () => {
            try {
                setLoadingBookmarks(true);
                const data = await getUserBookmarks(user._id, bookmarksPage, 10);
                setBookmarks(prev => {
                    const newBookmarks = [...prev];
                    data.forEach((p: any) => {
                        if (!newBookmarks.find(existing => existing._id === p._id)) {
                            newBookmarks.push(p);
                        }
                    });
                    return newBookmarks;
                });
                setHasMoreBookmarks(data.length === 10);
            } catch (error) {
                console.error('Failed to fetch user bookmarks', error);
            } finally {
                setLoadingBookmarks(false);
            }
        };
        fetchBookmarks();
    }, [user?._id, bookmarksPage]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                setErrorMsg(null);

                if (isOwnProfile) {
                    const data = await getProfile();
                    setUser(data);
                } else if (id) {
                    const data = await getUserById(id);
                    setUser(data);
                    // Just roughly checking if auth user is in followers list (if passed back)
                    if (data.followers && authUser) {
                        setIsFollowing(data.followers.includes(authUser.id));
                    }
                }
            } catch (err: any) {
                console.error("Failed to fetch profile stats", err);
                setErrorMsg(err.message || "Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id, isOwnProfile, authUser]);

    const handleFollowToggle = async () => {
        if (!id) return;
        try {
            await followUser(id);
            setIsFollowing(!isFollowing);
            setUser((prev: any) => ({
                ...prev,
                followersCount: prev.followersCount + (isFollowing ? -1 : 1)
            }));
            success(isFollowing ? "Unfollowed" : "Followed");
        } catch (err: any) {
            showError(err.message || "Failed to follow user");
        }
    };

    if (errorMsg) {
        return (
            <div className="page-container animate-fade-in flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <Shield size={48} className="text-red-400 mb-4 opacity-50" />
                <h2 className="text-xl font-bold text-white mb-2">User Not Found</h2>
                <p className="text-gray-400 mb-6">{errorMsg}</p>
                <button onClick={() => navigate(-1)} className="btn btn-outline flex items-center gap-2">
                    <ArrowLeft size={16} /> Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header flex justify-between items-center">
                <div className="flex items-center gap-4">
                    {!isOwnProfile && (
                        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <h1 className="page-title m-0">{isOwnProfile ? 'My Profile' : `${user?.name || user?.email?.split('@')[0] || 'User'}'s Profile`}</h1>
                </div>
                {isOwnProfile ? (
                    <Link
                        to="/profile/edit"
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg font-medium transition-colors border border-blue-200 dark:border-blue-900 shadow-sm"
                    >
                        <Edit2 size={16} />
                        Edit Profile
                    </Link>
                ) : (
                    <button
                        onClick={handleFollowToggle}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '0.75rem', fontWeight: 700, transition: 'all 0.2s ease', cursor: 'pointer', border: '1px solid',
                            ...(isFollowing
                                ? { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.2)' }
                                : { backgroundColor: '#4f46e5', color: 'white', borderColor: '#4338ca' })
                        }}
                        onMouseEnter={e => {
                            if (isFollowing) {
                                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                                e.currentTarget.style.color = '#f87171';
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                e.currentTarget.innerText = 'Unfollow';
                            } else {
                                e.currentTarget.style.backgroundColor = '#6366f1';
                            }
                        }}
                        onMouseLeave={e => {
                            if (isFollowing) {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                e.currentTarget.innerText = 'Following';
                            } else {
                                e.currentTarget.style.backgroundColor = '#4f46e5';
                            }
                        }}
                    >
                        {isFollowing ? 'Following' : 'Follow'}
                    </button>
                )}
            </header>

            <div className="glass-card mt-6 profile-card">
                <div className="profile-header">
                    <div className="profile-avatar large">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="profile-titles">
                        <h2>{user?.name || user?.email?.split('@')[0] || 'User Name'}</h2>
                        <p className="mb-3 text-purple-400">@{user?.email?.split('@')[0]}</p>

                        {/* Connection Stats */}
                        {!loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                                <div
                                    className="hover:bg-white/5 rounded-lg transition-colors"
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: '0.5rem' }}
                                    onClick={() => {
                                        setFollowModalType('followers');
                                        setFollowModalOpen(true);
                                    }}
                                >
                                    <span style={{ fontWeight: 'bold', fontSize: '1.125rem', color: 'white' }}>{user?.followersCount || 0}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#c7d2fe', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Users size={12} /> Followers
                                    </span>
                                </div>
                                <div style={{ height: '2rem', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
                                <div
                                    className="hover:bg-white/5 rounded-lg transition-colors"
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: '0.5rem' }}
                                    onClick={() => {
                                        setFollowModalType('following');
                                        setFollowModalOpen(true);
                                    }}
                                >
                                    <span style={{ fontWeight: 'bold', fontSize: '1.125rem', color: 'white' }}>{user?.followingCount || 0}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#c7d2fe', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <UserCheck size={12} /> Following
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <Loader2 className="animate-spin text-indigo-400" size={24} />
                            </div>
                        )}
                    </div>
                </div>

                {isOwnProfile && (
                    <>
                        <div className="divider" style={{ margin: '2rem 0', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>

                        <div className="profile-details">
                            <div className="detail-item">
                                <User className="detail-icon" size={20} />
                                <div className="detail-text">
                                    <span className="label">Full Name</span>
                                    <span className="value">{user?.name || 'Not provided'}</span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <Mail className="detail-icon" size={20} />
                                <div className="detail-text">
                                    <span className="label">Email Address</span>
                                    <span className="value">{user?.email || 'user@example.com'}</span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <Shield className="detail-icon" size={20} />
                                <div className="detail-text">
                                    <span className="label">Security</span>
                                    <span className="value">{user?.isMfaEnabled ? 'MFA Enabled' : 'Standard'}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Tabs Section */}
            <div className="mt-8 mb-12" style={{ 'marginTop': '1rem' }}>
                <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-800 pb-4" style={{ marginBottom: '1rem' }}>
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`btn ${activeTab === 'posts' ? 'btn-primary' : 'btn-outline'} px-6 py-2`}
                    >
                        My Posts
                    </button>
                    <button
                        onClick={() => setActiveTab('bookmarks')}
                        className={`btn ${activeTab === 'bookmarks' ? 'btn-primary' : 'btn-outline'} px-6 py-2`}
                    >
                        Saved Bookmarks
                    </button>
                </div>

                {/* Tab Content */}
                <div className="space-y-4">
                    {activeTab === 'posts' && (
                        <>
                            {posts.length === 0 && !loadingPosts ? (
                                <div className="text-center py-12 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <p className="text-gray-500 dark:text-gray-400">You haven't created any posts yet.</p>
                                </div>
                            ) : (
                                posts.map((post, index) => (
                                    <div key={`post-${post._id}`} ref={posts.length === index + 1 ? lastPostElementRef : null}>
                                        <PostCard post={post} />
                                    </div>
                                ))
                            )}
                            {loadingPosts && (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="animate-spin text-indigo-500" size={24} />
                                </div>
                            )}
                            {!hasMorePosts && posts.length > 0 && (
                                <div className="text-center py-6 text-gray-500 text-sm">You've reached the end of your posts.</div>
                            )}
                        </>
                    )}

                    {activeTab === 'bookmarks' && (
                        <>
                            {bookmarks.length === 0 && !loadingBookmarks ? (
                                <div className="text-center py-12 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <p className="text-gray-500 dark:text-gray-400">You haven't bookmarked any posts yet.</p>
                                </div>
                            ) : (
                                bookmarks.map((post, index) => (
                                    <div key={`bookmark-${post._id}`} ref={bookmarks.length === index + 1 ? lastBookmarkElementRef : null}>
                                        <PostCard post={post} />
                                    </div>
                                ))
                            )}
                            {loadingBookmarks && (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="animate-spin text-indigo-500" size={24} />
                                </div>
                            )}
                            {!hasMoreBookmarks && bookmarks.length > 0 && (
                                <div className="text-center py-6 text-gray-500 text-sm">You've reached the end of your bookmarks.</div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <FollowListModal
                isOpen={followModalOpen}
                onClose={() => setFollowModalOpen(false)}
                userId={user?._id || authUser?.id || ''}
                type={followModalType}
            />
        </div>
    );
};

export default ProfilePage;
