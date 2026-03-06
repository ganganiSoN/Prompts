import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield } from 'lucide-react';

const ProfilePage = () => {
    const { user } = useAuth();

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header">
                <h1 className="page-title">My Profile</h1>
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
