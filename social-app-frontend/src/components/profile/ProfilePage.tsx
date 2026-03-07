import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Edit2, Users, UserCheck, Loader2, ArrowLeft } from 'lucide-react';
import { getProfile, getUserById, followUser } from '../../api/users';
import { useToast } from '../../context/ToastContext';
import { FollowListModal } from './FollowListModal';

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
