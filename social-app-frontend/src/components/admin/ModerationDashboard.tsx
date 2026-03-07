import { useState, useEffect } from 'react';
import { getReports, updateReport, getUserModerationGrid } from '../../api/moderation';
import { useToast } from '../../context/ToastContext';
import { Shield, CheckCircle, AlertTriangle, EyeOff, Ban, Clock, Loader2, ChevronDown, UserSearch, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';

export const ModerationDashboard = () => {
    const { user } = useAuth();
    const { success, error: showError } = useToast();

    // Tabs state
    const [activeTab, setActiveTab] = useState<'queue' | 'user'>('queue');

    // Queue state
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [processingId, setProcessingId] = useState<string | null>(null);

    // User Search State
    const [searchUserId, setSearchUserId] = useState('');
    const [userGridData, setUserGridData] = useState<any[]>([]);
    const [userData, setUserData] = useState<any>(null);
    const [loadingUser, setLoadingUser] = useState(false);

    // Advanced Grid Filter State
    const [gridMinRisk, setGridMinRisk] = useState<string>('');
    const [gridMaxRisk, setGridMaxRisk] = useState<string>('');
    const [gridCategory, setGridCategory] = useState<string>('ALL');
    const [gridCommunity, setGridCommunity] = useState<string>('ALL');
    const [gridStatus, setGridStatus] = useState<string>('ALL');
    const [gridDateRange, setGridDateRange] = useState<string>('ALL');

    // Redirect non-admins/moderators
    if (user && user.role !== 'admin' && user.role !== 'moderator') {
        return <Navigate to="/" />;
    }

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await getReports({ status: filter });
            setReports(data.reports || []);
        } catch (err: any) {
            showError(err.message || 'Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    };

    const [modTickets, setModTickets] = useState<any[]>([]);

    useEffect(() => {
        // Connect to the backend socket for real-time AI moderation tickets
        const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const socketUrl = baseApiUrl.replace('/api', '');

        const socket = io(socketUrl);

        socket.on('connect', () => {
            socket.emit('join_room', 'moderator_dashboard');
        });

        socket.on('new_mod_ticket', (payload) => {
            setModTickets(prev => [payload, ...prev]);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        fetchReports();
    }, [filter]);

    const handleAction = async (reportId: string, actionCategory: string, decision?: string) => {
        setProcessingId(reportId);
        try {
            let payload: any = {};

            if (actionCategory === 'DISMISS') {
                payload = { status: 'CLOSED', decision: 'DISMISSED' };
            } else if (actionCategory === 'RESOLVE') {
                payload = { status: 'CLOSED', decision: decision };
            } else if (actionCategory === 'REVIEW') {
                payload = { status: 'MODERATOR_REVIEW' };
            }

            await updateReport(reportId, payload);
            success(`Report updated successfully!`);
            fetchReports(); // Refresh the list
        } catch (err: any) {
            showError(err.message || 'Failed to update report');
        } finally {
            setProcessingId(null);
        }
    };

    const fetchUserGridData = async (userIdToSearch: string) => {
        if (!userIdToSearch.trim()) return;
        setLoadingUser(true);
        try {
            const data = await getUserModerationGrid(userIdToSearch.trim(), {
                minRisk: gridMinRisk,
                maxRisk: gridMaxRisk,
                category: gridCategory,
                community: gridCommunity,
                status: gridStatus,
                dateRange: gridDateRange
            });
            setUserData(data.user);
            setUserGridData(data.gridData || []);
        } catch (err: any) {
            showError(err.message || 'Failed to find user or their moderation data');
            setUserData(null);
            setUserGridData([]);
        } finally {
            setLoadingUser(false);
        }
    };

    const handleSearchUser = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUserGridData(searchUserId);
    };

    useEffect(() => {
        if (userData && searchUserId) {
            fetchUserGridData(searchUserId);
        }
        // eslint-disable-next-line
    }, [gridMinRisk, gridMaxRisk, gridCategory, gridCommunity, gridStatus, gridDateRange]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SUBMITTED':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">New</span>;
            case 'AUTO_RISK_SCORING':
            case 'MODERATOR_REVIEW':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 flex items-center gap-1"><Clock size={12} /> Under Review</span>;
            case 'ESCALATED':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Escalated</span>;
            case 'CLOSED':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Closed</span>;
            default:
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">{status}</span>;
        }
    };

    return (
        <div className="page-container max-w-5xl mx-auto animate-fade-in w-full">
            <header className="page-header mt-4 mb-6 flex flex-col gap-6">
                <div className="flex justify-between items-end flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-500/10 rounded-xl">
                            <Shield size={28} className="text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Moderation</h1>
                            <p className="text-sm text-gray-500">Review community reports and profiles.</p>
                        </div>
                    </div>

                    {activeTab === 'queue' && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.5rem', borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            {[
                                { id: 'ALL', label: 'All Reports' },
                                { id: 'SUBMITTED', label: 'New' },
                                { id: 'AUTO_RISK_SCORING', label: 'Auto Risk Scoring' },
                                { id: 'MODERATOR_REVIEW', label: 'Under Review' },
                                { id: 'ESCALATED', label: 'Escalated' },
                                { id: 'CLOSED', label: 'Closed' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setFilter(opt.id)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.75rem',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        border: filter === opt.id ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.1)',
                                        background: filter === opt.id ? 'linear-gradient(135deg, var(--primary), #a855f7)' : 'rgba(15, 23, 42, 0.4)',
                                        color: filter === opt.id ? 'white' : '#94a3b8',
                                        boxShadow: filter === opt.id ? '0 4px 14px 0 rgba(139, 92, 246, 0.39)' : 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (filter !== opt.id) {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                            e.currentTarget.style.color = '#fff';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (filter !== opt.id) {
                                            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)';
                                            e.currentTarget.style.color = '#94a3b8';
                                        }
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', padding: '0.4rem', borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.1)', maxWidth: '400px' }}>
                    <button
                        onClick={() => setActiveTab('queue')}
                        style={{
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.65rem 1rem',
                            borderRadius: '0.75rem',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: activeTab === 'queue' ? '1px solid transparent' : '1px solid transparent',
                            background: activeTab === 'queue' ? '#1e293b' : 'transparent',
                            color: activeTab === 'queue' ? 'white' : '#94a3b8',
                            boxShadow: activeTab === 'queue' ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (activeTab !== 'queue') {
                                e.currentTarget.style.color = '#fff';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeTab !== 'queue') {
                                e.currentTarget.style.color = '#94a3b8';
                                e.currentTarget.style.background = 'transparent';
                            }
                        }}
                    >
                        <Shield size={18} /> Queue
                    </button>
                    <button
                        onClick={() => setActiveTab('user')}
                        style={{
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.65rem 1rem',
                            borderRadius: '0.75rem',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: activeTab === 'user' ? '1px solid transparent' : '1px solid transparent',
                            background: activeTab === 'user' ? '#1e293b' : 'transparent',
                            color: activeTab === 'user' ? 'white' : '#94a3b8',
                            boxShadow: activeTab === 'user' ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (activeTab !== 'user') {
                                e.currentTarget.style.color = '#fff';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeTab !== 'user') {
                                e.currentTarget.style.color = '#94a3b8';
                                e.currentTarget.style.background = 'transparent';
                            }
                        }}
                    >
                        <UserSearch size={18} /> User Search
                    </button>
                </div>
            </header>

            {activeTab === 'user' && (
                <div className="animate-fade-in">
                    <form onSubmit={handleSearchUser} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: '28rem' }}>
                            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={20} />
                            <input
                                type="text"
                                value={searchUserId}
                                onChange={(e) => setSearchUserId(e.target.value)}
                                placeholder="Enter User ID..."
                                style={{
                                    width: '100%',
                                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '0.75rem',
                                    padding: '0.75rem 1rem 0.75rem 3rem',
                                    outline: 'none',
                                    transition: 'all 0.2s ease'
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#8b5cf6';
                                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.25)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loadingUser || !searchUserId.trim()}
                            className="btn btn-primary"
                            style={{ width: 'auto', padding: '0.75rem 2rem', opacity: (loadingUser || !searchUserId.trim()) ? 0.5 : 1 }}
                        >
                            {loadingUser ? <Loader2 size={20} className="animate-spin" /> : 'Search'}
                        </button>
                    </form>

                    {userData && (
                        <div className="fade-in" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(30, 41, 59, 0.4)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '140px' }}>
                                <label style={{ fontSize: '0.625rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Score</label>
                                <select
                                    value={gridMinRisk + '-' + gridMaxRisk}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'ALL') { setGridMinRisk(''); setGridMaxRisk(''); }
                                        else {
                                            const [min, max] = val.split('-');
                                            setGridMinRisk(min);
                                            setGridMaxRisk(max);
                                        }
                                    }}
                                    className="custom-select bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm py-2 px-3 rounded-lg"
                                >
                                    <option value="ALL">All Scores</option>
                                    <option value="0.8-">High (&gt;80%)</option>
                                    <option value="0.5-0.8">Medium (50-80%)</option>
                                    <option value="-0.5">Low (&lt;50%)</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '140px' }}>
                                <label style={{ fontSize: '0.625rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                                <select value={gridCategory} onChange={e => setGridCategory(e.target.value)} className="custom-select bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm py-2 px-3 rounded-lg">
                                    <option value="ALL">All Types</option>
                                    <option value="Hate Speech">Hate Speech</option>
                                    <option value="Spam">Spam</option>
                                    <option value="Misinformation">Misinformation</option>
                                    <option value="Harassment">Harassment</option>
                                    <option value="NSFW">NSFW</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '140px' }}>
                                <label style={{ fontSize: '0.625rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Community</label>
                                <select value={gridCommunity} onChange={e => setGridCommunity(e.target.value)} className="custom-select bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm py-2 px-3 rounded-lg">
                                    <option value="ALL">All Communities</option>
                                    <option value="General">General</option>
                                    <option value="Tech">Tech</option>
                                    <option value="Art">Art</option>
                                    <option value="Gaming">Gaming</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '140px' }}>
                                <label style={{ fontSize: '0.625rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                                <select value={gridStatus} onChange={e => setGridStatus(e.target.value)} className="custom-select bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm py-2 px-3 rounded-lg">
                                    <option value="ALL">All Statuses</option>
                                    <option value="PUBLISHED">Published</option>
                                    <option value="FLAGGED">Flagged</option>
                                    <option value="UNDER_REVIEW">Under Review</option>
                                    <option value="REMOVED">Removed</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '140px' }}>
                                <label style={{ fontSize: '0.625rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</label>
                                <select value={gridDateRange} onChange={e => setGridDateRange(e.target.value)} className="custom-select bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm py-2 px-3 rounded-lg">
                                    <option value="ALL">All Time</option>
                                    <option value="7">Last 7 Days</option>
                                    <option value="30">Last 30 Days</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {userData && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(30, 41, 59, 0.6)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ width: '3rem', height: '3rem', borderRadius: '9999px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: 700, color: '#818cf8' }}>
                                {userData.name?.[0] || userData.email?.[0] || '?'}
                            </div>
                            <div>
                                <h3 style={{ fontWeight: 700, color: 'white', margin: 0 }}>{userData.name || 'Unknown'}</h3>
                                <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: '0.25rem 0 0 0' }}>@{userData.email?.split('@')[0]} • Joined {new Date(userData.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                                <span style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: '9999px', ...(userData.status === 'SUSPENDED' ? { background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' } : userData.status === 'WARNED' ? { background: 'rgba(249, 115, 22, 0.2)', color: '#fdba74' } : { background: 'rgba(34, 197, 94, 0.2)', color: '#86efac' }) }}>
                                    {userData.status || 'ACTIVE'}
                                </span>
                            </div>
                        </div>
                    )}

                    {(!userGridData || userGridData.length === 0) && userData && !loadingUser ? (
                        <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
                            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">No offenses found</h3>
                            <p className="text-gray-500 mt-2">This user has no reported posts.</p>
                        </div>
                    ) : userGridData.length > 0 && (
                        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '800px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', fontWeight: 600 }}>
                                            <th style={{ padding: '1rem' }}>Post ID</th>
                                            <th style={{ padding: '1rem' }}>User</th>
                                            <th style={{ padding: '1rem', textAlign: 'center' }}>Risk Score</th>
                                            <th style={{ padding: '1rem', textAlign: 'center' }}>Reports</th>
                                            <th style={{ padding: '1rem' }}>Top Category</th>
                                            <th style={{ padding: '1rem' }}>Status</th>
                                            <th style={{ padding: '1rem' }}>Created Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userGridData.map((row) => (
                                            <tr
                                                key={row.postId}
                                                style={{ transition: 'background-color 0.2s', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <td style={{ padding: '1rem', fontSize: '0.875rem', fontFamily: 'monospace', color: '#9ca3af' }}>{row.postId.substring(0, 8)}...</td>
                                                <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 500, color: 'white' }}>@{userData.email?.split('@')[0]}</td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: row.riskScore > 0.8 ? '#ef4444' : row.riskScore > 0.5 ? '#f97316' : '#22c55e' }}>
                                                        {Math.round(row.riskScore * 100)}%
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 700, color: '#d1d5db' }}>{row.reportCount}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '0.25rem', backgroundColor: 'rgba(55, 65, 81, 0.5)', color: '#d1d5db' }}>
                                                        {row.category}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>{getStatusBadge(row.status || 'UNKNOWN')}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                                                    {new Date(row.createdDate).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'queue' && (
                <div className="animate-fade-in">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-red-500" size={32} />
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">All clear!</h3>
                            <p className="text-gray-500 mt-2">There are currently no reports pending your review.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Real-Time AI Mod Tickets */}
                            {modTickets.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-bold mb-4 text-orange-500 flex items-center gap-2">
                                        <AlertTriangle /> AI Moderation Alerts (Real-Time)
                                    </h3>
                                    <div className="space-y-4">
                                        {modTickets.map((ticket, index) => (
                                            <div key={`mod-${index}`} className="glass-card p-5 border border-l-4 border-l-orange-500 shadow-lg relative bg-gray-50 dark:bg-gray-800">
                                                <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
                                                    <div>
                                                        <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 font-bold rounded-lg mb-2 inline-block shadow-sm">
                                                            Risk Level: {Math.round(ticket.ai_toxicity_score)}/100
                                                        </span>
                                                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                                                            <strong>AI Tags: </strong>
                                                            {ticket.moderation_reasons?.join(', ')}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors border-none cursor-pointer"
                                                            onClick={() => {
                                                                setModTickets(prev => prev.filter((_, i) => i !== index));
                                                                success("Ticket Ignored as Safe");
                                                            }}
                                                        >
                                                            Ignore (Safe)
                                                        </button>
                                                        <button
                                                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors border-none cursor-pointer"
                                                            onClick={() => {
                                                                setModTickets(prev => prev.filter((_, i) => i !== index));
                                                                success("Post Confirmed Deleted");
                                                            }}
                                                        >
                                                            Confirm Delete
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                                                    <div className="text-sm line-clamp-3 overflow-hidden text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: ticket.post?.content || 'No text content available' }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Standard Reports Queue */}
                            {reports.length > 0 && (
                                <div>
                                    {modTickets.length > 0 && (
                                        <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2 border-t border-gray-200 dark:border-gray-800 pt-6">
                                            Standard Queue
                                        </h3>
                                    )}
                                    <div className="space-y-4">
                                        {reports.map((report) => (
                                            <div key={report._id} className="glass-card p-5 border-l-4 border-l-red-500 transition-all hover:shadow-md">
                                                <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {getStatusBadge(report.status)}
                                                            <span className="text-xs text-gray-400">
                                                                Reported {new Date(report.createdAt).toLocaleDateString()}
                                                            </span>
                                                            {report.aiToxicityScore > 0.85 && (
                                                                <span className="flex items-center gap-1 text-xs text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                                                                    <AlertTriangle size={12} /> High Toxicity ({Math.round(report.aiToxicityScore * 100)}%)
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                            Reason: {report.reason}
                                                        </h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            Reported by <span className="font-medium text-indigo-500">@{report.reporter?.name || report.reporter?.email?.split('@')[0]}</span>
                                                        </p>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <button
                                                            onClick={() => handleAction(report._id, 'DISMISS')}
                                                            disabled={processingId === report._id || report.status === 'CLOSED'}
                                                            style={{
                                                                padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.5rem',
                                                                background: 'rgba(255, 255, 255, 0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s',
                                                                opacity: (processingId === report._id || report.status === 'CLOSED') ? 0.5 : 1
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                                        >
                                                            Dismiss
                                                        </button>

                                                        <div
                                                            style={{ position: 'relative', paddingBottom: '0.5rem', marginBottom: '-0.5rem' }}
                                                            onMouseEnter={(e) => { const menu = e.currentTarget.querySelector('.dropdown-menu') as HTMLElement; if (menu) menu.style.display = 'block'; }}
                                                            onMouseLeave={(e) => { const menu = e.currentTarget.querySelector('.dropdown-menu') as HTMLElement; if (menu) menu.style.display = 'none'; }}
                                                        >
                                                            <button
                                                                disabled={processingId === report._id || report.status === 'CLOSED'}
                                                                style={{
                                                                    padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem',
                                                                    background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                                                    opacity: (processingId === report._id || report.status === 'CLOSED') ? 0.5 : 1
                                                                }}
                                                                onMouseEnter={e => e.currentTarget.style.background = '#4f46e5'}
                                                                onMouseLeave={e => e.currentTarget.style.background = '#6366f1'}
                                                            >
                                                                Take Action <ChevronDown size={14} />
                                                            </button>
                                                            <div
                                                                className="dropdown-menu"
                                                                style={{
                                                                    display: 'none', position: 'absolute', right: 0, top: '100%', marginTop: '0.4rem', width: '13rem',
                                                                    background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                    padding: '0.5rem 0', zIndex: 10, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                                                                }}
                                                            >
                                                                <button
                                                                    onClick={() => handleAction(report._id, 'RESOLVE', 'REMOVED')}
                                                                    style={{ width: '100%', textAlign: 'left', padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#fca5a5', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.1s' }}
                                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                                >
                                                                    <EyeOff size={14} /> Remove Post
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAction(report._id, 'RESOLVE', 'USER_WARNED')}
                                                                    style={{ width: '100%', textAlign: 'left', padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#fdba74', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.1s' }}
                                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)'}
                                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                                >
                                                                    <AlertTriangle size={14} /> Warn User + Remove
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAction(report._id, 'RESOLVE', 'USER_SUSPENDED')}
                                                                    style={{ width: '100%', textAlign: 'left', padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 700, background: 'transparent', borderTop: '1px solid rgba(255, 255, 255, 0.05)', borderBottom: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', paddingTop: '0.5rem', transition: 'all 0.1s' }}
                                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                                >
                                                                    <Ban size={14} /> Suspend Author
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Offending Content Preview */}
                                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Offending Content (ID: {report.post?._id})</p>
                                                    {report.post ? (
                                                        <>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                                                                    {report.post.author?.name?.[0] || report.post.author?.email?.[0] || '?'}
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    @{report.post.author?.name || report.post.author?.email?.split('@')[0]}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3 overflow-hidden" dangerouslySetInnerHTML={{ __html: report.post.content }} />
                                                        </>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 italic">This post has already been fully deleted from the database.</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
