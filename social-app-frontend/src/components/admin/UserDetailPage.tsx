import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, User as UserIcon, Calendar, ArrowLeft, Mail, MapPin, Globe, Loader2 } from 'lucide-react';
import { getUserById, updateUserRole } from '../../api/users';
import { useAuth, type User } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const UserDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { success, error: showError } = useToast();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'admin' | 'moderator' | 'user'>('user');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                if (!id) return;
                const data = await getUserById(id);
                setUser(data);
                setSelectedRole(data.role || 'user');
            } catch (err: any) {
                showError(err.message || 'Failed to fetch user details');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id, showError]);

    const handleRoleChange = async () => {
        if (!user || !id) return;

        try {
            setUpdating(true);
            const data = await updateUserRole(id, selectedRole);
            setUser({ ...user, role: selectedRole });
            success(data.message || 'User role updated successfully');
        } catch (err: any) {
            showError(err.message || 'Failed to update user role');
            setSelectedRole(user.role || 'user'); // Revert on failure
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container flex items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="page-container animate-fade-in">
                <div className="glass-card text-center py-12">
                    <UserIcon size={48} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-300">User not found</h3>
                    <button onClick={() => navigate('/users')} className="btn btn-primary mt-4">
                        <ArrowLeft size={16} /> Back to Directory
                    </button>
                </div>
            </div>
        );
    }

    // Only allow actual admins to change roles, and only if not changing themselves
    const canEditRole = currentUser?.role === 'admin' && currentUser.id !== user.id;

    return (
        <div className="page-container animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <button
                onClick={() => navigate('/users')}
                className="btn btn-outline"
                style={{ marginBottom: '1.5rem', width: 'auto', padding: '0.5rem 1rem', display: 'inline-flex' }}
            >
                <ArrowLeft size={16} />
                Back to Directory
            </button>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Header Banner */}
                <div style={{
                    height: '140px',
                    background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(88, 28, 135, 0.4) 100%)',
                    borderBottom: '1px solid var(--border)',
                    position: 'relative'
                }}>
                    {/* Avatar Profile */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-40px',
                        left: '2rem',
                        width: '90px',
                        height: '90px',
                        borderRadius: '50%',
                        border: '4px solid var(--bg-dark)',
                        background: 'linear-gradient(135deg, var(--primary), #a855f7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: 'white',
                        boxShadow: '0 4px 14px 0 rgba(0,0,0,0.5)'
                    }}>
                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                    </div>
                </div>

                <div style={{ padding: '2rem', paddingTop: '3.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1.5rem', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                                {user.name}
                                {user.role === 'admin' && (
                                    <span style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.25rem 0.5rem', borderRadius: '9999px', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 'normal' }}>
                                        Admin
                                    </span>
                                )}
                                {user.role === 'moderator' && (
                                    <span style={{ fontSize: '0.75rem', background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', padding: '0.25rem 0.5rem', borderRadius: '9999px', border: '1px solid rgba(234, 179, 8, 0.3)', fontWeight: 'normal' }}>
                                        Moderator
                                    </span>
                                )}
                            </h1>
                            <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <Mail size={16} /> {user.email}
                            </p>
                        </div>

                        {canEditRole && (
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid var(--border)',
                                borderRadius: '1rem',
                                padding: '1.25rem',
                                minWidth: '240px'
                            }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Manage Role</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <select
                                        className="input-field"
                                        style={{ padding: '0.75rem 1rem', margin: 0 }}
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value as any)}
                                        disabled={updating}
                                    >
                                        <option value="user" style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>Standard User</option>
                                        <option value="moderator" style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>Moderator</option>
                                        <option value="admin" style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>Administrator</option>
                                    </select>

                                    {selectedRole !== user.role && (
                                        <button
                                            onClick={handleRoleChange}
                                            disabled={updating}
                                            className="btn btn-primary"
                                            style={{ padding: '0.75rem', display: 'flex', justifyContent: 'center' }}
                                        >
                                            {updating ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
                        {/* Profile Details Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', margin: 0 }}>
                                <UserIcon size={20} style={{ color: 'var(--primary)' }} />
                                Profile Details
                            </h3>

                            <div>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Bio</span>
                                {user.bio ? (
                                    <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', margin: 0 }}>{user.bio}</p>
                                ) : (
                                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, fontSize: '0.95rem' }}>No bio provided.</p>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {user.location && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                        <MapPin size={18} style={{ color: 'var(--text-muted)' }} />
                                        {user.location}
                                    </div>
                                )}
                                {user.website && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                        <Globe size={18} style={{ color: 'var(--text-muted)' }} />
                                        <a href={user.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                            {user.website}
                                        </a>
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                    <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
                                    Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        {/* Security & Interests Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', margin: 0 }}>
                                <Shield size={20} style={{ color: 'var(--primary)' }} />
                                Security & Interests
                            </h3>

                            <div>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>Platform Interests</span>
                                {user.interests && user.interests.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {user.interests.map((interest, i) => (
                                            <span key={i} style={{
                                                fontSize: '0.8rem',
                                                padding: '0.35rem 0.75rem',
                                                borderRadius: '0.5rem',
                                                background: 'rgba(139, 92, 246, 0.1)',
                                                color: '#c4b5fd',
                                                border: '1px solid rgba(139, 92, 246, 0.2)'
                                            }}>
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, fontSize: '0.95rem' }}>No interests selected.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailPage;
