import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Edit2 } from 'lucide-react';

const ProfilePage = () => {
    const { user } = useAuth();

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
                        <p>Premium Member</p>
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
        </div>
    );
};

export default ProfilePage;
