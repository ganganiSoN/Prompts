import React, { useEffect, useState } from 'react';
import { X, Loader2, User as UserIcon } from 'lucide-react';
import { getFollowers, getFollowing, followUser } from '../../api/users';
import { useNavigate } from 'react-router-dom';

interface FollowListModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    type: 'followers' | 'following';
}

export const FollowListModal: React.FC<FollowListModalProps> = ({ isOpen, onClose, userId, type }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isOpen || !userId) return;

        const fetchList = async () => {
            setLoading(true);
            try {
                const data = type === 'followers'
                    ? await getFollowers(userId)
                    : await getFollowing(userId);
                setUsers(data);
            } catch (error) {
                console.error(`Failed to fetch ${type}:`, error);
            } finally {
                setLoading(false);
            }
        };

        fetchList();
    }, [isOpen, userId, type]);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)'
            }}
            className="animate-fade-in"
        >
            <div
                style={{
                    backgroundColor: '#1a1f2e',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.75rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    width: '100%',
                    maxWidth: '28rem',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '80vh'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, textTransform: 'capitalize', color: 'white', margin: 0 }}>
                        {type}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{ padding: '0.25rem', borderRadius: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                            <Loader2 className="animate-spin text-indigo-400" size={32} />
                        </div>
                    ) : users.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                            No {type} found.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {users.map((u) => (
                                <div
                                    key={u._id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                                    }}
                                >
                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flex: 1 }}
                                        onClick={() => {
                                            onClose();
                                            navigate(`/users/${u._id}`);
                                        }}
                                    >
                                        <div style={{
                                            width: '2.5rem',
                                            height: '2.5rem',
                                            borderRadius: '9999px',
                                            backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                            color: '#a5b4fc',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold'
                                        }}>
                                            {u.name ? u.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 500, color: 'white', fontSize: '0.875rem', margin: 0 }}>{u.name}</p>
                                            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>{u.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-outline"
                                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: 'transparent', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClose();
                                            navigate(`/users/${u._id}`);
                                        }}
                                    >
                                        View
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
