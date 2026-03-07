import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Edit2, Users, UserCheck, Loader2 } from 'lucide-react';
import { getProfile } from '../../api/users';
import { FollowListModal } from './FollowListModal';

const ProfilePage = () => {
    const { user: authUser } = useAuth();
    const [user, setUser] = useState<any>(authUser);
    const [loading, setLoading] = useState(true);
    const [followModalOpen, setFollowModalOpen] = useState(false);
    const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getProfile();
                setUser(data);
            } catch (error) {
                console.error("Failed to fetch profile stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header flex justify-between items-center">
                <h1 className="page-title">My Profile</h1>
                <Link
                    to="/profile/edit"
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg font-medium transition-colors border border-blue-200 dark:border-blue-900 shadow-sm"
                >
                    <Edit2 size={16} />
                    Edit Profile
                </Link>
            </header>

            <div className="glass-card mt-6 profile-card">
                <div className="profile-header">
                    <div className="profile-avatar large">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="profile-titles">
                        <h2>{user?.name || 'User Name'}</h2>
                        <p className="mb-3">Premium Member</p>

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

                <div className="divider"></div>

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
                            <span className="value">MFA {user?.isMfaEnabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                    </div>
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
